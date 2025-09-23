from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from typing import Optional
import os
from fastapi import HTTPException, Request
import requests
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Seniors API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Dictionary to store data for each academic year
YEAR_DATA = {}

# Function to load data for a specific academic year
def load_year_data(year):
    if year in YEAR_DATA:
        return YEAR_DATA[year]

    file_path = f"seniors_data_cleaned_{year}.xlsx"
    if not os.path.exists(file_path):
        return None
    
    try:
        year_df = pd.read_excel(file_path)
        year_df = year_df.replace({np.nan: None})
        YEAR_DATA[year] = year_df.to_dict(orient="records")
        return YEAR_DATA[year]
    except Exception as e:
        print(f"Error loading data for year {year}: {e}")
        return None

# Load the default data
df = pd.read_excel("seniors_data_cleaned_2020-2023.xlsx")
df = df.replace({np.nan: None})
DATA = df.to_dict(orient="records")

# Update list_seniors to use academic_year
@app.get("/seniors")
async def list_seniors(
    
    degree: Optional[str] = None,
    campus_type: Optional[str] = None,
    org: Optional[str] = None,
    min_package: Optional[float] = None,
    academic_year: Optional[str] = None
):
    # Use year-specific data if academic_year is provided
    if academic_year:
        year_data = load_year_data(academic_year)
        if not year_data:
            raise HTTPException(status_code=404, detail=f"Data for academic year {academic_year} not found")
        rows = year_data
    else:
        rows = DATA

    # Rest of your filtering code
    
    if degree:
        rows = [r for r in rows if str(r.get("B.Tech./M. Tech./MCA", "")).lower() == degree.lower()]
    
    if campus_type:
        rows = [r for r in rows if str(r.get("On campus", "")) == campus_type or str(r.get("Off campus", "")) == campus_type]
    if org:
        rows = [r for r in rows if str(r.get("Name of organization", "")).lower() == org.lower()]

    # numeric filters
    def ok_pkg(v):
        try: return float(v)
        except: return None
    if min_package is not None:
        rows = [r for r in rows if (ok_pkg(r.get("Package p.a. (Lakhs)")) is not None and ok_pkg(r.get("Package p.a. (Lakhs)")) >= min_package)]
    
    return {
        "total": len(rows),
        "results": rows
    }

# Update get_senior to use academic_year
@app.get("/seniors/{roll_no}")
async def get_senior(roll_no: str, academic_year: Optional[str] = None):
    if academic_year:
        year_data = load_year_data(academic_year)
        if not year_data:
            raise HTTPException(status_code=404, detail=f"Data for academic year {academic_year} not found")
        data = year_data
    else:
        data = DATA
        
    for r in data:
        if str(r.get("Roll No.")) == str(roll_no):
            return r
    return {"error": "not found"}

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

@app.post("/proxy/linkedin-search")
async def linkedin_search(request: Request):
    try:
        body = await request.json()
        name = body.get("name")
        org = body.get("org")
        query = f"{name} {org} linkedin"
        params = {
            "q": query,
            "api_key": SERPAPI_KEY,
            "engine": "google",
            "gl": "in",
            "hl": "en"
        }
        response = requests.get("https://serpapi.com/search", params=params)
        print("SerpAPI status:", response.status_code)
        print("SerpAPI response:", response.text)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print("Proxy error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Update filters endpoint to support academic_year parameter
@app.get("/filters")
async def filters(academic_year: Optional[str] = None):
    ay = ['2020-2023', '2021-2025', '2022-2026', '2023-2027']
    
    if academic_year:
        year_data = load_year_data(academic_year)
        if not year_data:
            raise HTTPException(status_code=404, detail=f"Data for academic year {academic_year} not found")
        data = year_data
    else:
        data = DATA
    
    deg = sorted({(str(r.get("B.Tech./M. Tech./MCA")) or "").strip() for r in data if r.get("B.Tech./M. Tech./MCA")})
    ct = ["On campus", "Off campus"]
    
    
    return {
        "degree": deg,
        "campus_type": ct,
        "academic_year": ay
    }