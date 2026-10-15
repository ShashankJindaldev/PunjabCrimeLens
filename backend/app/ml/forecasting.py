import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

Z_95 = 1.96                 # z-value for the confidence band
MIN_POINTS_TOURNAMENT = 5   # need at least this many years to compare models fairly
IMPROVEMENT_NEEDED = 0.95   # a more complex model must be >=5% better to win
GROWTH_CAP = 2.5            # a forecast may not exceed 2.5x the historical maximum


# ---------------------------------------------------------------------------
# Candidate models. Everything is plain scikit-learn (no new dependencies).
# The input "t" is years since the first year in the data (0, 1, 2, ...), which
# keeps the polynomial maths numerically stable; StandardScaler does the rest.
# ---------------------------------------------------------------------------
def _make_ridge():
    return Pipeline([("scale", StandardScaler()), ("model", Ridge(alpha=0.3))])


def _make_linear():
    return LinearRegression()


def _make_poly(degree: int, alpha: float):
    def factory():
        return Pipeline([
            ("poly", PolynomialFeatures(degree=degree, include_bias=False)),
            ("scale", StandardScaler()),
            ("model", Ridge(alpha=alpha)),
        ])
    return factory


def _candidates(n_points: int) -> list:
    """Listed from simplest to most complex (ties go to the simpler model)."""
    models = [
        {"name": "Ridge Regression", "degree": 1, "factory": _make_ridge},
        {"name": "Linear Regression", "degree": 1, "factory": _make_linear},
        {"name": "Polynomial Ridge (degree 2)", "degree": 2, "factory": _make_poly(2, 0.5)},
    ]
    if n_points >= 8:
        models.append(
            {"name": "Polynomial Ridge (degree 3)", "degree": 3, "factory": _make_poly(3, 1.0)}
        )
    return models


