import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  LocateFixed,
  MapPinned,
  RotateCcw,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useLiveBuses } from "../hooks/useLiveBuses";

/* ============================================================
   CROWD COLOR
   ============================================================ */

function crowdColor(level) {
  switch (level) {
    case "Critical":
      return "#d91e36";

    case "High":
      return "#f08a00";

    case "Medium":
      return "#e0ac16";

    default:
      return "#18a66a";
  }
}

/* ============================================================
   BUS NUMBER
   ============================================================ */

function getShortBusNumber(value) {
  const busNumber = String(value || "").trim();

  if (!busNumber) {
    return "----";
  }

  return busNumber.slice(-4);
}

/* ============================================================
   BUS MARKER
   ============================================================ */

function makeBusNameIcon(bus, selected = false) {
  const color = crowdColor(bus.crowd_level);

  const busName =
    bus.bus_name ||
    bus.bus_number ||
    "Bus";

  return L.divIcon({
    className: "payani-bus-number-marker",

    html: `
      <div
        class="payani-bus-number-marker__label"
        style="
          --marker-color:${color};
          ${
            selected
              ? `
                transform: scale(1.12);
                box-shadow:
                  0 0 0 4px rgba(255,255,255,0.95),
                  0 0 0 7px ${color}55,
                  0 8px 18px rgba(15,35,70,.25);
              `
              : ""
          }
        "
      >
        ${busName}
      </div>
    `,

    iconSize: [60, 46],
    iconAnchor: [30, 23],
    popupAnchor: [0, -25],
  });
}

/* ============================================================
   RECENTER
   ============================================================ */

function Recenter({ position }) {
  const map = useMap();

  function recenterMap() {
    map.setView(position, 13);
  }

  return (
    <button
      type="button"
      className="map-recenter"
      onClick={recenterMap}
      title="Recenter map"
      aria-label="Recenter map"
    >
      <LocateFixed size={15} />
    </button>
  );
}

/* ============================================================
   ROUTE VISUALIZATION
   ============================================================ */

