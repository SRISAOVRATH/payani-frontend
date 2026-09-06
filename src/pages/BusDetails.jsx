import { useMemo } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Users,
  Scan,
  Gauge,
  Brain,
  ShieldCheck,
  MapPin,
  Route as RouteIcon,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLiveBuses } from "../hooks/useLiveBuses";

function crowdClass(level) {
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

function formatEta(value) {
  if (value == null) return "—";
  return `${Number(value).toFixed(1)} min`;
}

function shortBusNumber(value) {
  return String(value || "").slice(-4);
}

function detailMarker(bus) {
  const color =
    bus.crowd_level === "Critical"
      ? "#d91e36"
      : bus.crowd_level === "High"
      ? "#f08a00"
      : bus.crowd_level === "Medium"
      ? "#e0ac16"
      : "#18a66a";

  return L.divIcon({
    className: "detail-bus-marker",
    html: `
      <div
        class="detail-bus-marker-label"
        style="--marker-color:${color}"
      >
        ${shortBusNumber(bus.bus_number)}
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
}

function getConfidenceLabel(score) {
  const value = Number(score || 0);

  if (value >= 0.8) return "High";
  if (value >= 0.6) return "Medium";
  if (value >= 0.4) return "Low";

  return "Very Low";
}

export default function BusDetails() {
  const { tripId } = useParams();

  const {
    buses,
    loading,
    error,
  } = useLiveBuses();

  const bus = useMemo(
    () =>
      buses.find(
        (item) =>
          String(item.trip_id) ===
          String(tripId)
      ),
    [buses, tripId]
  );

  if (loading) {
    return (
      <main className="page-shell bus-details-page">
        <section className="state-card">
          Loading live bus details…
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell bus-details-page">
        <section className="state-card state-error">
          <strong>
            Unable to load bus details
          </strong>
          <span>{error}</span>
        </section>
      </main>
    );
  }

  if (!bus) {
    return (
      <main className="page-shell bus-details-page">
        <section className="state-card state-error">
          <strong>
            Bus details unavailable
          </strong>
          <span>
            The selected bus is no longer in
            the live feed.
          </span>

          <NavLink
            to="/"
            className="ghost-button"
            style={{
              width: "fit-content",
              margin: "12px auto 0",
            }}
          >
            Back to Home
          </NavLink>
        </section>
      </main>
    );
  }

  const latitude = Number(bus.latitude);
  const longitude = Number(bus.longitude);

  const hasGps =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const occupancy = Number(
    bus.occupancy_percent || 0
  );

  const predictedOccupancy =
    bus.predicted_occupancy_percent == null
      ? null
      : Number(
          bus.predicted_occupancy_percent
        );

  const capacity = Number(
    bus.capacity || 0
  );

  const currentPassengers = Number(
    bus.current_passengers || 0
  );

  const predictedPassengers =
    bus.predicted_passengers == null
      ? null
      : Number(bus.predicted_passengers);

  const predictionChange =
    predictedPassengers == null
      ? null
      : predictedPassengers -
        currentPassengers;

  const confidence = Number(
    bus.confidence_score || 0
  );

  const confidenceLabel =
    getConfidenceLabel(confidence);

  const mapCenter = hasGps
    ? [latitude, longitude]
    : [11.3410, 77.7172];

  return (
    <main className="page-shell bus-details-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="details-topbar">

        <NavLink
          to="/"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back
        </NavLink>

        <div className="details-live-pill">
          <span className="live-dot" />
          Live
        </div>
      </div>

      <header className="bus-details-header">

        <div className="bus-details-heading">

          <div className="bus-details-icon">
            <RouteIcon size={24} />
          </div>

          <div>
            <h1>
              Bus {bus.bus_number}
            </h1>

            <p>
              {bus.route_name}
              {" · "}
              {bus.bus_type}
            </p>
          </div>
        </div>

        <div
          className={`details-crowd-pill ${crowdClass(
            bus.crowd_level
          )}`}
        >
          {bus.crowd_level}
        </div>
      </header>

      {/* =====================================================
          TOP CONTENT
          ===================================================== */}

      <section className="details-main-grid">

        {/* MAP */}
        <div className="details-map-card">

          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="details-leaflet-map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {hasGps && (
              <Marker
                position={[
                  latitude,
                  longitude,
                ]}
                icon={detailMarker(bus)}
              >
                <Popup>
                  <strong>
                    {bus.bus_number}
                  </strong>
                  <br />
                  {bus.route_name}
                  <br />
                  {occupancy.toFixed(1)}%
                  occupied
                  <br />
                  ETA{" "}
                  {formatEta(
                    bus.eta_minutes
                  )}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* JOURNEY DETAILS */}
        <aside className="journey-details-card">

          <h2>
            Journey Details
          </h2>

          <div className="detail-row">
            <span>Bus Type</span>
            <strong>
              {bus.bus_type || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Route Code</span>
            <strong>
              {bus.route_code || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Route</span>
            <strong>
              {bus.route_name || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Source</span>
            <strong>
              {bus.source || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Destination</span>
            <strong>
              {bus.destination || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Trip Status</span>
            <strong>
              {bus.trip_status || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Current Stop</span>
            <strong>
              {bus.current_stop || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Next Stop</span>
            <strong>
              {bus.next_stop || "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>GPS Location</span>
            <strong>
              {hasGps
                ? `${latitude.toFixed(
                    4
                  )}, ${longitude.toFixed(
                    4
                  )}`
                : "—"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Speed</span>
            <strong>
              {bus.speed_kmh == null
                ? "—"
                : `${Number(
                    bus.speed_kmh
                  ).toFixed(1)} km/h`}
            </strong>
          </div>

          <div className="detail-row">
            <span>ETA</span>
            <strong>
              {formatEta(
                bus.eta_minutes
              )}
            </strong>
          </div>

          <div className="detail-row">
            <span>Distance to Next Stop</span>
            <strong>
              {bus.distance_to_next_stop_km ==
              null
                ? "—"
                : `${Number(
                    bus.distance_to_next_stop_km
                  ).toFixed(2)} km`}
            </strong>
          </div>

          <div className="detail-row">
            <span>Current Passengers</span>
            <strong>
              {currentPassengers}
            </strong>
          </div>

        </aside>
      </section>

      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <section className="details-kpi-grid">

        <div className="details-kpi-card">
          <div className="details-kpi-icon">
            <Clock3 size={24} />
          </div>

          <strong>
            {formatEta(
              bus.eta_minutes
            )}
          </strong>

          <span>
            ETA
          </span>
        </div>

        <div className="details-kpi-card">
          <div className="details-kpi-icon">
            <Users size={24} />
          </div>

          <strong>
            {bus.available_seats ?? "—"}
          </strong>

          <span>
            Available Seats
          </span>
        </div>

        <div className="details-kpi-card">
          <div className="details-kpi-icon">
            <Scan size={24} />
          </div>

          <strong>
            {capacity}
          </strong>

          <span>
            Max Capacity
          </span>
        </div>

        <div className="details-kpi-card">
          <div className="details-kpi-icon">
            <Gauge size={24} />
          </div>

          <strong>
            {bus.crowd_level ||
              "Low"}
          </strong>

          <span>
            Crowd Level
          </span>
        </div>

      </section>

      {/* =====================================================
          ANALYTICS GRID
          ===================================================== */}

      <section className="details-analytics-grid">

        {/* OCCUPANCY */}
        <div className="detail-panel occupancy-panel">

          <div className="panel-heading">
            <div>
              <div className="section-kicker">
                LIVE ANALYTICS
              </div>

              <h2>
                Occupancy Graph
              </h2>
            </div>

            <div
              className={`details-crowd-pill ${crowdClass(
                bus.crowd_level
              )}`}
            >
              {bus.crowd_level || "Low"} ·{" "}
              {occupancy.toFixed(0)}%
            </div>
          </div>

          <div className="occupancy-visual">

            <div className="occupancy-line">

              <span
                style={{
                  height: `${Math.max(
                    12,
                    Math.min(
                      occupancy,
                      100
                    )
                  )}%`,
                }}
              />

              <span
                style={{
                  height: `${Math.max(
                    12,
                    Math.min(
                      (occupancy +
                        (predictedOccupancy ??
                          occupancy)) /
                        2,
                      100
                    )
                  )}%`,
                }}
              />

              <span
                style={{
                  height: `${Math.max(
                    12,
                    Math.min(
                      predictedOccupancy ??
                        occupancy,
                      100
                    )
                  )}%`,
                }}
              />

            </div>

            <div className="occupancy-axis">
              <span>S2</span>
              <span>S3</span>
              <span>S4</span>
              <span>S5</span>
              <span>S6</span>
              <span>S7</span>
              <span>S8</span>
              <span>S9</span>
              <span>S10</span>
            </div>

          </div>

          <div className="occupancy-summary">

            <div>
              <span>
                Current Occupancy
              </span>

              <strong>
                {occupancy.toFixed(1)}%
              </strong>
            </div>

            <div>
              <span>
                Predicted (Next Stop)
              </span>

              <strong>
                {predictedOccupancy ==
                null
                  ? "—"
                  : `${predictedOccupancy.toFixed(
                      1
                    )}%`}
              </strong>
            </div>

          </div>
        </div>

        {/* PREDICTION */}
        <div className="detail-panel">

          <div className="panel-heading">
            <div>
              <div className="section-kicker">
                AOCE
              </div>

              <h2>
                Prediction
              </h2>
            </div>
          </div>

          <div className="prediction-list">

            <div>
              <span>
                Predicted Boardings
              </span>
              <strong>
                {bus.predicted_boardings ??
                  0} pax
              </strong>
            </div>

            <div>
              <span>
                Predicted Exits
              </span>
              <strong>
                {bus.predicted_exits ??
                  0} pax
              </strong>
            </div>

            <div>
              <span>
                Predicted Passengers
              </span>
              <strong>
                {predictedPassengers ??
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Predicted Occupancy
              </span>
              <strong>
                {predictedOccupancy ==
                null
                  ? "—"
                  : `${predictedOccupancy.toFixed(
                      1
                    )}%`}
              </strong>
            </div>

            <div>
              <span>
                Prediction Horizon
              </span>
              <strong>
                {bus.prediction_horizon_minutes ??
                  15}{" "}
                min
              </strong>
            </div>

            <div>
              <span>
                Confidence Score
              </span>
              <strong>
                {confidenceLabel}
              </strong>
            </div>

          </div>
        </div>

        {/* ADAPTIVE ENGINE */}
        <div className="detail-panel">

          <div className="panel-heading">
            <div>
              <div className="section-kicker">
                INTELLIGENCE
              </div>

              <h2>
                Adaptive Engine
              </h2>
            </div>

            <Brain
              size={22}
              color="#7c4dff"
            />
          </div>

          <div className="prediction-list">

            <div>
              <span>
                AOCE Model
              </span>

              <strong>
                {bus.aoce_model_version ||
                  "AOCE-V2"}
              </strong>
            </div>

            <div>
              <span>
                Model Confidence
              </span>

              <strong>
                {Math.round(
                  confidence * 100
                )}%
              </strong>
            </div>

            <div>
              <span>
                Passenger Change
              </span>

              <strong
                className={
                  predictionChange > 0
                    ? "delta-up"
                    : predictionChange < 0
                    ? "delta-down"
                    : "delta-flat"
                }
              >
                {predictionChange == null
                  ? "—"
                  : `${predictionChange > 0 ? "+" : ""}${predictionChange} pax`}
              </strong>
            </div>

          </div>

          <div className="engine-active">
            <Brain size={18} />
            AOCE engine active
          </div>
        </div>

        {/* CONFIDENCE */}
        <div className="detail-panel confidence-panel">

          <div className="confidence-icon">
            <ShieldCheck size={26} />
          </div>

          <div>
            <strong>
              Confidence:{" "}
              {confidenceLabel}
            </strong>

            <span>
              Prediction confidence{" "}
              {Math.round(
                confidence * 100
              )}
              %
            </span>
          </div>

        </div>

      </section>

      {/* =====================================================
          COMPLETE ROUTE
          ===================================================== */}

      <section className="detail-panel route-panel">

        <div className="panel-heading">
          <div>
            <div className="section-kicker">
              ROUTE
            </div>

            <h2>
              Complete Route — All Stops
            </h2>
          </div>
        </div>

        <div className="route-timeline">

          <div className="route-stop current">
            <span />
            <div>
              <strong>
                {bus.current_stop ||
                  bus.source ||
                  "Current Stop"}
              </strong>

              <small>
                Current
              </small>
            </div>
          </div>

          <div className="route-line" />

          <div className="route-stop next">
            <span />
            <div>
              <strong>
                {bus.next_stop ||
                  bus.destination ||
                  "Next Stop"}
              </strong>

              <small>
                Next
              </small>
            </div>
          </div>

          <div className="route-end">
            <strong>
              {bus.destination ||
                "Destination"}
            </strong>

            <small>
              Final destination
            </small>
          </div>

        </div>

      </section>

    </main>
  );
}