import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Intro from './pages/Intro';
import Contributions from './pages/Contributions';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <div className="bg-canvas" aria-hidden>
          <div className="bg-gradient" />
          <div className="bg-lines">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <nav className="navbar">
          <Link to="/" className="brand">Hacktoberfest</Link>
          <div className="nav-links">
            <Link to="/contributions">Contributions</Link>
            <Link to="/register">Register</Link>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Intro/>} />
            <Route path="/contributions" element={<Contributions/>} />
            <Route path="/register" element={<Register/>} />
          </Routes>
        </main>

        <footer className="footer">Built for Hacktoberfest</footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
