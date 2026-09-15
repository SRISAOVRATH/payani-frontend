import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Clock3,
  Leaf,
  MapPinned,
  Search,
  UsersRound,
  Heart,
  Zap,
} from "lucide-react";
import { useLiveBuses } from "../hooks/useLiveBuses";
import { useWishlist } from "../context/WishlistContext";

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

function normalizeStopSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");

  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index
  );

  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      const cost =
        left[i - 1] === right[j - 1]
          ? 0
          : 1;

      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + cost
      );

      diagonal = above;
    }
  }

  return previous[right.length];
}

function isSubsequence(query, target) {
  if (!query) {
    return true;
  }

  let queryIndex = 0;

  for (const character of target) {
    if (character === query[queryIndex]) {
      queryIndex += 1;

      if (queryIndex === query.length) {
        return true;
      }
    }
  }

  return false;
}

function fuzzyStopScore(query, stop) {
  const cleanQuery = normalizeStopSearch(query);
  const cleanStop = normalizeStopSearch(stop);

  if (!cleanQuery) {
    return -1;
  }

  if (cleanStop === cleanQuery) {
    return 1200;
  }

  const directIndex = cleanStop.indexOf(cleanQuery);

  if (directIndex !== -1) {
    return 1100 - directIndex;
  }

  const words = String(query || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = String(stop || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (
    words.some((word) =>
      stopWords.some((stopWord) =>
        stopWord.includes(word)
      )
    )
  ) {
    return 1000;
  }

  if (isSubsequence(cleanQuery, cleanStop)) {
    return (
      900 -
      Math.max(
        0,
        cleanStop.length -
          cleanQuery.length
      )
    );
  }

  const queryLength = cleanQuery.length;
  let bestDistance = Infinity;

  const minimumLength = Math.max(
    1,
    queryLength - 1
  );

  const maximumLength = Math.min(
    cleanStop.length,
    queryLength + 1
  );

  for (
    let length = minimumLength;
    length <= maximumLength;
    length += 1
  ) {
    for (
      let start = 0;
      start + length <= cleanStop.length;
      start += 1
    ) {
      const part = cleanStop.slice(
        start,
        start + length
      );

      bestDistance = Math.min(
        bestDistance,
        levenshteinDistance(
          cleanQuery,
          part
        )
      );
    }
  }

  const allowedDistance =
    queryLength <= 2
      ? 1
      : Math.max(
          1,
          Math.floor(queryLength * 0.4)
        );

  if (
    bestDistance <= allowedDistance
  ) {
    return (
      800 -
      bestDistance * 80
    );
  }

  return -1;
}

function getStopMatches(query, stops, limit = 8) {
  if (!String(query || "").trim()) {
    return [];
  }

  return stops
    .map((stop) => ({
      stop,
      score: fuzzyStopScore(
        query,
        stop
      ),
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.stop.localeCompare(b.stop);
    })
    .slice(0, limit)
    .map((item) => item.stop);
}

export default function Home() {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const {
    buses,
    loading,
    error,
    refresh,
    lastUpdated,
  } = useLiveBuses();

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [sourceQuery, setSourceQuery] = useState("");
  const [destinationQuery, setDestinationQuery] =
    useState("");
  const [activeStopField, setActiveStopField] =
    useState(null);

  const [sourceError, setSourceError] =
    useState(false);

  const [destinationError, setDestinationError] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const stops = useMemo(() => {
    const values = new Set();

    buses.forEach((bus) => {
      if (Array.isArray(bus.route_stops)) {
        bus.route_stops.forEach((stop) => {
          if (stop) {
            values.add(stop);
          }
        });
      }

      if (bus.source) values.add(bus.source);
      if (bus.destination) values.add(bus.destination);
      if (bus.current_stop) values.add(bus.current_stop);
      if (bus.next_stop) values.add(bus.next_stop);
    });

    return [...values].sort();
  }, [buses]);

  const sourceMatches = useMemo(
    () => getStopMatches(sourceQuery, stops),
    [sourceQuery, stops]
  );

  const destinationMatches = useMemo(
    () => getStopMatches(destinationQuery, stops),
    [destinationQuery, stops]
  );

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

  function handleSourceInput(value) {
    setSourceQuery(value);
    setSource("");
    setSourceError(false);
    setActiveStopField("source");
  }

  function handleDestinationInput(value) {
    setDestinationQuery(value);
    setDestination("");
    setDestinationError(false);
    setActiveStopField("destination");
  }

  function selectSourceStop(value) {
    setSource(value);
    setSourceQuery(value);
    setSourceError(false);
    setActiveStopField(null);
  }

  function selectDestinationStop(value) {
    setDestination(value);
    setDestinationQuery(value);
    setDestinationError(false);
    setActiveStopField(null);
  }

  function handleStopKeyDown(event, field) {
    if (event.key === "Escape") {
      setActiveStopField(null);
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    const matches =
      field === "source"
        ? sourceMatches
        : destinationMatches;

    if (!matches.length) {
      return;
    }

    event.preventDefault();

    if (field === "source") {
      selectSourceStop(matches[0]);
    } else {
      selectDestinationStop(matches[0]);
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
    if (source && !stops.includes(source)) {
      setSource("");
    }

    if (destination && !stops.includes(destination)) {
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

              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >
                <input
                  type="text"
                  value={sourceQuery}
                  onChange={(event) =>
                    handleSourceInput(
                      event.target.value
                    )
                  }
                  onFocus={() =>
                    setActiveStopField(
                      "source"
                    )
                  }
                  onBlur={() =>
                    setTimeout(() => {
                      setActiveStopField(null);
                    }, 150)
                  }
                  onKeyDown={(event) =>
                    handleStopKeyDown(
                      event,
                      "source"
                    )
                  }
                  placeholder="Choose starting point"
                  autoComplete="off"
                  aria-label="Choose starting point"
                  aria-invalid={sourceError}
                  style={{
                    width: "100%",
                    height: "42px",
                    boxSizing: "border-box",
                    border: sourceError
                      ? "2px solid #d91e36"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    background: "#ffffff",
                    color: "var(--text)",
                    padding: "0 12px",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    outline: "none",
                    boxShadow: sourceError
                      ? "0 0 0 3px rgba(217, 30, 54, 0.10)"
                      : "none",
                  }}
                />

                {activeStopField === "source" &&
                  sourceQuery.trim() && (
                    <div
                      role="listbox"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 5px)",
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        maxHeight: "240px",
                        overflowY: "auto",
                        background: "#ffffff",
                        border: "1px solid #d8e1ec",
                        borderRadius: "8px",
                        boxShadow:
                          "0 10px 24px rgba(24, 55, 93, 0.16)",
                        padding: "4px",
                      }}
                    >
                      {sourceMatches.length ? (
                        sourceMatches.map((stop) => (
                          <button
                            key={stop}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              selectSourceStop(stop);
                            }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "9px 10px",
                              border: "none",
                              borderRadius: "6px",
                              background: "transparent",
                              color: "#173b6b",
                              textAlign: "left",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            {stop}
                          </button>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: "9px 10px",
                            color: "#7a8798",
                            fontSize: "12px",
                          }}
                        >
                          No matching stops
                        </div>
                      )}
                    </div>
                  )}
              </div>

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

              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(event) =>
                    handleDestinationInput(
                      event.target.value
                    )
                  }
                  onFocus={() =>
                    setActiveStopField(
                      "destination"
                    )
                  }
                  onBlur={() =>
                    setTimeout(() => {
                      setActiveStopField(null);
                    }, 150)
                  }
                  onKeyDown={(event) =>
                    handleStopKeyDown(
                      event,
                      "destination"
                    )
                  }
                  placeholder="Choose destination"
                  autoComplete="off"
                  aria-label="Choose destination"
                  aria-invalid={destinationError}
                  style={{
                    width: "100%",
                    height: "42px",
                    boxSizing: "border-box",
                    border: destinationError
                      ? "2px solid #d91e36"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    background: "#ffffff",
                    color: "var(--text)",
                    padding: "0 12px",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    outline: "none",
                    boxShadow: destinationError
                      ? "0 0 0 3px rgba(217, 30, 54, 0.10)"
                      : "none",
                  }}
                />

                {activeStopField === "destination" &&
                  destinationQuery.trim() && (
                    <div
                      role="listbox"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 5px)",
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        maxHeight: "240px",
                        overflowY: "auto",
                        background: "#ffffff",
                        border: "1px solid #d8e1ec",
                        borderRadius: "8px",
                        boxShadow:
                          "0 10px 24px rgba(24, 55, 93, 0.16)",
                        padding: "4px",
                      }}
                    >
                      {destinationMatches.length ? (
                        destinationMatches.map((stop) => (
                          <button
                            key={stop}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              selectDestinationStop(stop);
                            }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "9px 10px",
                              border: "none",
                              borderRadius: "6px",
                              background: "transparent",
                              color: "#173b6b",
                              textAlign: "left",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            {stop}
                          </button>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: "9px 10px",
                            color: "#7a8798",
                            fontSize: "12px",
                          }}
                        >
                          No matching stops
                        </div>
                      )}
                    </div>
                  )}
              </div>

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

  <strong
    className={
      loading
        ? "network-status connecting"
        : error
        ? "network-status offline"
        : "network-status online"
    }
  >
    <span className="live-dot" />
    {loading
      ? "CONNECTING"
      : error
      ? "OFFLINE"
      : "ONLINE"}
  </strong>

  <small>
    {loading
      ? "Connecting to live fleet feed"
      : error
      ? "Live network unavailable"
      : lastUpdated
      ? `Updated ${lastUpdated.toLocaleTimeString()}`
      : "Live data available"}
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
                          {bus.bus_name || bus.bus_number}
                        </div>

                        <div className="bus-type">
                          {bus.bus_number} / {bus.bus_type}
                        </div>
                      </div>

                      <div className="bus-card-actions">
                        <span
                          className={getCrowdClass(
                            bus.crowd_level
                          )}
                        >
                          {bus.crowd_level}
                        </span>

                        <button
                          type="button"
                          className={`wishlist-heart-button ${
                            isWishlisted(bus)
                              ? "is-liked"
                              : ""
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleWishlist(bus);
                          }}
                          aria-label={
                            isWishlisted(bus)
                              ? `Remove ${
                                  bus.bus_name ||
                                  bus.bus_number
                                } from My Buses`
                              : `Add ${
                                  bus.bus_name ||
                                  bus.bus_number
                                } to My Buses`
                          }
                          title={
                            isWishlisted(bus)
                              ? "Remove from My Buses"
                              : "Add to My Buses"
                          }
                        >
                          <Heart
                            size={15}
                            fill={
                              isWishlisted(bus)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>

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