class CrimeForecaster:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    # ------------------------------------------------------------------
    # Anomaly detection (unchanged behaviour)
    # ------------------------------------------------------------------
    def detect_anomalies(self, annual_data: pd.DataFrame) -> pd.DataFrame:
        """Flags years where case counts deviate by more than 2 standard deviations."""
        mean_cases = annual_data['cases'].mean()
        std_cases = annual_data['cases'].std()

        if std_cases > 0:
            annual_data['z_score'] = (annual_data['cases'] - mean_cases) / std_cases
        else:
            annual_data['z_score'] = 0.0

        annual_data['is_anomaly'] = annual_data['z_score'].abs() > 2.0
        return annual_data

    # ------------------------------------------------------------------
    # Model selection
    # ------------------------------------------------------------------
    @staticmethod
    def _rolling_cv(factory, t: np.ndarray, y: np.ndarray) -> float:
        """
        Rolling-origin cross-validation: repeatedly train on the first k years and
        predict year k+1. Returns the RMSE of those one-step-ahead forecasts.

        This replaces ranking models by in-sample R^2, which always rewards the most
        flexible model (a Random Forest memorises the past and then flatlines).
        """
        n = len(y)
        min_train = max(3, n // 2)
        errors = []
        for k in range(min_train, n):
            try:
                model = factory()
                model.fit(t[:k], y[:k])
                errors.append(float(y[k] - model.predict(t[k:k + 1])[0]))
            except Exception:
                return float("inf")
        if not errors:
            return float("inf")
        return float(np.sqrt(np.mean(np.square(errors))))

    def _run_tournament(self, t: np.ndarray, y: np.ndarray):
        """Returns (winner, all_scored_candidates)."""
        n = len(y)
        if n < MIN_POINTS_TOURNAMENT:
            # Too few years to compare models fairly: use the simplest honest trend line.
            only = {"name": "Linear Regression", "degree": 1, "factory": _make_linear, "rmse": None}
            return only, [only]

        scored = []
        for cand in _candidates(n):
            scored.append({**cand, "rmse": self._rolling_cv(cand["factory"], t, y)})

        winner = None
        for cand in scored:
            if not np.isfinite(cand["rmse"]):
                continue
            if winner is None or cand["rmse"] < winner["rmse"] * IMPROVEMENT_NEEDED:
                winner = cand

        if winner is None:
            winner = next(c for c in scored if c["name"] == "Linear Regression")
        return winner, scored

    @staticmethod
    def _is_implausible(preds: np.ndarray, y: np.ndarray) -> bool:
        """Guardrail for curved models: no negative cases, no explosive growth."""
        return bool(np.min(preds) < 0 or np.max(preds) > GROWTH_CAP * np.max(y))

    @staticmethod
    def _interval_factor(t_train: np.ndarray, t_future: np.ndarray) -> np.ndarray:
        """
        Approximate prediction-interval inflation (from the linear-trend formula):
        the further a forecast is from the centre of the data, the wider its band.
        """
        n = len(t_train)
        mean_t = float(t_train.mean())
        sxx = float(((t_train - mean_t) ** 2).sum())
        if sxx <= 0:
            return np.full(len(t_future), np.sqrt(1.0 + 1.0 / n))
        return np.sqrt(1.0 + 1.0 / n + (t_future - mean_t) ** 2 / sxx)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def forecast_district(self, district: str, horizon_years: int = 3) -> dict:
        horizon_years = max(1, int(horizon_years))

        d_df = self.df[
            self.df['district'].astype(str).str.strip().str.lower() == district.strip().lower()
        ]

        if d_df.empty:
            return {"error": f"No data found for district: {district}"}

        annual_data = (
            d_df.groupby('year')['cases'].sum().reset_index().sort_values('year').reset_index(drop=True)
        )

        if len(annual_data) < 3:
            return {"error": "Insufficient historical data points for forecasting."}

        # Apply Early Warning / Anomaly Detection
        annual_data = self.detect_anomalies(annual_data)

        years = annual_data['year'].astype(int).values
        y = annual_data['cases'].astype(float).values
        first_year = int(years[0])
        last_year = int(years[-1])

        t = (years - first_year).astype(float).reshape(-1, 1)
        future_years = np.arange(last_year + 1, last_year + horizon_years + 1)
        t_future = (future_years - first_year).astype(float).reshape(-1, 1)

        # AutoML-Lite: model tournament scored on out-of-sample (rolling) error
        chosen, scored = self._run_tournament(t, y)
        model = chosen["factory"]()
        model.fit(t, y)
        predictions = model.predict(t_future)
        selected_name = chosen["name"]

        # Guardrail: if a curved model projects nonsense, fall back to the best straight line
        if chosen["degree"] > 1 and self._is_implausible(predictions, y):
            linear_options = [
                c for c in scored
                if c["degree"] == 1 and c["rmse"] is not None and np.isfinite(c["rmse"])
            ]
            fallback = (
                min(linear_options, key=lambda c: c["rmse"])
                if linear_options
                else {"name": "Linear Regression", "degree": 1, "factory": _make_linear, "rmse": None}
            )
            chosen = fallback
            model = chosen["factory"]()
            model.fit(t, y)
            predictions = model.predict(t_future)
            selected_name = f"{chosen['name']} (fallback)"

        fitted = model.predict(t)
        r2 = float(r2_score(y, fitted))

        # Uncertainty: honest out-of-sample error, widening with the forecast horizon
        dof = max(1, len(y) - (chosen["degree"] + 1))
        in_sample_sigma = float(np.sqrt(np.sum((y - fitted) ** 2) / dof))
        cv_rmse = chosen["rmse"] if chosen["rmse"] is not None and np.isfinite(chosen["rmse"]) else 0.0
        sigma = max(in_sample_sigma, cv_rmse, 0.02 * float(y.mean()), 1.0)
        half_width = Z_95 * sigma * self._interval_factor(t, t_future.ravel())

        # Curved models are much less certain far from the data, so widen their band faster
        if chosen["degree"] > 1:
            steps_ahead = np.arange(1, horizon_years + 1)
            half_width = half_width * (1.0 + 0.25 * (chosen["degree"] - 1) * steps_ahead)

        historical = []
        for _, row in annual_data.iterrows():
            historical.append({
                "year": int(row['year']),
                "cases": int(row['cases']),
                "type": "historical",
                "z_score": round(float(row['z_score']), 2),
                "is_anomaly": bool(row['is_anomaly'])
            })

        forecasted = []
        for fy, pred, half in zip(future_years, predictions, half_width):
            p = max(0.0, float(pred))
            forecasted.append({
                "year": int(fy),
                "cases": int(round(p)),
                "ci_lower": max(0, int(np.floor(p - half))),
                "ci_upper": int(np.ceil(p + half)),
                "type": "forecast"
            })

        return {
            "district": district.title(),
            "selected_model": selected_name,
            "historical": historical,
            "forecast": forecasted,
            "r2_score": round(r2, 3)
        }