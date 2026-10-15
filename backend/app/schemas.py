from pydantic import BaseModel
from typing import List

class CrimeRecord(BaseModel):
    state: str
    district: str
    year: int
    crime_category: str
    cases: int

class UploadResponse(BaseModel):
    filename: str
    total_records: int
    status: str
    message: str

class DistrictSummary(BaseModel):
    district: str
    total_cases: int
    top_crime: str

class HistoricalRecord(BaseModel):
    year: int
    cases: int
    type: str
    z_score: float
    is_anomaly: bool

class ForecastRecord(BaseModel):
    year: int
    cases: int
    ci_lower: int
    ci_upper: int
    type: str

class ForecastResponse(BaseModel):
    district: str
    selected_model: str
    historical: List[HistoricalRecord]
    forecast: List[ForecastRecord]
    r2_score: float

class CategoryBreakdown(BaseModel):
    category: str
    cases: int

class CategoryResponse(BaseModel):
    district: str
    breakdown: List[CategoryBreakdown]