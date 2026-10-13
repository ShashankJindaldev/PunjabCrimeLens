from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import UploadResponse
from app.services.data_service import data_service
from app.ml.forecasting import CrimeForecaster
from app.ml.risk_assessment import calculate_district_risks

app = FastAPI(
    title="PunjabCrimeLens API",
    description="Backend for crime analysis and forecasting in Punjab",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "app": "PunjabCrimeLens API"}

@app.post("/api/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    content = await file.read()
    result = data_service.process_csv_upload(content)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
        
    return UploadResponse(
        filename=file.filename,
        total_records=result["total_records"],
        status=result["status"],
        message=result["message"]
    )

@app.get("/api/summary")
def get_dashboard_summary():
    result = data_service.get_summary_stats()
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/forecast")
def forecast_crime(district: str = Query("Ludhiana", description="District to forecast"), years: int = Query(3, ge=1, le=5)):
    if data_service.df is None:
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
    
    forecaster = CrimeForecaster(data_service.df)
    res = forecaster.forecast_district(district, horizon_years=years)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@app.get("/api/risk-assessment")
def get_risk_assessment():
    if data_service.df is None:
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
    return calculate_district_risks(data_service.df)
