import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export default function Search() {
  const { buses, loading, error } = useLiveBuses();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSource = searchParams.get("from") || "";
  const urlDestination = searchParams.get("to") || "";

  const [source, setSource] = useState(urlSource);
  const [destination, setDestination] =
    useState(urlDestination);

  const [sourceError, setSourceError] = useState(false);
  const [destinationError, setDestinationError] =
    useState(false);

  const [submittedSource, setSubmittedSource] =
    useState(urlSource);

  const [submittedDestination, setSubmittedDestination] =
    useState(urlDestination);

  const [searched, setSearched] = useState(
    Boolean(urlSource || urlDestination)
  );

  useEffect(() => {
    setSource(urlSource);
    setDestination(urlDestination);

    setSubmittedSource(urlSource);
    setSubmittedDestination(urlDestination);

    setSourceError(false);
    setDestinationError(false);

    setSearched(Boolean(urlSource || urlDestination));
  }, [urlSource, urlDestination]);

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

  const results = useMemo(() => {
    if (!searched) {
      return [];
    }

    const from = normalize(submittedSource);
    const to = normalize(submittedDestination);

    return buses.filter((bus) => {
      const busSource = normalize(bus.source);
      const busDestination = normalize(bus.destination);
      const currentStop = normalize(bus.current_stop);
      const nextStop = normalize(bus.next_stop);

      const sourceMatch =
        !from ||
        busSource === from ||
        currentStop === from;

      const destinationMatch =
        !to ||
        busDestination === to ||
        nextStop === to;

      return sourceMatch && destinationMatch;
    });
  }, [
    buses,
    searched,
    submittedSource,
    submittedDestination,
  ]);

  function handleSearch(event) {
    event.preventDefault();

    const missingSource = !source;
    const missingDestination = !destination;

    setSourceError(missingSource);
    setDestinationError(missingDestination);

    if (missingSource || missingDestination) {
      return;
    }

    setSubmittedSource(source);
    setSubmittedDestination(destination);
    setSearched(true);

    const params = new URLSearchParams();

    params.set("from", source);
    params.set("to", destination);

    setSearchParams(params);
  }

  function clearSearch() {
    setSource("");
    setDestination("");

    setSourceError(false);
    setDestinationError(false);

    setSubmittedSource("");
    setSubmittedDestination("");

    setSearched(false);

    setSearchParams({});
  }

  return (
    <main className="home-page">
      <section
        className="hero-card"
        style={{
          marginBottom: "24px",
          color: "#ffffff",
        }}
      >
        <div className="hero-eyebrow">
          SMART JOURNEY SEARCH
        </div>

        <h1
          style={{
            marginTop: "10px",
            color: "#ffffff",
            fontSize: "clamp(32px, 5vw, 48px)",
          }}
        >
          Find your bus
        </h1>

        <p
          style={{
            marginTop: "12px",
            maxWidth: "720px",
            color: "rgba(255,255,255,0.86)",
          }}
        >
          Select your journey and click Find buses to see
          matching live services in the correct travel direction.
        </p>

        <form
          onSubmit={handleSearch}
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(0, 1fr) auto auto",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          {/* FROM */}
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
                padding: "14px 15px",
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

          {/* TO */}
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
                padding: "14px 15px",
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

          {/* FIND */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
            }}
          >
            <button
              type="submit"
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "14px 20px",
                background: "var(--payani-yellow)",
                color: "var(--payani-blue-dark)",
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Find buses
            </button>
          </div>

          {/* CLEAR */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
            }}
          >
            <button
              type="button"
              onClick={clearSearch}
              style={{
                border:
                  "1px solid rgba(255,255,255,0.35)",
                borderRadius: "12px",
                padding: "14px 18px",
                background:
                  "rgba(255,255,255,0.10)",
                color: "#ffffff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </form>

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
            search.
          </div>
        )}
      </section>

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
              {searched
                ? "Search results"
                : "Journey search"}
            </p>

            <h2
              style={{
                marginTop: "5px",
                fontSize: "28px",
              }}
            >
              {searched
                ? `${results.length} bus${
                    results.length === 1
                      ? ""
                      : "es"
                  } found`
                : "Select a route to begin"}
            </h2>
          </div>

          <div className="live-status">
            <span className="live-dot" />
            LIVE DATA
          </div>
        </div>

        {searched && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            {submittedSource && (
              <span className="crowd-low">
                From: {submittedSource}
              </span>
            )}

            {submittedDestination && (
              <span className="crowd-low">
                To: {submittedDestination}
              </span>
            )}
          </div>
        )}

        {loading && (
          <section className="loading-state">
            <strong>Finding live buses...</strong>

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
          <section
            className="error-state"
            role="alert"
          >
            <strong>
              Live network unavailable
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

        {!loading &&
          !error &&
          !searched && (
            <section className="empty-state">
              <strong>
                Ready to find your bus
              </strong>

              <p
                style={{
                  marginTop: "8px",
                  color: "var(--text-soft)",
                }}
              >
                Choose your starting point and
                destination, then click Find buses.
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          searched &&
          results.length === 0 && (
            <section className="empty-state">
              <strong>
                No buses in this direction
              </strong>

              <p
                style={{
                  marginTop: "8px",
                  color: "var(--text-soft)",
                }}
              >
                There are currently no live buses
                travelling from{" "}
                {submittedSource ||
                  "the selected origin"}{" "}
                to{" "}
                {submittedDestination ||
                  "the selected destination"}.
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          searched &&
          results.length > 0 && (
            <div className="bus-grid">
              {results.map((bus) => {
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
                      {bus.current_stop} →{" "}
                      {bus.next_stop}
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
          )}
      </section>
    </main>
  );
}