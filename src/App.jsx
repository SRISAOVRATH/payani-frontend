import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import {
  BusFront,
  MapPinned,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";

import Home from "./pages/Home";
import SearchPage from "./pages/Search";
import LiveMap from "./pages/LiveMap";
import Authority from "./pages/Authority";
import BusDetails from "./pages/BusDetails";

import "./App.css";

function NavItem({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="nav-item"
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-inner">
            <NavLink
              to="/"
              className="brand"
              aria-label="PAYANI home"
            >
              <div className="brand-mark">
                <BusFront size={19} strokeWidth={2.6} />
              </div>

              <div className="brand-text">
                <strong>PAYANI</strong>
                <span>SmartBus</span>
              </div>
            </NavLink>

            <nav
              className="main-nav"
              aria-label="Primary navigation"
            >
              <NavItem to="/" end>
                <span>Home</span>
              </NavItem>

              <NavItem to="/search">
                <Search size={14} />
                <span>Search</span>
              </NavItem>

              <NavItem to="/live-map">
                <MapPinned size={14} />
                <span>Live Map</span>
              </NavItem>

              <NavItem to="/authority">
                <ShieldCheck size={14} />
                <span>Authority</span>
              </NavItem>

              <div className="live-pill">
                <span className="live-dot" />
                LIVE
              </div>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/live-map" element={<LiveMap />} />
          <Route path="/authority" element={<Authority />} />
          <Route path="/bus/:tripId" element={<BusDetails />} />
        </Routes>

        <footer className="site-footer">
          <div>
            <Zap size={14} />
            PAYANI SmartBus
          </div>

          <span>
            Real-time · Passenger-first · Scalable
          </span>
        </footer>
      </div>
    </BrowserRouter>
  );
}