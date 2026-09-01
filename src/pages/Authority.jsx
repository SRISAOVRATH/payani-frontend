import { useMemo } from "react";
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

export default function Authority() {
  const { buses, loading, error } = useLiveBuses();

  const stats = useMemo(() => {
    if (buses.length === 0) {
      return {
        fleet: 0,
        running: 0,
        averageOccupancy: "0.0",
        availableSeats: 0,
        highestOccupancy: null,
      };
    }

    // passenger-api provides the running state as trip_status.
    const running = buses.filter(
      (bus) =>
        String(bus.trip_status).toLowerCase() === "running"
    ).length;

    const averageOccupancy = (
      buses.reduce(
        (sum, bus) =>
          sum + Number(bus.occupancy_percent || 0),
        0
      ) / buses.length
    ).toFixed(1);

    const availableSeats = buses.reduce(
      (sum, bus) =>
        sum + Number(bus.available_seats || 0),
      0
    );

    const highestOccupancy = [...buses].sort(
      (a, b) =>
        Number(b.occupancy_percent || 0) -
        Number(a.occupancy_percent || 0)
    )[0];

    return {
      fleet: buses.length,
      running,
      averageOccupancy,
      availableSeats,
      highestOccupancy,
    };
  }, [buses]);

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-eyebrow">
            TRANSPORT AUTHORITY
          </div>

          <h1>
            Live fleet
            <br />
            command view
          </h1>

          <p>
            Monitor the current operating fleet, occupancy,
            capacity and crowd conditions using the live
            transport feed.
          </p>
        </div>

        <div className="hero-stat-card">
          <div className="stat-label">
            Active Fleet
          </div>

          <div className="stat-value">
            {loading ? "—" : stats.fleet}
          </div>

          <div className="stat-caption">
            buses currently reporting live data
          </div>
        </div>
      </section>

      {loading && (
        <section className="loading-state">
          <strong>Loading authority data...</strong>

          <p
            style={{
              marginTop: "8px",
              color: "var(--text-soft)",
            }}
          >
            Connecting to the live fleet feed.
          </p>
        </section>
      )}

      {error && (
        <section className="error-state" role="alert">
          <strong>
            Live authority data unavailable
          </strong>

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

      {!loading && !error && buses.length > 0 && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div className="hero-stat-card">
              <div className="stat-label">
                Running
              </div>

              <div className="stat-value">
                {stats.running}
              </div>

              <div className="stat-caption">
                buses in running status
              </div>
            </div>

            <div className="hero-stat-card">
              <div className="stat-label">
                Avg Occupancy
              </div>

              <div className="stat-value">
                {stats.averageOccupancy}%
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
                {stats.availableSeats}
              </div>

              <div className="stat-caption">
                across the live fleet
              </div>
            </div>

            <div className="hero-stat-card">
              <div className="stat-label">
                Highest Occupancy
              </div>

              <div className="stat-value">
                {stats.highestOccupancy
                  ? `${Number(
                      stats.highestOccupancy
                        .occupancy_percent || 0
                    ).toFixed(1)}%`
                  : "—"}
              </div>

              <div className="stat-caption">
                {stats.highestOccupancy
                  ? stats.highestOccupancy.bus_number
                  : "No live bus"}
              </div>
            </div>
          </section>

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
                Fleet monitoring
              </h2>
            </div>

            <div className="bus-grid">
              {buses.map((bus) => (
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
                        Occupancy
                      </div>

                      <div className="occupancy-value">
                        {Number(
                          bus.occupancy_percent || 0
                        ).toFixed(1)}
                        %
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div className="occupancy-label">
                        Passengers
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
                          Math.max(
                            0,
                            Number(
                              bus.occupancy_percent || 0
                            )
                          )
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
                        {bus.eta_minutes == null
                          ? "N/A"
                          : `${Number(
                              bus.eta_minutes
                            ).toFixed(1)} min`}
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
                        {bus.trip_status}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}