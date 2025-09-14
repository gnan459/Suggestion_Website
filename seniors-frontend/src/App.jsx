import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // import CSS file

const API_BASE = "http://localhost:8000";

function App() {
  const [q, setQ] = useState("");
  const [degree, setDegree] = useState("");
  const [campusType, setCampusType] = useState("");
  const [org, setOrg] = useState("");
  const [minPkg, setMinPkg] = useState("");
  const [maxPkg, setMaxPkg] = useState("");

  const [degrees, setDegrees] = useState([]);
  const [campusTypes, setCampusTypes] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/filters`).then((res) => {
      setDegrees(res.data.degree || []);
      setCampusTypes(res.data.campus_type || []);
    });
  }, []);

  const fetchSeniors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (degree) params.degree = degree;
      if (campusType) params.campus_type = campusType;
      if (org) params.org = org;
      if (minPkg) params.min_package = minPkg;
      if (maxPkg) params.max_package = maxPkg;

      const res = await axios.get(`${API_BASE}/seniors`, { params });
      setResults(res.data.results);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchDetail = async (rollNo) => {
    try {
      const res = await axios.get(`${API_BASE}/seniors/${rollNo}`);
      if (!res.data.error) setSelected(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="container">
        <h1 className="title">Seniors Data</h1>

        {/* filters */}
        <div className="filters">
          <input
            placeholder="Search by name/org/branch"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
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
          <input
            placeholder="Organization"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          />
          <input
            type="number"
            placeholder="Min Package"
            value={minPkg}
            onChange={(e) => setMinPkg(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Package"
            value={maxPkg}
            onChange={(e) => setMaxPkg(e.target.value)}
          />
        </div>

        <button className="search-btn" onClick={fetchSeniors}>
          Search
        </button>

        {/* results */}
        <div className="results">
          {loading && <p>Loading...</p>}
          {!loading && <p>Total Results: {total}</p>}
          <ul>
            {results.map((r, i) => (
              <li key={i} className="result-item">
                <span>{r["Name of the student"]} — {r["Name of organization"]}</span>
                <button onClick={() => fetchDetail(r["Roll No."])} className="view-btn">
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
            <p><strong>Package:</strong> {selected["Package p.a. (Lakhs)"]}</p>
            <p><strong>Campus:</strong> {selected["On campus"] ? "On campus" : "Off campus"}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
