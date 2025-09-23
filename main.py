from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import pandas as pd
import numpy as np
from typing import Optional
import os
from fastapi import HTTPException, Request
import requests

app = FastAPI(title="Seniors API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Dictionary to store data
DATA = {}

# Function to load data
def load_data():
    global DATA
    if DATA:  # If already loaded, return
        return DATA
    
    try:
        df = pd.read_excel("seniors_data_cleaned_2020-2023.xlsx")
        df = df.replace({np.nan: None})
        DATA = df.to_dict(orient="records")
        return DATA
    except Exception as e:
        print(f"Error loading data: {e}")
        return []

# Load the data on startup
load_data()

# Update list_seniors to use academic_year
@app.get("/")
async def root():
    return {"message": "Seniors API is running", "docs": "/docs"}

@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)  # No content response for favicon

@app.get("/seniors")
async def list_seniors(
    degree: Optional[str] = None,
    campus_type: Optional[str] = None,
    org: Optional[str] = None,
    min_package: Optional[float] = None,
    academic_year: Optional[str] = None
):
    # Use the loaded data (for now, academic_year parameter is accepted but not used for filtering)
    # since all data is in one file. In the future, you can add year-based filtering logic here.
    rows = DATA.copy()

    # Degree filtering - handle spaces and variations
    if degree:
        degree_clean = degree.strip()
        rows = [r for r in rows if str(r.get("B.Tech./M. Tech./MCA", "")).strip().lower() == degree_clean.lower()]
    
    # Campus type filtering - check the actual placement type
    if campus_type:
        if campus_type.lower() == "on campus":
            # Filter for records where "On campus" is not empty/null
            rows = [r for r in rows if r.get("On campus") is not None and str(r.get("On campus")).strip() != ""]
        elif campus_type.lower() == "off campus":
            # Filter for records where "Off campus " (note the space) is not empty/null
            rows = [r for r in rows if r.get("Off campus ") is not None and str(r.get("Off campus ")).strip() != ""]
    
    # Organization filtering
    if org:
        org_clean = org.strip()
        rows = [r for r in rows if str(r.get("Name of organization", "")).strip().lower() == org_clean.lower()]

    # Package filtering
    def ok_pkg(v):
        try: 
            if v is None or str(v).strip() == "":
                return None
            return float(v)
        except: 
            return None
    
    if min_package is not None:
        rows = [r for r in rows if (ok_pkg(r.get("Package p.a. (Lakhs)")) is not None and ok_pkg(r.get("Package p.a. (Lakhs)")) >= min_package)]
    
    return {
        "total": len(rows),
        "results": rows
    }

# Update get_senior to use the main data
@app.get("/seniors/{roll_no}")
async def get_senior(roll_no: str, academic_year: Optional[str] = None):
    # Use the main data (academic_year parameter accepted but not used for now)
    data = DATA
        
    for r in data:
        if str(r.get("Roll No.")) == str(roll_no):
            return r
    return {"error": "not found"}

# New endpoint for searching by name
@app.get("/search")
async def search_by_name(
    name: str,
    limit: Optional[int] = 50
):
    """
    Search for students by name (partial or full match)
    """
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name query must be at least 2 characters long")
    
    name_query = name.strip().lower()
    
    # Search through all students
    matching_students = []
    for student in DATA:
        student_name = str(student.get("Name of the student", "")).lower()
        if name_query in student_name:
            matching_students.append(student)
    
    # Sort by best match (exact matches first, then partial matches)
    def match_score(student):
        student_name = str(student.get("Name of the student", "")).lower()
        if student_name == name_query:
            return 0  # Exact match
        elif student_name.startswith(name_query):
            return 1  # Starts with query
        else:
            return 2  # Contains query
    
    matching_students.sort(key=match_score)
    
    # Apply limit
    if limit:
        matching_students = matching_students[:limit]
    
    return {
        "query": name,
        "total": len(matching_students),
        "results": matching_students
    }

SERPAPI_KEY = "1c39940bcaa1d7713e429d091baf7536e4aa6bba9f1769c3fe53f60a78b4584a"

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

# Update filters endpoint
@app.get("/filters")
async def filters(academic_year: Optional[str] = None):
    ay = ['2020-2023', '2021-2025', '2022-2026', '2023-2027']
    
    # Use the main data (academic_year parameter accepted but not used for filtering for now)
    data = DATA
    
    deg = sorted({(str(r.get("B.Tech./M. Tech./MCA")) or "").strip() for r in data if r.get("B.Tech./M. Tech./MCA")})
    ct = ["On campus", "Off campus"]
    
    return {
        "degree": deg,
        "campus_type": ct,
        "academic_year": ay
    }