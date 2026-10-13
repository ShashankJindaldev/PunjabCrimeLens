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
