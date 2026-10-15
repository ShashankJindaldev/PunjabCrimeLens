import pandas as pd
import numpy as np
from sklearn.linear_model import Ridge, LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

class CrimeForecaster:
    def __init__(self, df: pd.DataFrame):
        self.df = df

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

    def forecast_district(self, district: str, horizon_years: int = 3) -> dict:
        d_df = self.df[self.df['district'].str.lower() == district.lower()]
        
        if d_df.empty:
            return {"error": f"No data found for district: {district}"}

        annual_data = d_df.groupby('year')['cases'].sum().reset_index().sort_values('year')

        if len(annual_data) < 3:
            return {"error": "Insufficient historical data points for forecasting."}

        # Apply Early Warning / Anomaly Detection
        annual_data = self.detect_anomalies(annual_data)

        X = annual_data[['year']].values
        y = annual_data['cases'].values

        # AutoML-Lite: Dynamic Model Tournament
        models = {
            "Ridge Regression": Ridge(alpha=1.0),
            "Linear Regression": LinearRegression(),
            # Restricted to prevent overfitting on small district datasets
            "Random Forest": RandomForestRegressor(n_estimators=15, max_depth=2, random_state=42)
        }

        best_model_name = None
        best_model = None
        best_score = -float('inf')
        best_preds = None

        for name, model in models.items():
            model.fit(X, y)
            preds = model.predict(X)
            score = r2_score(y, preds)
            
            if score > best_score:
                best_score = score
                best_model = model
                best_model_name = name
                best_preds = preds

        last_year = int(annual_data['year'].max())
        future_years = np.array([[last_year + i] for i in range(1, horizon_years + 1)])
        predictions = best_model.predict(future_years)

        residuals = y - best_preds
        std_err = np.std(residuals) if len(residuals) > 1 else 10.0

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
        for fy, pred in zip(future_years, predictions):
            forecasted.append({
                "year": int(fy[0]),
                "cases": max(0, int(pred)),
                "ci_lower": max(0, int(pred - 1.96 * std_err)),
                "ci_upper": int(pred + 1.96 * std_err),
                "type": "forecast"
            })

        return {
            "district": district.title(),
            "selected_model": best_model_name,
            "historical": historical,
            "forecast": forecasted,
            "r2_score": round(best_score, 3)
        }