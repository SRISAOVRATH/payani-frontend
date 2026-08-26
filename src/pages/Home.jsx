import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLiveBuses } from "../hooks/useLiveBuses";

function getCrowdClass(level) {
  switch (level) {
    case "Critical":
      return "crowd-critical";
    case "High":
      return "crowd-high";
    case "Medium":
      return "crowd-medium";
    default:
      return "crowd-low";
  }
}

function formatEta(eta) {
  return eta == null ? "N/A" : `${Number(eta).toFixed(1)} min`;
}

export default function Home() {
  const navigate = useNavigate();

  const {
    buses,
    loading,
    error,
    refresh,
  } = useLiveBuses();

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [sourceError, setSourceError] = useState(false);
  const [destinationError, setDestinationError] =
    useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (buses.length > 0) {
      setLastUpdated(new Date());
    }
  }, [buses]);

  const stops = useMemo(() => {
    const values = new Set();

    buses.forEach((bus) => {
      if (bus.source) values.add(bus.source);
      if (bus.destination) values.add(bus.destination);
      if (bus.current_stop) values.add(bus.current_stop);
      if (bus.next_stop) values.add(bus.next_stop);
    });

    return [...values].sort();
  }, [buses]);

  const averageOccupancy =
    buses.length > 0
      ? (
          buses.reduce(
            (sum, bus) =>
              sum + Number(bus.occupancy_percent || 0),
            0
          ) / buses.length
        ).toFixed(1)
      : "0.0";

  const availableSeats = buses.reduce(
    (sum, bus) =>
      sum + Number(bus.available_seats || 0),
    0
  );

  async function handleRefresh() {
    if (refreshing) return;

    setRefreshing(true);

    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  function handleJourneySearch() {
    const missingSource = !source;
    const missingDestination = !destination;

    setSourceError(missingSource);
    setDestinationError(missingDestination);

    if (missingSource || missingDestination) {
      return;
    }

    const params = new URLSearchParams();

    params.set("from", source);
    params.set("to", destination);

    navigate(`/search?${params.toString()}`);
  }

  return (
    <main className="home-page">
      <section
        className="hero-card"
        style={{
          marginBottom: "22px",
        }}
      >
        <div className="hero-eyebrow">
          SMART PUBLIC TRANSPORT
        </div>

        <h1>
          Your city.
          <br />
          Your bus. Live.
        </h1>

        <p>
          Find the right bus, see where it is now, and understand
          crowding and available seats before you travel.
        </p>

        <div
          style={{
            marginTop: "24px",
            padding: "18px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: "var(--payani-yellow)",
            }}
          >
            WHERE ARE YOU GOING?
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) minmax(0, 1fr) auto",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <label
                style={{
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                From
              </label>

              <select
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setSourceError(false);
                }}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  border: sourceError
                    ? "2px solid #dc2626"
                    : "none",
                  borderRadius: "12px",
                  background: sourceError
                    ? "#fff1f2"
                    : "#ffffff",
                  color: "var(--text)",
                  outline: "none",
                }}
              >
                <option value="" disabled>
                  Choose starting point
                </option>

                {stops.map((stop) => (
                  <option key={stop} value={stop}>
                    {stop}
                  </option>
                ))}
              </select>

              {sourceError && (
                <span
                  style={{
                    color: "#fecaca",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Please choose a starting point.
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <label
                style={{
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                To
              </label>

              <select
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setDestinationError(false);
                }}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  border: destinationError
                    ? "2px solid #dc2626"
                    : "none",
                  borderRadius: "12px",
                  background: destinationError
                    ? "#fff1f2"
                    : "#ffffff",
                  color: "var(--text)",
                  outline: "none",
                }}
              >
                <option value="" disabled>
                  Choose destination
                </option>

                {stops.map((stop) => (
                  <option key={stop} value={stop}>
                    {stop}
                  </option>
                ))}
              </select>

              {destinationError && (
                <span
                  style={{
                    color: "#fecaca",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Please choose a destination.
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "end",
              }}
            >
              <button
                type="button"
                onClick={handleJourneySearch}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 18px",
                  background: "var(--payani-yellow)",
                  color: "var(--payani-blue-dark)",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                Find buses
              </button>
            </div>
          </div>

          {(sourceError || destinationError) && (
            <div
              style={{
                marginTop: "12px",
                color: "#fecaca",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Select both a starting point and destination to
              continue.
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        <div className="hero-stat-card">
          <div className="stat-label">Live Fleet</div>

          <div className="stat-value">
            {loading ? "—" : buses.length}
          </div>

          <div className="stat-caption">
            buses reporting now
          </div>
        </div>

        <div className="hero-stat-card">
          <div className="stat-label">
            Average Occupancy
          </div>

          <div className="stat-value">
            {loading ? "—" : `${averageOccupancy}%`}
          </div>

          <div className="stat-caption">
            current fleet average
          </div>
        </div>

        <div className="hero-stat-card">
          <div className="stat-label">
            Seats Available
          </div>

          <div className="stat-value">
            {loading ? "—" : availableSeats}
          </div>

          <div className="stat-caption">
            across the live fleet
          </div>
        </div>

        <div className="hero-stat-card">
          <div className="stat-label">
            Live Status
          </div>

          <div
            style={{
              marginTop: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 11px",
              borderRadius: "999px",
              background: "#edf9f1",
              color: "var(--success)",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            <span className="live-dot" />
            ONLINE
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "var(--text-soft)",
              fontSize: "12px",
            }}
          >
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for live data"}
          </div>
        </div>
      </section>

      {error && (
        <section
          className="error-state"
          role="alert"
        >
          <strong>Live network unavailable</strong>

          <p
            style={{
              marginTop: "8px",
              color: "var(--text-soft)",
            }}
          >
            {error}
          </p>
        </section>
      )}

      {!loading &&
        !error &&
        buses.length > 0 && (
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "end",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "18px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    color: "var(--text-soft)",
                    fontSize: "13px",
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Live buses
                </p>

                <h2
                  style={{
                    marginTop: "5px",
                    fontSize: "28px",
                  }}
                >
                  {buses.length} bus
                  {buses.length === 1 ? "" : "es"}{" "}
                  available
                </h2>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <NavLink
                  to="/search"
                  style={{
                    padding: "9px 13px",
                    borderRadius: "10px",
                    background:
                      "var(--payani-blue-soft)",
                    color:
                      "var(--payani-blue-dark)",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Search buses
                </NavLink>

                <NavLink
                  to="/live-map"
                  style={{
                    padding: "9px 13px",
                    borderRadius: "10px",
                    background:
                      "var(--payani-blue-soft)",
                    color:
                      "var(--payani-blue-dark)",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  View live map
                </NavLink>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  style={{
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 13px",
                    background:
                      "var(--payani-blue)",
                    color: "#ffffff",
                    fontWeight: 800,
                    opacity: refreshing ? 0.65 : 1,
                    cursor: refreshing
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </button>
              </div>
            </div>

            <div className="bus-grid">
              {buses.map((bus) => {
                const occupancy = Number(
                  bus.occupancy_percent || 0
                );

                return (
                  <article
                    className="bus-card"
                    key={bus.trip_id}
                  >
                    <div className="bus-card-top">
                      <div>
                        <div className="bus-number">
                          {bus.bus_number}
                        </div>

                        <div className="bus-type">
                          {bus.bus_type}
                        </div>
                      </div>

                      <span
                        className={getCrowdClass(
                          bus.crowd_level
                        )}
                      >
                        {bus.crowd_level}
                      </span>
                    </div>

                    <div className="route-name">
                      {bus.route_name}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        display: "grid",
                        gap: "5px",
                        color:
                          "var(--text-soft)",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        Current:{" "}
                        <strong>
                          {bus.current_stop}
                        </strong>
                      </div>

                      <div>
                        Next:{" "}
                        <strong>
                          {bus.next_stop}
                        </strong>
                      </div>
                    </div>

                    <div className="occupancy-row">
                      <div>
                        <div className="occupancy-label">
                          Occupancy
                        </div>

                        <div className="occupancy-value">
                          {occupancy.toFixed(1)}%
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <div className="occupancy-label">
                          Available
                        </div>

                        <div className="metric-value">
                          {bus.available_seats} seats
                        </div>
                      </div>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, occupancy)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="bus-metrics">
                      <div className="metric">
                        <div className="metric-label">
                          ETA
                        </div>

                        <div className="metric-value">
                          {formatEta(
                            bus.eta_minutes
                          )}
                        </div>
                      </div>

                      <div className="metric">
                        <div className="metric-label">
                          Seats
                        </div>

                        <div className="metric-value">
                          {bus.available_seats}
                        </div>
                      </div>

                      <div className="metric">
                        <div className="metric-label">
                          Speed
                        </div>

                        <div className="metric-value">
                          {bus.speed_kmh} km/h
                        </div>
                      </div>

                      <div className="metric">
                        <div className="metric-label">
                          Status
                        </div>

                        <div className="metric-value">
                          {bus.status}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

      {!loading &&
        !error &&
        buses.length === 0 && (
          <section className="empty-state">
            <strong>No live buses available</strong>

            <p
              style={{
                marginTop: "8px",
                color: "var(--text-soft)",
              }}
            >
              Please check again shortly.
            </p>
          </section>
        )}
    </main>
  );
}