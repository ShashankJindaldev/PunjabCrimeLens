import pandas as pd
import io

class DataService:
    def __init__(self):
        # In a real app, this would be a database connection.
        # For now, we cache the dataframe in memory after upload.
        self.df = None

    def process_csv_upload(self, file_content: bytes) -> dict:
        """Parses, cleans, and loads the CSV into memory."""
        try:
            # Read bytes into pandas
            df = pd.read_csv(io.BytesIO(file_content))
            
            # 1. Standardize column names (lowercase, strip spaces)
            df.columns = [col.strip().lower() for col in df.columns]
            
            # 2. Filter needed columns based on your uploaded CSV
            required_cols = ['state', 'district', 'year', 'crime_category', 'cases']
            df = df[required_cols]
            
            # 3. Clean string data (fuzzy matching preparation)
            df['district'] = df['district'].str.strip().str.title()
            df['crime_category'] = df['crime_category'].str.strip().str.title()
            
            # Handle variations of SAS Nagar/Mohali
            district_mapping = {
                "S.A.S. Nagar": "Mohali",
                "Sas Nagar": "Mohali",
                "S.B.S. Nagar": "Shaheed Bhagat Singh Nagar",
                "Sbs Nagar": "Shaheed Bhagat Singh Nagar"
            }
            df['district'] = df['district'].replace(district_mapping)
            
            # 4. Handle missing or negative values
            df['cases'] = pd.to_numeric(df['cases'], errors='coerce').fillna(0).astype(int)
            df['cases'] = df['cases'].apply(lambda x: max(0, x)) # Remove negatives
            
            # Cache in memory
            self.df = df
            
            return {
                "total_records": len(df),
                "status": "success",
                "message": "Data cleaned and loaded successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e), "total_records": 0}

    def get_summary_stats(self) -> dict:
        """Generates high-level KPIs for the dashboard."""
        if self.df is None or self.df.empty:
            return {"error": "No data loaded."}
            
        total_cases = int(self.df['cases'].sum())
        top_district = self.df.groupby('district')['cases'].sum().idxmax()
        top_crime = self.df.groupby('crime_category')['cases'].sum().idxmax()
        
        return {
            "total_cases": total_cases,
            "highest_risk_district": top_district,
            "most_common_crime": top_crime
        }

# Singleton instance
data_service = DataService()
