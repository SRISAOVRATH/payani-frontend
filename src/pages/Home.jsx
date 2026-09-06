import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Clock3,
  Leaf,
  MapPinned,
  Search,
  UsersRound,
  Zap,
} from "lucide-react";
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

function getProgressClass(level) {
  switch (level) {
    case "Critical":
      return "critical";
    case "High":
      return "high";
    case "Medium":
      return "medium";
    default:
      return "low";
  }
}

function formatEta(eta) {
  return eta == null
    ? "N/A"
    : `${Number(eta).toFixed(1)} min`;
}

function formatConfidence(score) {
  return score == null
    ? "N/A"
    : `${Math.round(Number(score) * 100)}%`;
}

export default function Home() {
  const navigate = useNavigate();

  const {
    buses,
    loading,
    error,
    refresh,
    lastUpdated,
  } = useLiveBuses();

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [sourceError, setSourceError] =
    useState(false);

  const [destinationError, setDestinationError] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

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
              sum +
              Number(
                bus.occupancy_percent || 0
              ),
            0
          ) / buses.length
        ).toFixed(1)
      : "0.0";

  const availableSeats = buses.reduce(
    (sum, bus) =>
      sum +
      Number(
        bus.available_seats || 0
      ),
    0
  );

  const busiestBus = useMemo(() => {
    if (!buses.length) return null;

    return [...buses].sort(
      (a, b) =>
        Number(
          b.occupancy_percent || 0
        ) -
        Number(
          a.occupancy_percent || 0
        )
    )[0];
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

  function handleJourneySearch() {
    const missingSource = !source;
    const missingDestination = !destination;

    setSourceError(missingSource);
    setDestinationError(
      missingDestination
    );

    if (
      missingSource ||
      missingDestination
    ) {
      return;
    }

    const params =
      new URLSearchParams();

    params.set("from", source);
    params.set("to", destination);

    navigate(
      `/search?${params.toString()}`
    );
  }

  useEffect(() => {
    if (
      source &&
      !stops.includes(source)
    ) {
      setSource("");
    }

    if (
      destination &&
      !stops.includes(destination)
    ) {
      setDestination("");
    }
  }, [
    stops,
    source,
    destination,
  ]);

  return (
    <main className="home-page">

      {/* ======================================================
          HERO
         ====================================================== */}

      <section className="home-hero">
          
         <div className="hero-bus-image">
           <img
             src="/payani-bus-hero.png"
             alt="PAYANI SmartBus"
           />
         </div>


        <div className="hero-copy">

          <div className="eyebrow">
            SMART PUBLIC TRANSPORT
          </div>

          <h1>
            Your journey
            <br />
            <span>smarter, together.</span>
          </h1>

          <p>
            Real-time buses. Live occupancy.
            Better journeys for everyone.
          </p>

          <div className="hero-search">

            <label
              className={
                sourceError
                  ? "field-error"
                  : ""
              }
            >
              <span>From</span>

              <select
                value={source}
                onChange={(event) => {
                  setSource(
                    event.target.value
                  );
                  setSourceError(false);
                }}
              >
                <option
                  value=""
                  disabled
                >
                  Choose starting point
                </option>

                {stops.map((stop) => (
                  <option
                    key={stop}
                    value={stop}
                  >
                    {stop}
                  </option>
                ))}
              </select>

              {sourceError && (
                <small className="field-error-text">
                  Please choose a
                  starting point.
                </small>
              )}
            </label>

            <label
              className={
                destinationError
                  ? "field-error"
                  : ""
              }
            >
              <span>To</span>

              <select
                value={destination}
                onChange={(event) => {
                  setDestination(
                    event.target.value
                  );
                  setDestinationError(
                    false
                  );
                }}
              >
                <option
                  value=""
                  disabled
                >
                  Choose destination
                </option>

                {stops.map((stop) => (
                  <option
                    key={stop}
                    value={stop}
                  >
                    {stop}
                  </option>
                ))}
              </select>

              {destinationError && (
                <small className="field-error-text">
                  Please choose a
                  destination.
                </small>
              )}
            </label>

            <button
              type="button"
              className="primary-button"
              onClick={handleJourneySearch}
            >
              <Search size={15} />
              Find buses
            </button>

            {(sourceError ||
              destinationError) && (
              <div className="hero-search-error">
                Select both a starting
                point and destination to
                continue.
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURE BOXES
         ====================================================== */}

      <section className="feature-grid">

        <div className="feature-card">
          <div className="feature-icon blue">
            <Zap size={17} />
          </div>

          <h3>
            Live Tracking
          </h3>

          <p>
            See real-time bus
            locations.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon blue">
            <UsersRound size={17} />
          </div>

          <h3>
            Live Occupancy
          </h3>

          <p>
            Know crowd levels before
            you board.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon blue">
            <Clock3 size={17} />
          </div>

          <h3>
            Accurate ETA
          </h3>

          <p>
            Plan your journey with
            confidence.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon green">
            <Leaf size={17} />
          </div>

          <h3>
            Smarter Cities
          </h3>

          <p>
            Together for a
            sustainable tomorrow.
          </p>
        </div>

      </section>

      {/* ======================================================
          SUMMARY
         ====================================================== */}

      <section className="home-summary-grid">

        <div className="summary-card">
          <span>
            Live Fleet
          </span>

          <strong>
            {loading
              ? "—"
              : buses.length}
          </strong>

          <small>
            buses reporting now
          </small>
        </div>

        <div className="summary-card">
          <span>
            Average Occupancy
          </span>

          <strong>
            {loading
              ? "—"
              : `${averageOccupancy}%`}
          </strong>

          <small>
            current fleet average
          </small>
        </div>

        <div className="summary-card">
          <span>
            Seats Available
          </span>

          <strong>
            {loading
              ? "—"
              : availableSeats}
          </strong>

          <small>
            across the live fleet
          </small>
        </div>

        <div className="summary-card live-summary">
          <span>
            Network Status
          </span>

          <strong>
            <span className="live-dot" />
            ONLINE
          </strong>

          <small>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for live data"}
          </small>
        </div>

      </section>

      {/* ======================================================
          LIVE INTELLIGENCE
         ====================================================== */}

      {!loading &&
        !error &&
        buses.length > 0 && (
          <section className="quick-panel">

            <div>
              <div className="section-kicker">
                LIVE INTELLIGENCE
              </div>

              <strong>
                {busiestBus
                  ? `${busiestBus.bus_number} is currently the busiest bus.`
                  : "Live fleet intelligence available."}
              </strong>
            </div>

            <div className="quick-panel-stat">
              <span>
                Peak occupancy
              </span>

              <strong>
                {busiestBus
                  ? `${Number(
                      busiestBus.occupancy_percent ||
                        0
                    ).toFixed(1)}%`
                  : "—"}
              </strong>
            </div>

            <div className="quick-panel-stat">
              <span>
                Prediction
              </span>

              <strong>
                {busiestBus?.predicted_occupancy_percent ==
                null
                  ? "—"
                  : `${Number(
                      busiestBus.predicted_occupancy_percent
                    ).toFixed(1)}%`}
              </strong>
            </div>

          </section>
        )}

      {/* ======================================================
          ERROR
         ====================================================== */}

      {error && (
        <section
          className="state-card state-error"
          role="alert"
        >
          <strong>
            Live network unavailable
          </strong>

          <span>
            {error}
          </span>
        </section>
      )}

      {/* ======================================================
          LIVE BUSES
         ====================================================== */}

      {!loading &&
        !error &&
        buses.length > 0 && (
          <section className="section-block">

            <div className="section-heading-row">

              <div>
                <div className="section-kicker">
                  LIVE BUSES IN SERVICE
                </div>

                <h2>
                  {buses.length} buses
                  available
                </h2>
              </div>

              <div className="section-actions">

                <NavLink
                  to="/search"
                  className="ghost-button"
                >
                  Search buses
                  <Search size={13} />
                </NavLink>

                <NavLink
                  to="/live-map"
                  className="ghost-button"
                >
                  View live map
                  <MapPinned size={13} />
                </NavLink>

                <button
                  type="button"
                  className="refresh-button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </button>

              </div>
            </div>

            <div className="bus-grid">

              {buses.map((bus) => {
                const occupancy =
                  Number(
                    bus.occupancy_percent ||
                      0
                  );

                const predictedOccupancy =
                  bus.predicted_occupancy_percent ==
                  null
                    ? null
                    : Number(
                        bus.predicted_occupancy_percent
                      );

                const predictedPassengers =
                  bus.predicted_passengers ==
                  null
                    ? null
                    : Number(
                        bus.predicted_passengers
                      );

                const currentPassengers =
                  Number(
                    bus.current_passengers ||
                      0
                  );

                const predictionChange =
                  predictedPassengers ==
                  null
                    ? null
                    : predictedPassengers -
                      currentPassengers;

                return (
                  <article
                    key={bus.trip_id}
                    className="bus-card bus-card-clickable"
                    onClick={() =>
                      navigate(
                        `/bus/${bus.trip_id}`
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        navigate(
                          `/bus/${bus.trip_id}`
                        );
                      }
                    }}
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
                      {bus.current_stop}
                      <span>→</span>
                      {bus.next_stop}
                    </div>

                    <div className="occupancy-row">

                      <div>
                        <div className="occupancy-label">
                          Occupancy
                        </div>

                        <div className="occupancy-value">
                          {occupancy.toFixed(
                            1
                          )}
                          %
                        </div>
                      </div>

                      <div className="passenger-count">
                        <span>
                          Passengers
                        </span>

                        <strong>
                          {currentPassengers} /{" "}
                          {bus.capacity}
                        </strong>
                      </div>

                    </div>

                    <div className="progress-track">
                      <div
                        className={`progress-bar ${getProgressClass(
                          bus.crowd_level
                        )}`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              occupancy
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    {predictedOccupancy !=
                      null && (
                      <div className="prediction-strip">

                        <div>
                          <span>
                            Next{" "}
                            {bus.prediction_horizon_minutes ??
                              15}{" "}
                            min
                          </span>

                          <strong>
                            {
                              predictedOccupancy.toFixed(
                                1
                              )
                            }
                            % predicted
                          </strong>
                        </div>

                        <div className="prediction-meta">
                          <span>
                            Confidence{" "}
                            {formatConfidence(
                              bus.confidence_score
                            )}
                          </span>

                          <strong>
                            {predictedPassengers ??
                              "—"}{" "}
                            /{" "}
                            {bus.capacity}
                          </strong>

                          {predictionChange !==
                            null && (
                            <small
                              className={
                                predictionChange >
                                0
                                  ? "delta-up"
                                  : predictionChange <
                                      0
                                    ? "delta-down"
                                    : "delta-flat"
                              }
                            >
                              {predictionChange >
                              0
                                ? `+${predictionChange} passengers`
                                : predictionChange <
                                    0
                                  ? `${predictionChange} passengers`
                                  : "Stable"}
                            </small>
                          )}
                        </div>

                      </div>
                    )}

                    <div className="bus-metrics">

                      <div className="metric">
                        <span>
                          ETA
                        </span>

                        <strong>
                          {formatEta(
                            bus.eta_minutes
                          )}
                        </strong>
                      </div>

                      <div className="metric">
                        <span>
                          Seats
                        </span>

                        <strong>
                          {bus.available_seats}
                        </strong>
                      </div>

                      <div className="metric">
                        <span>
                          Speed
                        </span>

                        <strong>
                          {bus.speed_kmh} km/h
                        </strong>
                      </div>

                      <div className="metric">
                        <span>
                          Status
                        </span>

                        <strong>
                          {bus.trip_status ||
                            bus.bus_status ||
                            "Unknown"}
                        </strong>
                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          </section>
        )}

      {/* ======================================================
          EMPTY
         ====================================================== */}

      {!loading &&
        !error &&
        buses.length === 0 && (
          <section className="state-card">
            <strong>
              No live buses available
            </strong>

            <span>
              Please check again shortly.
            </span>
          </section>
        )}

    </main>
  );
}