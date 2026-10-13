import pandas as pd
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor

class CrimeForecaster:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def forecast_district(self, district: str, horizon_years: int = 3) -> dict:
        """Forecasts crime count trends for a specific district over future years."""
        d_df = self.df[self.df['district'].str.lower() == district.lower()]
        
        if d_df.empty:
            return {"error": f"No data found for district: {district}"}

        # Aggregate annual case counts
        annual_data = d_df.groupby('year')['cases'].sum().reset_index().sort_values('year')
        
        X = annual_data[['year']].values
        y = annual_data['cases'].values

        if len(X) < 3:
            return {"error": "Insufficient historical data points for forecasting."}

        # Train a light Ridge Regression baseline for robust linear trends
        model = Ridge(alpha=1.0)
        model.fit(X, y)

        last_year = int(annual_data['year'].max())
        future_years = np.array([[last_year + i] for i in range(1, horizon_years + 1)])
        predictions = model.predict(future_years)

        # Standard error estimation for confidence intervals
        residuals = y - model.predict(X)
        std_err = np.std(residuals) if len(residuals) > 1 else 10.0

        historical = [
            {"year": int(row['year']), "cases": int(row['cases']), "type": "historical"}
            for _, row in annual_data.iterrows()
        ]

        forecasted = [
            {
                "year": int(fy[0]),
                "cases": max(0, int(pred)),
                "ci_lower": max(0, int(pred - 1.96 * std_err)),
                "ci_upper": int(pred + 1.96 * std_err),
                "type": "forecast"
            }
            for fy, pred in zip(future_years, predictions)
        ]

        return {
            "district": district.title(),
            "historical": historical,
            "forecast": forecasted,
            "r2_score": round(float(model.score(X, y)), 3)
        }
