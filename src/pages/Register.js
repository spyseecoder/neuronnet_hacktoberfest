import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db, ref, set, update, push, get } from '../firebase';

export default function Register() {
  const [usn, setUsn] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', github: '', holopin: '', phno: '' });
  // allow user to set a password for local edit-protection
  const [regPassword, setRegPassword] = useState('');
  const [newRepo, setNewRepo] = useState({ url: '' });
  const [dbDenied, setDbDenied] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loginPassword, setLoginPassword] = useState('');
  // keep a session-level password used to validate modifications when DB password is set
  const [authPassword, setAuthPassword] = useState('');
  const [modifyPassword, setModifyPassword] = useState('');
  // auth state is observed via onAuthStateChanged but we don't need a separate local 'currentUser' state here

  // auto-fill usn from query string if present
  const location = useLocation();
  // normalize user object so `repos` is always present (handles legacy `repo` key)
  const normalizeUser = (u) => {
    if (!u) return u;
    // if there's a singular `repo` node, use it; otherwise prefer `repos`
    const repos = u.repos || u.repo || {};
    return { ...u, repos };
  };
  useEffect(()=>{
    const qp = new URLSearchParams(location.search);
    const pre = qp.get('usn');
    if(pre){
      setUsn(pre);
      // auto-login (attempt to fetch user)
      // try several locations
      (async ()=>{
        let foundUser = false;
        try {
          const paths = [`/registers/${pre}`, `/registers/user/${pre}`, `/registers`];
          for (const p of paths) {
            try {
              const snap = await get(ref(db, p));
              if (snap && snap.exists()){
                const val = snap.val();
                // if we fetched /registers (single object), ensure it's the right USN
                  if (p === '/registers') {
                  if (val.usn && String(val.usn) === String(pre)) {
                    const norm = normalizeUser(val);
                    setUser(norm);
                    setForm({ name: norm.name || '', github: norm.github || '', holopin: norm.holopin || '', phno: norm.phno || '' });
                    foundUser = true;
                    break;
                  }
                } else {
                  const norm = normalizeUser(val);
                  setUser(norm);
                  setForm({ name: norm.name || '', github: norm.github || '', holopin: norm.holopin || '', phno: norm.phno || '' });
                  foundUser = true;
                  break;
                }
              }
            } catch(errGet) {
              // permission or network error reading this path — continue trying other paths but record the problem
              console.error('Error reading', p, errGet);
              setDbDenied(true);
              setDbMessage(errGet && (errGet.message || errGet.code) ? `${errGet.code || ''} ${errGet.message || ''}` : String(errGet));
            }
          }

          // if after trying DB paths we still have no user (foundUser false), fallback to local storage
          if (!foundUser) {
            const raw = localStorage.getItem('local_registers');
            const local = raw ? JSON.parse(raw) : {};
            if (local[pre]) {
              const normLocal = normalizeUser(local[pre]);
              setUser(normLocal);
              setForm({ name: normLocal.name || '', github: normLocal.github || '', holopin: normLocal.holopin || '', phno: normLocal.phno || '' });
            }
          }
        } catch(e) {
          console.error('Auto-fill error', e);
          setDbDenied(true);
          setDbMessage(e && (e.message || e.code) ? `${e.code || ''} ${e.message || ''}` : String(e));
          const raw = localStorage.getItem('local_registers');
          const local = raw ? JSON.parse(raw) : {};
          if (local[pre]) {
            const normLocal = normalizeUser(local[pre]);
            setUser(normLocal);
            setForm({ name: normLocal.name || '', github: normLocal.github || '', holopin: normLocal.holopin || '', phno: normLocal.phno || '' });
          }
        }
      })();
    }
    // no auth listener here (we're using a simple USN+password flow)
    return undefined;
  }, [location.search]);

  function handleRegister(e) {
    e.preventDefault();
    if (!form.name || !form.github || !usn) return alert('Please provide name, github and usn');
    setLoading(true);
    // Simple: write a profile object at /registers/{usn}. If DB write is denied we'll save locally.
    (async () => {
      const path = `/registers/${usn}`;
      const payload = { ...form, usn, password: regPassword || undefined, createdAt: Date.now() };
      try {
        await set(ref(db, path), payload);
        setLoading(false);
        setRegPassword('');
        setAuthPassword(payload.password || '');
        setDbMessage('Registered');
        // After registering, switch to login view so the user can sign in
        setMode('login');
        setLoginPassword(payload.password || '');
      } catch (e) {
        setLoading(false);
        console.error('Realtime DB write failed on register', e);
        setDbDenied(true);
        setDbMessage('Registered locally (permission denied when writing to DB)');
        const raw = localStorage.getItem('local_registers');
        const local = raw ? JSON.parse(raw) : {};
        local[usn] = payload;
        localStorage.setItem('local_registers', JSON.stringify(local));
        // also take the user to the login form after saving locally
        setMode('login');
        setLoginPassword(payload.password || '');
      }
    })();
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!usn) return alert('Enter USN to login');
    setLoading(true);
    (async () => {
      try {
        // Try canonical paths first
        const paths = [`/registers/${usn}`, `/registers/user/${usn}`, `/registers`];
        let found = false;
        for (const p of paths) {
          try {
            const snap = await get(ref(db, p));
            if (snap && snap.exists()) {
              const val = snap.val();
              if (p === '/registers') {
                if (val.usn && String(val.usn) === String(usn)) {
                  const norm = normalizeUser(val);
                  setUser(norm);
                  setForm({ name: norm.name || '', github: norm.github || '', holopin: norm.holopin || '', phno: norm.phno || '' });
                  found = true;
                  break;
                }
              } else {
                const norm = normalizeUser(val);
                setUser(norm);
                setForm({ name: norm.name || '', github: norm.github || '', holopin: norm.holopin || '', phno: norm.phno || '' });
                found = true;
                break;
              }
            }
          } catch (e) {
            console.error('Read error during login', e);
            setDbDenied(true);
            setDbMessage(e && (e.message || e.code) ? `${e.code || ''} ${e.message || ''}` : String(e));
          }
        }
        // fallback to local storage
        if (!found) {
          const raw = localStorage.getItem('local_registers');
          const local = raw ? JSON.parse(raw) : {};
          if (local[usn]) {
            const normLocal = normalizeUser(local[usn]);
            setUser(normLocal);
            setForm({ name: normLocal.name || '', github: normLocal.github || '', holopin: normLocal.holopin || '', phno: normLocal.phno || '' });
            found = true;
          }
        }
        if (!found) alert('Profile not found');
        // store session-level password for later modify validations
        setAuthPassword(loginPassword || '');
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error('Login error', err);
        setDbDenied(true);
        setDbMessage(err && (err.message || err.code) ? `${err.code || ''} ${err.message || ''}` : String(err));
      }
    })();
  }

  function handleLogout(){
    setUser(null);
    setDbMessage('Logged out');
  }

  async function handleModify(e) {
    e.preventDefault();
    if (!usn) return alert('Login first');
    const payload = { ...form, modifiedAt: Date.now() };

    const find = async (usnToFind) => {
      let p = `/registers/${usnToFind}`;
      let snap = await get(ref(db, p));
      if (snap.exists()) return { path: p, val: snap.val() };
      p = `/registers/user/${usnToFind}`;
      snap = await get(ref(db, p));
      if (snap.exists()) return { path: p, val: snap.val() };
      snap = await get(ref(db, '/registers'));
      if (snap.exists()) {
        const obj = snap.val();
        for (const [key, v] of Object.entries(obj)) {
          if (v && typeof v === 'object' && v.usn && String(v.usn) === String(usnToFind)) {
            return { path: `/registers/${key}`, val: v };
          }
        }
        if (obj.usn && String(obj.usn) === String(usnToFind)) return { path: '/registers', val: obj };
      }
      const raw = localStorage.getItem('local_registers');
      const local = raw ? JSON.parse(raw) : {};
      if (local[usnToFind]) return { path: `local:${usnToFind}`, val: local[usnToFind] };
      return null;
    };

    try {
      const found = await find(usn);
      if (!found) return alert('User not found');
      const path = found.path;
      const stored = found.val;
      // If a password exists on the stored profile, verify it matches the session password
  // If a password is set on the stored profile, allow modify only when the provided password matches.
  const provided = modifyPassword || authPassword || '';
  if (stored && stored.password && stored.password !== provided) return alert('Incorrect password.');

      if (path.startsWith('local:')) {
        const raw = localStorage.getItem('local_registers');
        const local = raw ? JSON.parse(raw) : {};
        local[usn] = { ...local[usn], ...payload };
        localStorage.setItem('local_registers', JSON.stringify(local));
        // update UI immediately
        setUser(prev => ({ ...(prev || {}), ...payload }));
        setForm({ name: payload.name || '', github: payload.github || '', holopin: payload.holopin || '', phno: payload.phno || '' });
        setDbMessage('Updated locally (saved to browser)');
        setModifyPassword('');
      } else {
        await update(ref(db, path), payload);
        // merge into current UI state
        setUser(prev => ({ ...(prev || {}), ...payload }));
        setDbMessage('Updated');
        setModifyPassword('');
      }
    } catch (e) {
      if (e && e.code === 'PERMISSION_DENIED') {
        console.error('Realtime DB permission denied on modify', e);
        setDbDenied(true);
        setDbMessage('Permission denied — changes saved locally.');
        const raw = localStorage.getItem('local_registers');
        const local = raw ? JSON.parse(raw) : {};
        if (!local[usn]) local[usn] = { usn };
        local[usn] = { ...local[usn], ...payload };
        localStorage.setItem('local_registers', JSON.stringify(local));
        return;
      }
      setDbMessage(e.message || String(e));
    }
  }

  async function handleAddRepo(e) {
    e.preventDefault();
    if (!usn) return alert('Login first');
    if (!newRepo.url) return alert('Provide repo url');
    const reposPath = `/registers/${usn}/repos`;
    const repoPayload = { url: newRepo.url, createdAt: Date.now(), addedBy: usn };
    try {
      await push(ref(db, reposPath), repoPayload);
      setNewRepo({ url: '' });
      setDbMessage('Repo added');
    } catch(err) {
      if (err && err.code === 'PERMISSION_DENIED') {
        console.error('Realtime DB permission denied on add repo', err);
        setDbDenied(true);
        setDbMessage('Permission denied — repo saved locally in your browser.');
        const raw = localStorage.getItem('local_registers');
        const local = raw ? JSON.parse(raw) : {};
        if (!local[usn]) local[usn] = { usn, repos: {} };
        const id = `local_${Date.now()}`;
        if (!local[usn].repos) local[usn].repos = {};
        local[usn].repos[id] = repoPayload;
        localStorage.setItem('local_registers', JSON.stringify(local));
        // update UI immediately so the new repo shows up
        setUser(prev => {
          const prevRepos = (prev && prev.repos) ? { ...prev.repos } : {};
          prevRepos[id] = repoPayload;
          return { ...(prev || {}), repos: prevRepos };
        });
        setNewRepo({ url: '' });
      } else alert(err.message);
    }
  }

  // Attempt to push any locally-saved registers/repos to the realtime DB.
  // Useful after you temporarily open DB rules in the console and want to sync the browser-saved changes.
  async function pushLocalToDb() {
    const raw = localStorage.getItem('local_registers');
    const local = raw ? JSON.parse(raw) : {};
    const keys = Object.keys(local || {});
    if (!keys.length) return alert('No local changes to sync.');
    const results = { ok: [], failed: [] };
    for (const k of keys) {
      const item = local[k];
      try {
        // Write the main user object to canonical path
        const path = `/registers/${k}`;
        // copy object except nested repos (repos will be pushed separately)
        const { repos, ...userOnly } = item;
        await set(ref(db, path), userOnly);
        // push repos if present
        if (repos && typeof repos === 'object') {
          for (const rid of Object.keys(repos)) {
            const r = repos[rid];
            // if repo id looks like local_ we will push as a new child in DB
            await push(ref(db, `${path}/repos`), r);
          }
        }
        results.ok.push(k);
      } catch (e) {
        results.failed.push({ key: k, error: e.message || e.code || e });
      }
    }
    // Remove successfully synced entries from local storage
    if (results.ok.length) {
      for (const k of results.ok) delete local[k];
      localStorage.setItem('local_registers', JSON.stringify(local));
    }
    const msgParts = [];
    if (results.ok.length) msgParts.push(`Synced: ${results.ok.join(', ')}`);
    if (results.failed.length) msgParts.push(`Failed: ${results.failed.map(f => `${f.key}(${f.error})`).join('; ')}`);
    alert(msgParts.join('\n'));
  }

  return (
    <div className="container page register">
      {dbDenied && (
        <div className="card error">
          <strong>Realtime DB permission denied</strong> — running in local fallback mode. Changes are saved to your browser only.
          <div style={{marginTop:8}}>
            To enable writes for testing, open the Firebase Console → Realtime Database → Rules and publish one of the snippets below (temporary):
            <pre style={{background:'#041124',padding:8,borderRadius:6,marginTop:8,whiteSpace:'pre-wrap'}}>{`{
  "rules": {
    "registers": {
      ".read": true,
      ".write": true
    }
  }
}`}</pre>
      {dbMessage && <div className="card" style={{background:'rgba(253,230,138,0.06)',color:'#fde68a'}}>{dbMessage}</div>}
            After publishing, return to this page and click <strong>Sync local changes</strong> in your profile to push browser-saved entries into the DB.
            {dbMessage && <div style={{marginTop:8,color:'#fde68a'}}>{dbMessage}</div>}
          </div>
        </div>
      )}
      <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button className={`btn ${mode==='login' ? 'primary':''}`} onClick={()=>setMode('login')}>Login</button>
        <button className={`btn ${mode==='register' ? 'primary':''}`} onClick={()=>setMode('register')}>Register</button>
      </div>

      {mode === 'login' && (
        <section className="card">
          <h2>Login</h2>
          <form onSubmit={handleLogin} className="form-vertical">
            <div className="form-row">
              <label htmlFor="login-usn">USN</label>
              <input id="login-usn" placeholder="USN" value={usn} onChange={e=>setUsn(e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" placeholder="Password" type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} />
            </div>
            <div className="form-row">
              <button className="btn" type="submit">Login</button>
            </div>
          </form>
        </section>
      )}

      {mode === 'register' && (
        <section className="card">
          <h2>Register</h2>
          <form onSubmit={handleRegister} className="form-vertical">
            <div className="form-row">
              <label htmlFor="reg-name">Name</label>
              <input id="reg-name" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-row">
              <label htmlFor="reg-usn">USN</label>
              <input id="reg-usn" placeholder="USN" value={usn} onChange={e=>setUsn(e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="reg-phno">Phone</label>
              <input id="reg-phno" placeholder="Phone" value={form.phno} onChange={e=>setForm({...form, phno: e.target.value})} />
            </div>
            <div className="form-row">
              <label htmlFor="reg-github">GitHub URL or username</label>
              <input id="reg-github" placeholder="GitHub URL or username" value={form.github} onChange={e=>setForm({...form, github: e.target.value})} />
            </div>
              <div className="form-row">
                <label htmlFor="reg-holopin">Holopin</label>
                <input id="reg-holopin" placeholder="Holopin" value={form.holopin} onChange={e=>setForm({...form, holopin: e.target.value})} />
              </div>
              <div className="form-row">
                <label htmlFor="reg-password">Set a password (optional)</label>
                <input id="reg-password" type="password" placeholder="Password (optional)" value={regPassword} onChange={e=>setRegPassword(e.target.value)} />
              </div>
              <div className="form-row">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Register'}</button>
              </div>
          </form>
        </section>
      )}

      {user && (
        <section className="card profile-card">
          <div className="profile-header">
            <div className="profile-boot">&gt;&gt; BOOT PROFILE...</div>
            <h1 className="profile-hello">Hello, {user.name || usn}</h1>
            <div className="meta">USN: <strong>{usn}</strong> • Contributions: <strong>{user.repos ? Object.keys(user.repos).length : 0}</strong></div>
            <div className="profile-actions">
              <button className="btn">Edit profile</button>
              <button className="btn" onClick={handleLogout}>Logout</button>
              <button className="btn" onClick={pushLocalToDb}>Sync local changes</button>
            </div>
          </div>

          <h3>Modify profile</h3>
          <form onSubmit={handleModify} className="profile-form form-vertical">
            <div className="form-row">
              <label htmlFor="mod-name">Name</label>
              <input id="mod-name" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-row">
              <label htmlFor="mod-github">GitHub</label>
              <input id="mod-github" placeholder="GitHub" value={form.github} onChange={e=>setForm({...form, github: e.target.value})} />
            </div>
            <div className="form-row">
              <label htmlFor="mod-holopin">Holopin</label>
              <input id="mod-holopin" placeholder="Holopin" value={form.holopin} onChange={e=>setForm({...form, holopin: e.target.value})} />
            </div>
            <div className="form-row">
              <label htmlFor="mod-phno">Phone</label>
              <input id="mod-phno" placeholder="Phone" value={form.phno} onChange={e=>setForm({...form, phno: e.target.value})} />
            </div>
            <div className="form-row">
              <label htmlFor="mod-password">Current password (if you set one)</label>
              <input id="mod-password" placeholder="Current password" type="password" value={modifyPassword} onChange={e=>setModifyPassword(e.target.value)} />
            </div>
            <div className="form-row">
              <button className="btn" type="submit">Save</button>
            </div>
          </form>

          <h3>Add contribution (repo)</h3>
          <form onSubmit={handleAddRepo} className="profile-form form-vertical">
            <div className="form-row">
              <label htmlFor="repo-url">Repo url</label>
              <input id="repo-url" placeholder="Repo url" value={newRepo.url} onChange={e=>setNewRepo({ url: e.target.value })} />
            </div>
            <div className="form-row">
              <button className="btn primary" type="submit">Add</button>
            </div>
          </form>

          <h3>Your repos</h3>
          <div className="repo-list">
            {user.repos ? Object.keys(user.repos).map(k => (
              <div className="repo-item" key={k}>
                <a href={user.repos[k].url} target="_blank" rel="noreferrer">{user.repos[k].url}</a>
                <div className="muted">Added: {user.repos[k].createdAt ? new Date(user.repos[k].createdAt).toLocaleString() : '—'}</div>
              </div>
            )) : <div className="muted">No repos added yet.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
