import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // import CSS file

const API_BASE = "http://127.0.0.1:8000";

function App() {
  
  const [degree, setDegree] = useState("");
  const [campusType, setCampusType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [org, setOrg] = useState("");
  const [minPkg, setMinPkg] = useState("");
  

  const [degrees, setDegrees] = useState([]);
  const [campusTypes, setCampusTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  
  // New state for name search
  const [nameQuery, setNameQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const fetchSeniors = async () => {
    setLoading(true);
    setIsSearchMode(false);
    try {
      const params = {};
      if (academicYear) params.academic_year = academicYear;
      if (degree) params.degree = degree;
      if (campusType) params.campus_type = campusType;
      if (org) params.org = org;
      if (minPkg) params.min_package = minPkg;
      
      console.log("Fetching seniors with params:", params);
      const res = await axios.get(`${API_BASE}/seniors`, { params });
      console.log("Search response:", res.data);
      setResults(res.data.results);
      setTotal(res.data.total);
      setError(null);
    } catch (err) {
      console.error("Error fetching seniors:", err);
      setError("Error loading seniors data. Please check if the backend is running.");
    }
    setLoading(false);
  };

  // New function for searching by name
  const searchByName = async () => {
    if (!nameQuery || nameQuery.trim().length < 2) {
      alert("Please enter at least 2 characters to search");
      return;
    }
    
    setSearchLoading(true);
    setIsSearchMode(true);
    try {
      const res = await axios.get(`${API_BASE}/search`, { 
        params: { name: nameQuery.trim().toUpperCase() } 
      });
      console.log("Name search response:", res.data);
      setSearchResults(res.data.results);
      setSearchTotal(res.data.total);
      setError(null);
    } catch (err) {
      console.error("Error searching by name:", err);
      setError("Error searching by name. Please try again.");
    }
    setSearchLoading(false);
  };

  // Function to clear search and go back to filter mode
  const clearSearch = () => {
    setNameQuery("");
    setSearchResults([]);
    setSearchTotal(0);
    setIsSearchMode(false);
    setError(null);
  };

  useEffect(() => {
    // Test backend connectivity
    console.log("Testing backend connectivity...");
    setConnectionStatus("Connecting to backend...");
    axios.get(`${API_BASE}/filters`).then((res) => {
      console.log("Backend connected successfully, filters loaded:", res.data);
      setConnectionStatus("✅ Connected to backend");
      setDegrees(res.data.degree || []);
      setCampusTypes(res.data.campus_type || []);
      setAcademicYears(res.data.academic_year || []);
      setError(null);
      
      // Load initial data after filters are loaded
      fetchSeniors();
    }).catch((err) => {
      console.error("Error loading filters:", err);
      setConnectionStatus("❌ Cannot connect to backend");
      setError(`Cannot connect to backend server at ${API_BASE}. Please ensure the FastAPI server is running.`);
    });
  }, []);

  const connect = async () => {
  if (!selected) return;
  
  try {
    // Call your backend proxy instead
    const response = await axios.post(`${API_BASE}/proxy/linkedin-search`, {
      name: selected["Name of the student"],
      org: selected["Name of organization"]
    });
    
    // Find LinkedIn URL in results
    const organicResults = response.data.organic_results || [];
    let linkedinUrl = null;
    
    // Look for LinkedIn results
    for (const result of organicResults) {
      if (result.link && result.link.includes('linkedin.com/in/')) {
        linkedinUrl = result.link;
        break;
      }
    }
    
    if (linkedinUrl) {
      // Open the LinkedIn profile in a new tab
      window.open(linkedinUrl, '_blank');
    } else {
      alert("LinkedIn profile not found. Try searching manually.");
    }
  } catch (error) {
    console.error("Error connecting to LinkedIn:", error);
    alert("Error finding LinkedIn profile. Please try again later.");
  }
};

  const fetchDetail = async (rollNo) => {
    console.log("Fetching detail for roll no:", rollNo);
    try {
      const res = await axios.get(`${API_BASE}/seniors/${rollNo}`);
      console.log("API response:", res.data);
      if (!res.data.error) {
        setSelected(res.data);
        console.log("Selected data set:", res.data);
      } else {
        console.error("API returned error:", res.data.error);
        alert("Senior not found");
      }
    } catch (err) {
      console.error("Error fetching senior detail:", err);
      alert("Error loading senior details. Please try again.");
    }
  };

  return (
    <>
      <div className="container">
        <h1 className="title">Seniors Data</h1>
        
        {/* Connection Status */}
        <div style={{
          padding: "10px", 
          marginBottom: "20px", 
          backgroundColor: error ? "#ffebee" : "#e8f5e8",
          border: "1px solid " + (error ? "#f44336" : "#4caf50"),
          borderRadius: "4px"
        }}>
          <strong>Status:</strong> {connectionStatus}
          {error && <div style={{color: "red", marginTop: "5px"}}>{error}</div>}
        </div>

        {/* Name Search Bar */}
        <div style={{
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: "#f8f9fa", 
          border: "1px solid #dee2e6", 
          borderRadius: "8px"
        }}>
          <h3 style={{margin: "0 0 10px 0", color: "#495057"}}>🔍 Search by Name</h3>
          <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
            <input
              type="text"
              placeholder="Enter student name (e.g., Priya, Rajesh, etc.)"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  searchByName();
                }
              }}
              style={{
                flex: 1, 
                padding: "10px", 
                border: "1px solid #ced4da", 
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
            <button 
              onClick={searchByName} 
              disabled={searchLoading}
              style={{
                padding: "10px 20px", 
                backgroundColor: "#28a745", 
                color: "white", 
                border: "none", 
                borderRadius: "4px",
                cursor: searchLoading ? "not-allowed" : "pointer",
                opacity: searchLoading ? 0.6 : 1
              }}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
            {isSearchMode && (
              <button 
                onClick={clearSearch}
                style={{
                  padding: "10px 20px", 
                  backgroundColor: "#6c757d", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            )}
          </div>
          {isSearchMode && (
            <div style={{marginTop: "10px", fontSize: "14px", color: "#6c757d"}}>
              Search results for: "<strong>{nameQuery}</strong>"
            </div>
          )}
        </div>

        {/* Show filters only when not in search mode */}
        {!isSearchMode && (
          <div>
            <h3 style={{margin: "0 0 15px 0", color: "#495057"}}>📊 Filter Options</h3>
            {/* filters */}
            <div className="filters">
          
          <select value={degree} onChange={(e) => setDegree(e.target.value)}>
            <option value="">All Degrees</option>
            {degrees.map((d, i) => (
              <option key={i} value={d}>{d}</option>
            ))}
          </select>
          <select value={campusType} onChange={(e) => setCampusType(e.target.value)}>
            <option value="">Any Campus</option>
            {campusTypes.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="">Any Academic Year</option>
            {academicYears.map((ay, i) => (
              <option key={i} value={ay}>{ay}</option>
            ))}
          </select>
          <input
            placeholder="Organization"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          />
          <input
            type="number"
            placeholder="Package"
            value={minPkg}
            onChange={(e) => setMinPkg(e.target.value)}
          />
          
        </div>

        <button className="search-btn" onClick={fetchSeniors}>
          Search
        </button>
        
        {/* Debug Test Button */}
        <button 
          style={{marginLeft: "10px", padding: "10px 16px", backgroundColor: "#ff9800", border: "none", color: "white", cursor: "pointer", borderRadius: "4px"}}
          onClick={() => {
            console.log("Testing view functionality...");
            if (results.length > 0) {
              fetchDetail(results[0]["Roll No."]);
            } else {
              alert("No results to test with. Please search first.");
            }
          }}
        >
          Test View (First Result)
        </button>
          </div>
        )}

        {/* results */}
        <div className="results">
          {(loading || searchLoading) && <p>Loading...</p>}
          {!loading && !searchLoading && !isSearchMode && <p>Total Results: {total}</p>}
          {!loading && !searchLoading && isSearchMode && <p>Search Results: {searchTotal}</p>}
          {error && (
            <div style={{color: "red", padding: "10px", border: "1px solid red", borderRadius: "4px", marginBottom: "10px"}}>
              <strong>Error:</strong> {error}
            </div>
          )}
          <ul>
            {(isSearchMode ? searchResults : results).map((r, i) => (
              <li key={i} className="result-item">
                <span>{r["Name of the student"]} — {r["Name of organization"]} (Roll: {r["Roll No."]})</span>
                <button onClick={() => {
                  console.log("View button clicked for:", r["Roll No."]);
                  fetchDetail(r["Roll No."]);
                }} className="view-btn">
                  View
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* detail view */}
        {selected && (
          <div className="detail-view">
            <button className="close-btn" onClick={() => setSelected(null)}>
              Close
            </button>
            <h2>{selected["Name of the student"]}</h2>
            <p><strong>Roll No:</strong> {selected["Roll No."]}</p>
            <p><strong>Degree:</strong> {selected["B.Tech./M. Tech./MCA"]}</p>
            <p><strong>Organization:</strong> {selected["Name of organization"]}</p>
            <p><strong>Package:</strong> {selected["Package p.a. (Lakhs)"]} LPA</p>
            <p><strong>Campus:</strong> {
              selected["On campus"] ? 
                `On campus - ${selected["On campus"]}` : 
                selected["Off campus "] ? 
                  `Off campus - ${selected["Off campus "]}` : 
                  "Not specified"
            }</p>
            <button className="connect-btn" onClick={connect}>Connect</button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
