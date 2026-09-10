import { useMemo, useState } from "react";
import {
  BarChart3,
  Clock3,
  RefreshCw,
  ShieldCheck,
  X,
  BusFront,
  MapPin,
  Gauge,
  UsersRound,
  BrainCircuit,
} from "lucide-react";
import { useLiveBuses } from "../hooks/useLiveBuses";

const levels = [
  ["Low", 0, 40],
  ["Medium", 40, 70],
  ["High", 70, 85],
  ["Critical", 85, 100],
];

function confidence(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? `${(n <= 1 ? n * 100 : n).toFixed(0)}%`
    : "—";
}

export default function Authority() {
  const { buses, loading, error, refresh } = useLiveBuses();

  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const stats = useMemo(() => {
    const fleet = buses.length;

    const running = buses.filter(
      (b) =>
        String(b.trip_status || b.bus_status).toLowerCase() ===
        "running"
    ).length;

    const average = fleet
      ? buses.reduce(
          (s, b) => s + Number(b.occupancy_percent || 0),
          0
        ) / fleet
      : 0;

    const seats = buses.reduce(
      (s, b) => s + Number(b.available_seats || 0),
      0
    );

    return {
      fleet,
      running,
      average,
      seats,
    };
  }, [buses]);

  const highest = [...buses].sort(
    (a, b) =>
      Number(b.occupancy_percent || 0) -
      Number(a.occupancy_percent || 0)
  );

  const distribution = levels.map(([name, min, max]) => ({
    name,
    count: buses.filter((b) => {
      const v = Number(b.occupancy_percent || 0);

      return (
        v >= min &&
        (max === 100 ? v <= max : v < max)
      );
    }).length,
  }));

  const maxCount = Math.max(
    1,
    ...distribution.map((d) => d.count)
  );

  const routePerformance = Object.values(
    buses.reduce((acc, bus) => {
      const key =
        bus.route_code ||
        bus.route_name ||
        "Route";

      acc[key] ||= {
        route: key,
        buses: 0,
        total: 0,
      };

      acc[key].buses += 1;
      acc[key].total += Number(
        bus.occupancy_percent || 0
      );

      return acc;
    }, {})
  ).map((r) => ({
    ...r,
    average: r.total / r.buses,
  }));

  return (
    <main className="page-shell authority-page">

      {/* =====================================================
          HERO
         ===================================================== */}

      <section className="authority-hero">
        <div>
          <div className="eyebrow">
            TRANSPORT AUTHORITY
          </div>

          <h1>
            Live fleet
            <br />
            command view.
          </h1>

          <p>
            Monitor the operating fleet, crowd conditions
            and network performance using the live transport feed.
          </p>
        </div>

        <div className="authority-hero-badge">
          <ShieldCheck size={20} />

          <span>OPERATIONAL</span>

          <strong>
            {stats.fleet}
          </strong>

          <small>
            live buses reporting
          </small>
        </div>
      </section>

      {/* =====================================================
          ERROR
         ===================================================== */}

      {error && (
        <section className="state-card state-error">
          {error}
        </section>
      )}

      {/* =====================================================
          KPI
         ===================================================== */}

      <section className="kpi-grid">

        <div className="kpi-card">
          <span>ACTIVE FLEET</span>

          <strong>
            {loading ? "—" : stats.fleet}
          </strong>

          <small>
            buses reporting live data
          </small>
        </div>

        <div className="kpi-card">
          <span>RUNNING</span>

          <strong>
            {loading ? "—" : stats.running}
          </strong>

          <small>
            buses in service
          </small>
        </div>

        <div className="kpi-card">
          <span>AVERAGE OCCUPANCY</span>

          <strong>
            {stats.average.toFixed(1)}%
          </strong>

          <small>
            current fleet average
          </small>
        </div>

        <div className="kpi-card">
          <span>SEATS AVAILABLE</span>

          <strong>
            {stats.seats}
          </strong>

          <small>
            across the live fleet
          </small>
        </div>

      </section>

      {/* =====================================================
          AUTHORITY GRID
         ===================================================== */}

      <section className="authority-grid">

        {/* CROWD DISTRIBUTION */}

        <article className="panel-card">

          <div className="panel-heading">

            <div>
              <div className="section-kicker">
                FLEET OVERVIEW
              </div>

              <h2>
                Crowd distribution
              </h2>
            </div>

            <button
              className="icon-button"
              onClick={refresh}
            >
              <RefreshCw size={15} />
            </button>

          </div>

          <div className="distribution-chart">

            {distribution.map((item) => (
              <button
                className="bar-column"
                key={item.name}
                onClick={() =>
                  setSelectedBus(
                    highest.find(
                      (bus) =>
                        bus.crowd_level === item.name
                    ) || null
                  )
                }
              >

                <span>
                  {item.count}
                </span>

                <div className="bar-track">
                  <div
                    className={`bar-fill ${item.name.toLowerCase()}`}
                    style={{
                      height: `${
                        (item.count / maxCount) * 100
                      }%`,
                    }}
                  />
                </div>

                <strong>
                  {item.name}
                </strong>

                <small>
                  {
                    levels.find(
                      (x) => x[0] === item.name
                    )[1]
                  }
                  –
                  {
                    levels.find(
                      (x) => x[0] === item.name
                    )[2]
                  }
                  %
                </small>

              </button>
            ))}

          </div>

        </article>

        {/* ROUTE PERFORMANCE */}

        <article className="panel-card">

          <div className="panel-heading">

            <div>
              <div className="section-kicker">
                ROUTE PERFORMANCE
              </div>

              <h2>
                Network snapshot
              </h2>
            </div>

            <BarChart3 size={20} />

          </div>

          <div className="table-list">

            {routePerformance.map((route) => (
              <button
                className="table-row table-row-button"
                key={route.route}
                onClick={() =>
                  setSelectedRoute(route.route)
                }
              >

                <div>
                  <strong>
                    {route.route}
                  </strong>

                  <small>
                    {route.buses} buses
                  </small>
                </div>

                <span>
                  {route.average.toFixed(1)}%
                </span>

                <div className="mini-progress">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        route.average
                      )}%`,
                    }}
                  />
                </div>

              </button>
            ))}

            {!routePerformance.length && (
              <div className="empty-mini">
                Waiting for live route data.
              </div>
            )}

          </div>

        </article>

      </section>

      {/* =====================================================
          ROUTE DETAIL
         ===================================================== */}

      {selectedRoute && (
        <section className="route-detail-strip">

          <div>
            <span className="section-kicker">
              ROUTE DETAIL
            </span>

            <strong>
              {selectedRoute}
            </strong>

            <small>
              {
                buses.filter(
                  (b) =>
                    (b.route_code ||
                      b.route_name) ===
                    selectedRoute
                ).length
              }{" "}
              active bus(es) on this route
            </small>
          </div>

          <div>
            {buses
              .filter(
                (b) =>
                  (b.route_code ||
                    b.route_name) ===
                  selectedRoute
              )
              .map((b) => (
                <button
                  key={
                    b.trip_id ||
                    b.bus_id
                  }
                  onClick={() =>
                    setSelectedBus(b)
                  }
                >
                  {b.bus_name || b.bus_number}
                  {" · "}
                  {Number(
                    b.occupancy_percent || 0
                  ).toFixed(1)}
                  %
                </button>
              ))}
          </div>

          <button
            className="icon-button"
            onClick={() =>
              setSelectedRoute(null)
            }
          >
            <X size={15} />
          </button>

        </section>
      )}

      {/* =====================================================
          HIGHEST OCCUPANCY
         ===================================================== */}

      <section className="section-block">

        <div className="section-heading-row">

          <div>
            <div className="section-kicker">
              HIGHEST OCCUPANCY BUSES
            </div>

            <h2>
              Priority watchlist
            </h2>
          </div>

          <div className="timestamp">
            <Clock3 size={14} />
            Live snapshot
          </div>

        </div>

        <div className="watch-grid">

          {highest
            .slice(0, 5)
            .map((bus) => (
              <button
                className="watch-card watch-card-button"
                key={
                  bus.trip_id ||
                  bus.bus_id
                }
                onClick={() =>
                  setSelectedBus(bus)
                }
              >

                <div className="watch-top">

                  <strong>
                    {bus.bus_name ||
                      bus.bus_number}
                  </strong>

                  <span>
                    {bus.crowd_level ||
                      "Low"}
                  </span>

                </div>

                <small>
                  Vehicle:{" "}
                  {bus.bus_number}
                </small>

                <small>
                  {bus.route_name}
                </small>

                <strong className="watch-value">
                  {Number(
                    bus.occupancy_percent || 0
                  ).toFixed(1)}
                  %
                </strong>

                <div className="mini-progress">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        Number(
                          bus.occupancy_percent ||
                            0
                        )
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  {bus.available_seats ??
                    "—"}{" "}
                  seats available
                </small>

                <span className="watch-more">
                  View details →
                </span>

              </button>
            ))}

        </div>

      </section>

      {/* =====================================================
          BUS DETAIL MODAL
         ===================================================== */}

      {selectedBus && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedBus(null)
          }
        >

          <section
            className="detail-modal authority-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <div className="section-kicker">
                  FLEET DETAIL
                </div>

                <h2>
                  {selectedBus.bus_name ||
                    selectedBus.bus_number}
                </h2>

                <p>
                  Vehicle:{" "}
                  {selectedBus.bus_number}
                  {" · "}
                  {selectedBus.route_name}
                </p>

              </div>

              <button
                className="icon-button"
                onClick={() =>
                  setSelectedBus(null)
                }
              >
                <X size={17} />
              </button>

            </div>

            <div className="detail-bus-header">

              <BusFront size={22} />

              <div>

                <strong>
                  {selectedBus.bus_type ||
                    "Service"}
                </strong>

                <span>
                  {selectedBus.trip_status ||
                    selectedBus.bus_status ||
                    "Unknown"}
                  {" · "}
                  {selectedBus.crowd_level ||
                    "Low"}
                </span>

              </div>

            </div>

            <div className="detail-grid">

              <div>
                <span>Route</span>
                <strong>
                  {selectedBus.source} →{" "}
                  {selectedBus.destination}
                </strong>
              </div>

              <div>
                <span>
                  <MapPin size={10} />
                  Current / next
                </span>

                <strong>
                  {selectedBus.current_stop ||
                    "—"}{" "}
                  →{" "}
                  {selectedBus.next_stop ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  <Gauge size={10} />
                  Speed
                </span>

                <strong>
                  {selectedBus.speed_kmh ??
                    "—"}{" "}
                  km/h
                </strong>
              </div>

              <div>
                <span>
                  <Clock3 size={10} />
                  ETA
                </span>

                <strong>
                  {selectedBus.eta_minutes ==
                  null
                    ? "N/A"
                    : `${Number(
                        selectedBus.eta_minutes
                      ).toFixed(1)} min`}
                </strong>
              </div>

              <div>
                <span>
                  <UsersRound size={10} />
                  Passengers
                </span>

                <strong>
                  {selectedBus.current_passengers ??
                    "—"}{" "}
                  /{" "}
                  {selectedBus.capacity ??
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Seats available
                </span>

                <strong>
                  {selectedBus.available_seats ??
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Current occupancy
                </span>

                <strong>
                  {Number(
                    selectedBus.occupancy_percent ||
                      0
                  ).toFixed(1)}
                  %
                </strong>
              </div>

              <div>
                <span>
                  <BrainCircuit size={10} />
                  Next{" "}
                  {selectedBus.prediction_horizon_minutes ||
                    15}{" "}
                  min
                </span>

                <strong>
                  {selectedBus.predicted_occupancy_percent ==
                  null
                    ? "—"
                    : `${Number(
                        selectedBus.predicted_occupancy_percent
                      ).toFixed(1)}%`}
                </strong>
              </div>

              <div>
                <span>
                  Predicted passengers
                </span>

                <strong>
                  {selectedBus.predicted_passengers ??
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Boardings / exits
                </span>

                <strong>
                  {selectedBus.predicted_boardings ??
                    "—"}{" "}
                  /{" "}
                  {selectedBus.predicted_exits ??
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Prediction confidence
                </span>

                <strong>
                  {confidence(
                    selectedBus.confidence_score
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Model
                </span>

                <strong>
                  {selectedBus.aoce_model_version ||
                    "AOCE"}
                </strong>
              </div>

            </div>

          </section>

        </div>
      )}

    </main>
  );
}