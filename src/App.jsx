import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";

import {
  Bell,
  BusFront,
  Heart,
  MapPinned,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import Home from "./pages/Home";
import SearchPage from "./pages/Search";
import LiveMap from "./pages/LiveMap";
import Authority from "./pages/Authority";
import BusDetails from "./pages/BusDetails";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import PayaniAI from "./components/PayaniAI";

import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext";

import { WishlistProvider } from "./context/WishlistContext";
import { SettingsProvider } from "./context/SettingsContext";

import "./App.css";

function NavItem({
  to,
  children,
  end = false,
}) {
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

function NotificationsNavItem() {
  const { unreadCount } = useNotifications();

  return (
    <NavItem to="/notifications">
      <Bell size={14} />

      <span>Notifications</span>

      {unreadCount > 0 && (
        <span className="notification-nav-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </NavItem>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <WishlistProvider>
          <NotificationProvider>
            <div className="app-shell">
              <header className="app-header">
                <div className="app-header-inner">
                  <NavLink
                    to="/"
                    className="brand"
                    aria-label="PAYANI home"
                  >
                    <div className="brand-mark">
                      <BusFront
                        size={19}
                        strokeWidth={2.6}
                      />
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

                    <NavItem to="/wishlist">
                      <Heart size={14} />
                      <span>My Buses</span>
                    </NavItem>

                    <NotificationsNavItem />

                    <NavItem to="/ai">
                      <Sparkles size={14} />
                      <span>PAYANI AI</span>
                    </NavItem>

                    <NavItem to="/settings">
                      <Settings size={14} />
                      <span>Settings</span>
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
                <Route
                  path="/"
                  element={<Home />}
                />

                <Route
                  path="/search"
                  element={<SearchPage />}
                />

                <Route
                  path="/live-map"
                  element={<LiveMap />}
                />

                <Route
                  path="/authority"
                  element={<Authority />}
                />

                <Route
                  path="/bus/:tripId"
                  element={<BusDetails />}
                />

                <Route
                  path="/wishlist"
                  element={<Wishlist />}
                />

                <Route
                  path="/notifications"
                  element={<Notifications />}
                />

                <Route
                  path="/ai"
                  element={<PayaniAI />}
                />

                <Route
                  path="/settings"
                  element={<SettingsPage />}
                />
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
          </NotificationProvider>
        </WishlistProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}