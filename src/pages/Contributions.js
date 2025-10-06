import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase';
import UserRow from '../components/UserRow';

export default function Contributions() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbDenied, setDbDenied] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    try {
      const r = ref(db, '/registers');
      onValue(r, snap => {
        setLoading(false);
        if (!snap.exists()) return setData({});
        setData(snap.val());
      }, err => {
        setLoading(false);
        setError(err.message || 'Failed to load');
        if (err && err.code === 'PERMISSION_DENIED') setDbDenied(true);
      });
    } catch (e) {
      setLoading(false);
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  // compute totals
  // Determine where user objects are stored. Support these shapes:
  // - /registers/{usn} -> user objects (common)
  // - /registers/user/{usn} -> nested under 'user' (older shape)
  // - /registers (single user obj) -> single user object
  let source = {};
  if (data.user && typeof data.user === 'object' && Object.keys(data.user).length>0) {
    source = data.user;
  } else if (data && typeof data === 'object' && Object.keys(data).length>0) {
    source = data; // could be map of users or single user object
  } else {
    source = {};
  }

  // If source looks like a single user object (its values are primitives), normalize into one entry
  const vals = Object.values(source);
  let users = [];
  const looksLikeSingleUser = vals.length > 0 && vals.every(v => typeof v !== 'object' || v === null || Array.isArray(v));
  if (looksLikeSingleUser) {
    // source is a single user object
    const count = source.repos ? Object.keys(source.repos).length : 0;
    const usn = source.usn || 'unknown';
    users = [{ usn, ...source, contribs: count }];
  } else {
    // source is a map of users keyed by usn (or numeric keys)
    users = Object.entries(source).map(([key, val]) => {
      const count = val && val.repos ? Object.keys(val.repos).length : 0;
      return { usn: key, ...(val || {}), contribs: count };
    });
  }

  users = users.filter(u => u && typeof u === 'object');
  users.sort((a,b) => (b.contribs || 0) - (a.contribs || 0));
  const totalRegs = users.length;
  const totalContribs = users.reduce((s,u)=>s+u.contribs, 0);

  return (
    <div className="container page contributions">
      {dbDenied && <div className="card error">Realtime DB permission denied — running in local fallback mode. Data will be stored in your browser only.</div>}
      <header className="top">
        <div>
          <h1>Contributions</h1>
        </div>
        <div className="stats card stat-card">
          <div className="stat"><div className="big">{totalRegs}</div><div className="muted">Registers</div></div>
          <div className="stat"><div className="big">{totalContribs}</div><div className="muted">Contributions</div></div>
        </div>
      </header>

      <div className="actions">
        <button className="btn" onClick={load}>Reload data</button>
      </div>

  {loading && <div className="card">Loading...</div>}
  {error && <div className="card error">{error}</div>}

      <div className="card list">
        <table className="contrib-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>GitHub</th>
              <th>Holopin</th>
              <th>Contributions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <UserRow key={u.usn} idx={i+1} user={u} usn={u.usn} />
            ))}
            {users.length===0 && !loading && (
              <tr><td colSpan={5}>No registers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