function RouteProgress({ bus }) {
  if (!bus) {
    return null;
  }

  const stops = [
    bus.source,
    bus.current_stop,
    bus.next_stop,
    bus.destination,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index
    );

  if (!stops.length) {
    return null;
  }

  const currentStop =
    bus.current_stop ||
    bus.source ||
    stops[0];

  const currentIndex = Math.max(
    0,
    stops.findIndex(
      (stop) =>
        stop.toLowerCase() ===
        String(currentStop).toLowerCase()
    )
  );

  return (
    <div className="map-route-progress">
      <div className="map-route-progress__header">
        <span>ROUTE PROGRESS</span>
        <strong>
          {bus.route_name || "Live route"}
        </strong>
      </div>

      <div className="map-route-progress__line">
        {stops.map((stop, index) => {
          const isCurrent =
            index === currentIndex;

          const isPassed =
            index < currentIndex;

          const isNext =
            index === currentIndex + 1;

          return (
            <div
              className="map-route-stop"
              key={`${stop}-${index}`}
            >
              <div className="map-route-stop__rail">
                <span
                  className={`map-route-stop__dot ${
                    isCurrent
                      ? "current"
                      : isPassed
                        ? "passed"
                        : isNext
                          ? "next"
                          : ""
                  }`}
                />

                {index < stops.length - 1 && (
                  <span
                    className={`map-route-stop__connector ${
                      isPassed
                        ? "passed"
                        : ""
                    }`}
                  />
                )}
              </div>

              <div className="map-route-stop__label">
                <strong>
                  {stop}
                </strong>

                {isCurrent && (
                  <span>Current</span>
                )}

                {isNext && (
                  <span>Next</span>
                )}

                {index === 0 &&
                  !isCurrent && (
                    <span>Source</span>
                  )}

                {index ===
                  stops.length - 1 &&
                  !isCurrent &&
                  !isNext && (
                    <span>Destination</span>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   LIVE MAP
   ============================================================ */

export default function LiveMap() {
  const navigate = useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const {
    buses,
    loading,
    error,
    refresh,
  } = useLiveBuses();

  const [
    routeFilter,
    setRouteFilter,
  ] = useState(
    searchParams.get("route") ||
      "All routes"
  );

  const [
    crowdFilter,
    setCrowdFilter,
  ] = useState(
    searchParams.get("crowd") ||
      "All levels"
  );

  const [
    selected,
    setSelected,
  ] = useState(
    searchParams.get("selected") ||
      null
  );

  /* ==========================================================
     ROUTE OPTIONS
     ========================================================== */

  const routeOptions = useMemo(
    () => {
      const routes = buses
        .map(
          (bus) =>
            bus.route_code ||
            bus.route_name
        )
        .filter(Boolean);

      return [
        "All routes",
        ...new Set(routes),
      ];
    },
    [buses]
  );

  /* ==========================================================
     FILTER
     ========================================================== */

  const filtered = useMemo(
    () =>
      buses.filter((bus) => {
        const routeValue =
          bus.route_code ||
          bus.route_name;

        const routeMatch =
          routeFilter ===
            "All routes" ||
          routeValue === routeFilter;

        const crowdMatch =
          crowdFilter ===
            "All levels" ||
          bus.crowd_level ===
            crowdFilter;

        return (
          routeMatch &&
          crowdMatch
        );
      }),
    [
      buses,
      routeFilter,
      crowdFilter,
    ]
  );

  /* ==========================================================
     GPS BUSES
     ========================================================== */

  const withGps = useMemo(
    () =>
      filtered.filter(
        (bus) => {
          const latitude =
            Number(bus.latitude);

          const longitude =
            Number(bus.longitude);

          return (
            Number.isFinite(
              latitude
            ) &&
            Number.isFinite(
              longitude
            )
          );
        }
      ),
    [filtered]
  );

  /* ==========================================================
     CENTER
     ========================================================== */

  const center = withGps.length
    ? [
        Number(
          withGps[0].latitude
        ),
        Number(
          withGps[0].longitude
        ),
      ]
    : [
        11.3410,
        77.7172,
      ];

  /* ==========================================================
     SELECTED BUS
     ========================================================== */

  const selectedBus = useMemo(
    () =>
      filtered.find(
        (bus) =>
          bus.trip_id ===
          selected
      ) || null,
    [filtered, selected]
  );

  /* ==========================================================
     RESET
     ========================================================== */

  function resetFilters() {
    setRouteFilter(
      "All routes"
    );

    setCrowdFilter(
      "All levels"
    );

    setSelected(null);

    navigate("/live-map");
  }

  /* ==========================================================
     DETAILS
     ========================================================== */

  function openBusDetails(bus) {
    if (!bus?.trip_id) {
      return;
    }

    const returnParams =
      new URLSearchParams();

    returnParams.set(
      "returnTo",
      "live-map"
    );

    if (routeFilter !== "All routes") {
      returnParams.set(
        "route",
        routeFilter
      );
    }

    if (crowdFilter !== "All levels") {
      returnParams.set(
        "crowd",
        crowdFilter
      );
    }

    const busKey =
      bus.trip_id ||
      bus.bus_id;

    if (busKey) {
      returnParams.set(
        "selected",
        busKey
      );
    }

    navigate(
      `/bus/${bus.trip_id}?${returnParams.toString()}`
    );
  }

  /* ==========================================================
     SELECT BUS
     ========================================================== */

  function selectBus(bus) {
    setSelected(
      bus.trip_id ||
        bus.bus_id ||
        null
    );
  }

  return (
    <main className="page-shell map-page">
      {/* ======================================================
          PAGE INTRO
         ====================================================== */}

      <section className="page-intro">
        <div className="eyebrow">
          LIVE NETWORK
        </div>

        <h1>
          Live bus map.
        </h1>

        <p>
          Track the operating fleet
          and see crowd conditions
          at a glance.
        </p>
      </section>

      {/* ======================================================
          MAP SHELL
         ====================================================== */}

      <section className="map-shell">
        {/* ====================================================
            SIDEBAR
           ==================================================== */}

        <aside className="map-sidebar">
          <div className="sidebar-title">
            <div>
              <div className="section-kicker">
                FILTERS
              </div>

              <h3>
                Fleet view
              </h3>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={
                resetFilters
              }
              title="Reset filters"
              aria-label="Reset filters"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* ROUTE FILTER */}

          <label className="filter-field">
            <span>
              Route
            </span>

            <select
              value={
                routeFilter
              }
              onChange={(event) =>
                setRouteFilter(
                  event.target.value
                )
              }
            >
              {routeOptions.map(
                (route) => (
                  <option
                    key={route}
                    value={route}
                  >
                    {route}
                  </option>
                )
              )}
            </select>
          </label>

          {/* CROWD FILTER */}

          <label className="filter-field">
            <span>
              Crowd level
            </span>

            <select
              value={
                crowdFilter
              }
              onChange={(event) =>
                setCrowdFilter(
                  event.target.value
                )
              }
            >
              <option>
                All levels
              </option>

              <option>
                Low
              </option>

              <option>
                Medium
              </option>

              <option>
                High
              </option>

              <option>
                Critical
              </option>
            </select>
          </label>

          {/* LIVE COUNT */}

          <div className="map-list-title">
            Live buses (
            {filtered.length}
            )
          </div>

          {/* BUS LIST */}

          <div className="map-bus-list">
            {filtered.map(
              (bus) => {
                const isSelected =
                  selected ===
                  (
                    bus.trip_id ||
                    bus.bus_id
                  );

                return (
                  <button
                    key={
                      bus.trip_id ||
                      bus.bus_id
                    }
                    type="button"
                    className={`map-list-item ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectBus(bus)
                    }
                  >
                    <span
                      className="map-list-dot"
                      style={{
                        background:
                          crowdColor(
                            bus.crowd_level
                          ),
                      }}
                    />

                    <span>
                      <strong>
                        {bus.bus_name ||
                          bus.bus_number}
                      </strong>

                      <small>
                        Vehicle:{" "}
                        {bus.bus_number}
                      </small>

                      <small>
                        {bus.route_name}
                      </small>

                      <small>
                        {Number(
                          bus.occupancy_percent ||
                            0
                        ).toFixed(1)}
                        % · ETA{" "}
                        {bus.eta_minutes ==
                        null
                          ? "—"
                          : `${Number(
                              bus.eta_minutes
                            ).toFixed(1)}m`}
                      </small>
                    </span>
                  </button>
                );
              }
            )}

            {!filtered.length && (
              <div className="empty-mini">
                No buses match these
                filters.
              </div>
            )}
          </div>

          {/* SELECTED BUS ROUTE */}

          {selectedBus && (
            <>
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop:
                    "1px solid var(--border)",
                }}
              >
                <div className="section-kicker">
                  SELECTED BUS
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "10px",
                    alignItems:
                      "center",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "var(--payani-blue-dark)",
                      fontSize:
                        "15px",
                    }}
                  >
                    {selectedBus.bus_name ||
                      selectedBus.bus_number}
                  </strong>

                  <span
                    className={`
                      ${selectedBus.crowd_level === "Critical"
                        ? "crowd-critical"
                        : selectedBus.crowd_level === "High"
                          ? "crowd-high"
                          : selectedBus.crowd_level === "Medium"
                            ? "crowd-medium"
                            : "crowd-low"}
                    `}
                  >
                    {selectedBus.crowd_level ||
                      "Low"}
                  </span>
                </div>
              </div>

              <RouteProgress
                bus={
                  selectedBus
                }
              />

              <button
                type="button"
                className="row-action"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  justifyContent:
                    "center",
                }}
                onClick={() =>
                  openBusDetails(
                    selectedBus
                  )
                }
              >
                View full details
              </button>
            </>
          )}
        </aside>

        {/* ====================================================
            MAP
           ==================================================== */}

        <div className="map-canvas">
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            className="leaflet-map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* BUS MARKERS */}

            {withGps.map(
              (bus) => {
                const busKey =
                  bus.trip_id ||
                  bus.bus_id;

                const isSelected =
                  selected ===
                  busKey;

                return (
                  <Marker
                    key={busKey}
                    position={[
                      Number(
                        bus.latitude
                      ),
                      Number(
                        bus.longitude
                      ),
                    ]}
                    icon={makeBusNameIcon(
                      bus,
                      isSelected
                    )}
                    eventHandlers={{
                      click: () =>
                        selectBus(bus),
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <div className="map-popup-number">
                          {bus.bus_name ||
                            bus.bus_number}
                        </div>

                        <strong>
                          {bus.bus_name ||
                            bus.bus_number}
                        </strong>

                        <span>
                          Vehicle:{" "}
                          {bus.bus_number}
                        </span>

                        <span>
                          {bus.route_name}
                        </span>

                        <div className="map-popup-details">
                          <div>
                            <span>
                              Current
                            </span>

                            <strong>
                              {bus.current_stop ||
                                "—"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Next
                            </span>

                            <strong>
                              {bus.next_stop ||
                                "—"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Occupancy
                            </span>

                            <strong>
                              {Number(
                                bus.occupancy_percent ||
                                  0
                              ).toFixed(1)}
                              %
                            </strong>
                          </div>

                          <div>
                            <span>
                              ETA
                            </span>

                            <strong>
                              {bus.eta_minutes ==
                              null
                                ? "—"
                                : `${Number(
                                    bus.eta_minutes
                                  ).toFixed(1)} min`}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Seats
                            </span>

                            <strong>
                              {bus.available_seats ??
                                "—"}
                            </strong>
                          </div>

                          <div>
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

                        {/* ROUTE PROGRESS */}

                        <RouteProgress
                          bus={bus}
                        />

                        <button
                          type="button"
                          className="map-details-button"
                          onClick={() =>
                            openBusDetails(
                              bus
                            )
                          }
                        >
                          View full details
                          <ArrowRightIcon />
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
            )}

            <Recenter
              position={center}
            />
          </MapContainer>

          {/* LEGEND */}

          <div className="map-legend">
            <span>
              <i
                style={{
                  background:
                    "#18a66a",
                }}
              />
              Low
            </span>

            <span>
              <i
                style={{
                  background:
                    "#e0ac16",
                }}
              />
              Medium
            </span>

            <span>
              <i
                style={{
                  background:
                    "#f08a00",
                }}
              />
              High
            </span>

            <span>
              <i
                style={{
                  background:
                    "#d91e36",
                }}
              />
              Critical
            </span>
          </div>

          {/* REFRESH */}

          <button
            type="button"
            className="map-refresh"
            onClick={refresh}
          >
            <MapPinned size={15} />
            Refresh live positions
          </button>
        </div>
      </section>

      {/* STATES */}

      {loading && (
        <section className="state-card">
          Loading live map data…
        </section>
      )}

      {error && (
        <section className="state-card state-error">
          {error}
        </section>
      )}
    </main>
  );
}

/* ============================================================
   INLINE ARROW ICON
   ============================================================ */

function ArrowRightIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}