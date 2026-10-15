from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.schemas import UploadResponse, DistrictSummary, ForecastResponse, CategoryResponse
from app.services.data_service import data_service
from app.services.pdf_service import generate_district_pdf
from app.ml.forecasting import CrimeForecaster
from app.ml.risk_assessment import calculate_district_risks

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="PunjabCrimeLens API",
    description="Enterprise backend for crime analysis and forecasting in Punjab",
    version="1.1.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "app": "PunjabCrimeLens API", "version": "1.1.0"}

@app.post("/api/upload", response_model=UploadResponse)
@limiter.limit("5/minute")
async def upload_dataset(request: Request, file: UploadFile = File(...)):
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

@app.post("/api/reset")
@limiter.limit("10/minute")
def reset_dataset(request: Request):
    # Wipes the dataframe from the server's active memory
    data_service.df = None
    return {"status": "success", "message": "Dataset cleared from memory."}

@app.get("/api/summary")
def get_dashboard_summary():
    result = data_service.get_summary_stats()
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/forecast", response_model=ForecastResponse)
@limiter.limit("30/minute")
def forecast_crime(request: Request, district: str = Query("Ludhiana", description="District to forecast"), years: int = Query(3, ge=1, le=10)):
    if data_service.df is None:
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
        
    forecaster = CrimeForecaster(data_service.df)
    res = forecaster.forecast_district(district, horizon_years=years)
    
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
        
    return res

@app.get("/api/categories", response_model=CategoryResponse)
@limiter.limit("30/minute")
def get_categories(request: Request, district: str = Query(..., description="District to analyze")):
    if data_service.df is None:
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
        
    df = data_service.df
    # Filter for the requested district
    d_df = df[df['district'].str.lower() == district.lower()]
    
    if d_df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for district: {district}")
        
    # Group by category, sum the cases, and sort descending for the BarChart
    category_totals = d_df.groupby('crime_category')['cases'].sum().reset_index()
    category_totals = category_totals.sort_values(by='cases', ascending=False)
    
    breakdown = [
        {"category": str(row['crime_category']), "cases": int(row['cases'])}
        for _, row in category_totals.iterrows()
    ]
    
    return {
        "district": district.title(),
        "breakdown": breakdown
    }

@app.get("/api/risk-assessment")
def get_risk_assessment():
    if data_service.df is None:
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
    return calculate_district_risks(data_service.df)

@app.get("/api/export/report/{district}")
@limiter.limit("10/minute")
def export_intelligence_report(request: Request, district: str, years: int = Query(3, ge=1, le=10)):
    if data_service.df is None:
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
        
    forecaster = CrimeForecaster(data_service.df)
    forecast_res = forecaster.forecast_district(district, horizon_years=years)
    
    if "error" in forecast_res:
        raise HTTPException(status_code=404, detail=forecast_res["error"])
        
    pdf_bytes = generate_district_pdf(district, forecast_res)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={district.lower()}_intelligence_report.pdf"}
    )