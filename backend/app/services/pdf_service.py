import io
from fpdf import FPDF

class IntelligenceReport(FPDF):
    def header(self):
        self.set_fill_color(15, 23, 42)
        self.rect(0, 0, 210, 25, 'F')
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(248, 250, 252)
        self.cell(0, 8, 'PUNJAB CRIMELENS | EXECUTIVE INTELLIGENCE BRIEF', align='C', new_x="LMARGIN", new_y="NEXT")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(100, 116, 139)
        # Replaced Em Dash with standard hyphen to prevent fpdf2 UnicodeEncodeError
        self.cell(0, 10, 'Automated Analytics Report - Confidential Law Enforcement & Policy Intelligence', align='C')

def generate_district_pdf(district: str, forecast_data: dict) -> bytes:
    pdf = IntelligenceReport()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 10, f'District Assessment: {district.title()}', new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(100, 116, 139)
    selected_model = forecast_data.get("selected_model", "Ridge Regression")
    r2_score = forecast_data.get("r2_score", 0.0)
    # Replaced R² with R-Squared to prevent font encoding crash
    pdf.cell(0, 6, f'Predictive Model: {selected_model} (R-Squared Fit Score: {r2_score})', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, 'Historical Trends & Anomaly Detection', new_x="LMARGIN", new_y="NEXT")

    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_fill_color(226, 232, 240)
    pdf.cell(40, 7, 'Year', border=1, fill=True)
    pdf.cell(50, 7, 'Recorded Cases', border=1, fill=True)
    pdf.cell(50, 7, 'Z-Score Deviation', border=1, fill=True)
    pdf.cell(50, 7, 'Status', border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font('Helvetica', '', 9)
    for item in forecast_data.get('historical', []):
        pdf.cell(40, 6, str(item['year']), border=1)
        pdf.cell(50, 6, str(item['cases']), border=1)
        pdf.cell(50, 6, f"{item['z_score']:+.2f}", border=1)
        status = "CRITICAL ANOMALY" if item['is_anomaly'] else "Normal Variance"
        if item['is_anomaly']:
            pdf.set_text_color(185, 28, 28)
        else:
            pdf.set_text_color(30, 41, 59)
        pdf.cell(50, 6, status, border=1, new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(30, 41, 59)
    pdf.ln(8)

    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, 'Forecast Horizon Projections (95% Confidence Interval)', new_x="LMARGIN", new_y="NEXT")

    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_fill_color(226, 232, 240)
    pdf.cell(40, 7, 'Target Year', border=1, fill=True)
    pdf.cell(50, 7, 'Projected Cases', border=1, fill=True)
    pdf.cell(100, 7, 'Confidence Bounds (Lower - Upper)', border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font('Helvetica', '', 9)
    for item in forecast_data.get('forecast', []):
        pdf.cell(40, 6, str(item['year']), border=1)
        pdf.cell(50, 6, str(item['cases']), border=1)
        pdf.cell(100, 6, f"{item['ci_lower']} - {item['ci_upper']}", border=1, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(10)
    pdf.set_font('Helvetica', 'I', 9)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(0, 5, "Disclaimer: These statistical projections are generated using machine learning models on historical district records. They serve as supportive administrative analytics for policing strategy and allocation.")

    return bytes(pdf.output())