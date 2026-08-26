import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import LiveMap from "./pages/LiveMap";
import Authority from "./pages/Authority";
import "./App.css";

function NavItem({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        padding: "9px 13px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 700,
        color: isActive
          ? "var(--payani-blue-dark)"
          : "var(--text-soft)",
        background: isActive
          ? "var(--payani-blue-soft)"
          : "transparent",
      })}
    >
      {children}
    </NavLink>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-inner">
            <NavLink
              to="/"
              className="brand"
              style={{ textDecoration: "none" }}
            >
              <div className="brand-mark">P</div>

              <div className="brand-text">
                <strong>PAYANI</strong>
                <span>SmartBus</span>
              </div>
            </NavLink>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <NavItem to="/" end>
                Home
              </NavItem>

              <NavItem to="/search">
                Search
              </NavItem>

              <NavItem to="/live-map">
                Live Map
              </NavItem>

              <NavItem to="/authority">
                Authority
              </NavItem>

              <div className="live-status">
                <span className="live-dot" />
                LIVE
              </div>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/live-map" element={<LiveMap />} />
          <Route path="/authority" element={<Authority />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;