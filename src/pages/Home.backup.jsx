import { useEffect, useState } from "react";
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
  const { buses, loading, error, refresh } = useLiveBuses();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  useEffect(() => {
    if (buses.length > 0) {
      setLastUpdated(new Date());
    }
  }, [buses]);

  async function handleRefresh() {
    if (refreshing) return;

    setRefreshing(true);

    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="app-shell">
      <main className="home-page">
        <section className="hero-section">
          <div className="hero-card">
            <div className="hero-eyebrow">
              Intelligent Public Transport
            </div>

            <h1>
              Travel smarter with
              <br />
              PAYANI SmartBus
            </h1>

            <p>
              Real-time buses, occupancy, ETA, crowd status and
              intelligent passenger insights in one place.
            </p>
          </div>

          <div className="hero-stat-card">
            <div className="stat-label">Live Fleet</div>

            <div className="stat-value">
              {loading ? "—" : buses.length}
            </div>

            <div className="stat-caption">
              buses currently reporting live data
            </div>

            <div
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div className="stat-label">
                Average Occupancy
              </div>

              <div className="stat-value">
                {loading ? "—" : `${averageOccupancy}%`}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginTop: "18px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "var(--text-soft)",
                      fontSize: "13px",
                    }}
                  >
                    Auto-refreshes every 15 seconds
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "var(--text-soft)",
                      fontSize: "12px",
                    }}
                  >
                    {lastUpdated
                      ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                      : "Waiting for live data..."}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  style={{
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 13px",
                    background: "var(--payani-blue)",
                    color: "#ffffff",
                    fontWeight: 800,
                    opacity: refreshing ? 0.65 : 1,
                    cursor: refreshing
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <section className="loading-state">
            <strong>Loading live transport data...</strong>

            <p
              style={{
                marginTop: "8px",
                color: "var(--text-soft)",
              }}
            >
              Connecting to the PAYANI live network.
            </p>
          </section>
        )}

        {error && (
          <section className="error-state" role="alert">
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

        {!loading && !error && buses.length === 0 && (
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

        {!loading && !error && buses.length > 0 && (
          <section>
            <div style={{ marginBottom: "18px" }}>
              <p
                style={{
                  color: "var(--text-soft)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Live Fleet
              </p>

              <h2
                style={{
                  marginTop: "5px",
                  fontSize: "28px",
                }}
              >
                Buses on the network
              </h2>
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

                    <div className="stop-line">
                      {bus.current_stop} → {bus.next_stop}
                    </div>

                    <div className="occupancy-row">
                      <div>
                        <div className="occupancy-label">
                          Current occupancy
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
                          Capacity
                        </div>

                        <div className="metric-value">
                          {bus.current_passengers} /{" "}
                          {bus.capacity}
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
                          {formatEta(bus.eta_minutes)}
                        </div>
                      </div>

                      <div className="metric">
                        <div className="metric-label">
                          Available seats
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
      </main>
    </div>
  );
}