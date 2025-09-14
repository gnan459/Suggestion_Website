from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from typing import Optional

app = FastAPI(title="Seniors API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_excel("seniors_data_cleaned.xlsx")
df = df.replace({np.nan: None})
DATA = df.to_dict(orient="records")


async def matches(item, key, val):
    if val is None or val == "":
        return True
    v = item.get(key)
    return v is not None and str(v).lower().strip().find(str(v).lower().strip()) != -1

@app.get("/seniors")
async def list_seniors(
    q: Optional[str] = Query(None, description="Search in name/org/branch"),
    degree: Optional[str] = None,
    campus_type: Optional[str] = None,   # "On campus"/"Off campus"
    org: Optional[str] = None,
    min_package: Optional[float] = None,
    max_package: Optional[float] = None
):
    rows = DATA

    # text search across a few fields
    if q:
        ql = q.lower()
        rows = [
            r for r in rows
            if any(
                (str(r.get(k, "")).lower().find(ql) != -1)
                for k in ["Name of the student", "Name of organization", "B.Tech./M. Tech./MCA", "Roll No."]
            )
        ]
    # exact-ish filters
    if degree:
        rows = [r for r in rows if str(r.get("B.Tech./M. Tech./MCA", "")).lower() == degree.lower()]
    
    if campus_type:
        rows = [r for r in rows  if str(r.get("On campus", "")) == campus_type or str(r.get("Off campus", "")) == campus_type]
    if org:
        rows = [r for r in rows if str(r.get("Name of organization", "")).lower() == org.lower()]

    # numeric filters
    def ok_pkg(v):
        try: return float(v)
        except: return None
    if min_package is not None:
        rows = [r for r in rows if (ok_pkg(r.get("Package p.a. (Lakhs)")) is not None and ok_pkg(r.get("Package p.a. (Lakhs)")) >= min_package)]
    if max_package is not None:
        rows = [r for r in rows if (ok_pkg(r.get("Package p.a. (Lakhs)")) is not None and ok_pkg(r.get("Package p.a. (Lakhs)")) <= max_package)]

    return {
        "total": len(rows),
        "results": rows
    }

@app.get("/seniors/{roll_no}")
async def get_senior(roll_no: str):
    for r in DATA:
        if str(r.get("Roll No.")) == str(roll_no):
            return r
    return {"error": "not found"}

@app.get("/filters")
async def filters():
    # helpful for dropdowns
    deg = sorted({(str(r.get("B.Tech./M. Tech./MCA")) or "").strip() for r in DATA if r.get("B.Tech./M. Tech./MCA")})
    
    
    ct = ["On campus", "Off campus"]

    
    return {"degree": deg, 
            "campus_type": ct,
           }
