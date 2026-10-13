import pandas as pd
import numpy as np

def calculate_district_risks(df: pd.DataFrame) -> list:
    """Calculates risk levels (Low, Medium, High, Critical) for all districts based on recent volume and YoY growth."""
    if df is None or df.empty:
        return []

    # Get most recent year in dataset
    latest_year = df['year'].max()
    prev_year = latest_year - 1

    curr_df = df[df['year'] == latest_year].groupby('district')['cases'].sum().reset_index()
    prev_df = df[df['year'] == prev_year].groupby('district')['cases'].sum().reset_index()

    merged = pd.merge(curr_df, prev_df, on='district', how='left', suffixes=('_curr', '_prev')).fillna(0)
    merged['yoy_growth_%'] = np.where(
        merged['cases_prev'] > 0,
        ((merged['cases_curr'] - merged['cases_prev']) / merged['cases_prev']) * 100,
        0.0
    )

    # Quantile risk assignment
    q25, q50, q75 = merged['cases_curr'].quantile([0.25, 0.50, 0.75])

    results = []
    for _, row in merged.iterrows():
        cases = row['cases_curr']
        if cases >= q75:
            risk = "Critical"
        elif cases >= q50:
            risk = "High"
        elif cases >= q25:
            risk = "Medium"
        else:
            risk = "Low"

        results.append({
            "district": row['district'],
            "latest_year_cases": int(cases),
            "yoy_growth_percent": round(float(row['yoy_growth_%']), 2),
            "risk_tier": risk
        })

    return sorted(results, key=lambda x: x['latest_year_cases'], reverse=True)
