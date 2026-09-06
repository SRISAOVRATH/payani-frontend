import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
   SHORT BUS NUMBER
   TN 33 N 1001 -> 1001
   ============================================================ */

function getShortBusNumber(value) {
  const busNumber = String(
    value || ""
  ).trim();

  if (!busNumber) {
    return "----";
  }

  return busNumber.slice(-4);
}

/* ============================================================
   CIRCULAR BUS NUMBER MARKER
   ============================================================ */

function makeBusNumberIcon(bus) {
  const color = crowdColor(
    bus.crowd_level
  );

  const shortNumber =
    getShortBusNumber(
      bus.bus_number
    );

  return L.divIcon({
    className:
      "payani-bus-number-marker",

    html: `
      <div
        class="payani-bus-number-marker__label"
        style="
          --marker-color:${color};
        "
      >
        ${shortNumber}
      </div>
    `,

    iconSize: [46, 46],

    iconAnchor: [23, 23],

    popupAnchor: [0, -25],
  });
}

/* ============================================================
   RECENTER BUTTON
   ============================================================ */

function Recenter({ position }) {
  const map = useMap();

  function recenterMap() {
    map.setView(
      position,
      13
    );
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
   LIVE MAP PAGE
   ============================================================ */

export default function LiveMap() {
  const navigate =
    useNavigate();

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
    "All routes"
  );

  const [
    crowdFilter,
    setCrowdFilter,
  ] = useState(
    "All levels"
  );

  const [
    selected,
    setSelected,
  ] = useState(null);

  /* ==========================================================
     ROUTE OPTIONS
     ========================================================== */

  const routeOptions = useMemo(
    () => {
      const routes =
        buses
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
     FILTER BUSES
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
          routeValue ===
            routeFilter;

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
     VALID GPS BUSES
     ========================================================== */

  const withGps = useMemo(
    () =>
      filtered.filter(
        (bus) => {
          const latitude =
            Number(
              bus.latitude
            );

          const longitude =
            Number(
              bus.longitude
            );

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
     MAP CENTER
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
     RESET FILTERS
     ========================================================== */

  function resetFilters() {
    setRouteFilter(
      "All routes"
    );

    setCrowdFilter(
      "All levels"
    );

    setSelected(null);
  }

  /* ==========================================================
     OPEN FULL DETAILS PAGE
     ========================================================== */

  function openBusDetails(bus) {
    if (!bus?.trip_id) {
      return;
    }

    navigate(
      `/bus/${bus.trip_id}`
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

          {/* --------------------------------------------------
              ROUTE FILTER
             -------------------------------------------------- */}

          <label className="filter-field">

            <span>
              Route
            </span>

            <select
              value={routeFilter}
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

          {/* --------------------------------------------------
              CROWD FILTER
             -------------------------------------------------- */}

          <label className="filter-field">

            <span>
              Crowd level
            </span>

            <select
              value={crowdFilter}
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

          {/* --------------------------------------------------
              LIVE BUS COUNT
             -------------------------------------------------- */}

          <div className="map-list-title">
            Live buses (
            {filtered.length}
            )
          </div>

          {/* --------------------------------------------------
              LIVE BUS LIST
             -------------------------------------------------- */}

          <div className="map-bus-list">

            {filtered.map(
              (bus) => {
                const shortNumber =
                  getShortBusNumber(
                    bus.bus_number
                  );

                const isSelected =
                  selected ===
                  bus.trip_id;

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
                    onClick={() => {
                      setSelected(
                        bus.trip_id
                      );

                      openBusDetails(
                        bus
                      );
                    }}
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
                        {shortNumber}
                      </strong>

                      <small>
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

            {/* ------------------------------------------------
                BUS MARKERS
               ------------------------------------------------ */}

            {withGps.map(
              (bus) => (
                <Marker
                  key={
                    bus.trip_id ||
                    bus.bus_id
                  }
                  position={[
                    Number(
                      bus.latitude
                    ),
                    Number(
                      bus.longitude
                    ),
                  ]}
                  icon={makeBusNumberIcon(
                    bus
                  )}
                >

                  <Popup>

                    <div className="map-popup">

                      <div className="map-popup-number">
                        {getShortBusNumber(
                          bus.bus_number
                        )}
                      </div>

                      <strong>
                        {bus.bus_number}
                      </strong>

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
              )
            )}

            <Recenter
              position={center}
            />

          </MapContainer>

          {/* ==================================================
              LEGEND
             ================================================== */}

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

          {/* ==================================================
              REFRESH
             ================================================== */}

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

      {/* ======================================================
          STATES
         ====================================================== */}

      {loading && (
        <section className="state-card">
          Loading live map data…
        </section>
      )}

      {error && (
        <section
          className="state-card state-error"
        >
          {error}
        </section>
      )}

    </main>
  );
}

/* ============================================================
   SMALL INLINE ARROW ICON
   Avoids adding another import just for the popup button.
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