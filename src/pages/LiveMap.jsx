import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useLiveBuses } from "../hooks/useLiveBuses";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [11.25, 77.48];

const busIcon = new L.DivIcon({
  className: "payani-bus-marker",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #0b4ea2;
      border: 3px solid #ffffff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
    ">P</div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

function MapBounds({ buses }) {
  const map = useMap();

  useEffect(() => {
    const validBuses = buses.filter(
      (bus) =>
        Number.isFinite(Number(bus.latitude)) &&
        Number.isFinite(Number(bus.longitude))
    );

    if (validBuses.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      validBuses.map((bus) => [
        Number(bus.latitude),
        Number(bus.longitude),
      ])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 12,
    });
  }, [buses, map]);

  return null;
}

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

export default function LiveMap() {
  const { buses, loading, error } = useLiveBuses();

  return (
    <main className="home-page">
      <section className="hero-stat-card">
        <div className="stat-label">LIVE FLEET MAP</div>

        <h1
          style={{
            marginTop: "10px",
            fontSize: "clamp(32px, 5vw, 48px)",
          }}
        >
          Track buses in real time
        </h1>

        <p
          style={{
            marginTop: "12px",
            color: "var(--text-soft)",
          }}
        >
          Bus positions below come directly from the current live
          transport feed.
        </p>
      </section>

      {loading && (
        <section
          className="loading-state"
          style={{ marginTop: "24px" }}
        >
          <strong>Loading live map...</strong>
        </section>
      )}

      {error && (
        <section
          className="error-state"
          style={{ marginTop: "24px" }}
          role="alert"
        >
          <strong>Live map unavailable</strong>
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

      {!loading && !error && (
        <section
          style={{
            marginTop: "24px",
            overflow: "hidden",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={10}
            scrollWheelZoom={true}
            style={{
              width: "100%",
              height: "620px",
            }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBounds buses={buses} />

            {buses.map((bus) => {
              const latitude = Number(bus.latitude);
              const longitude = Number(bus.longitude);

              if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
              ) {
                return null;
              }

              return (
                <Marker
                  key={bus.trip_id}
                  position={[latitude, longitude]}
                  icon={busIcon}
                >
                  <Popup>
                    <div
                      style={{
                        minWidth: "210px",
                        fontFamily:
                          'Inter, "Segoe UI", sans-serif',
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#07366f",
                          fontSize: "16px",
                        }}
                      >
                        {bus.bus_number}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "4px",
                          color: "#667085",
                        }}
                      >
                        {bus.route_name}
                      </span>

                      <div
                        style={{
                          marginTop: "12px",
                          lineHeight: "1.7",
                        }}
                      >
                        <div>
                          <strong>Position:</strong>{" "}
                          {latitude.toFixed(6)},{" "}
                          {longitude.toFixed(6)}
                        </div>

                        <div>
                          <strong>Stop:</strong>{" "}
                          {bus.current_stop}
                        </div>

                        <div>
                          <strong>Next:</strong>{" "}
                          {bus.next_stop}
                        </div>

                        <div>
                          <strong>Speed:</strong>{" "}
                          {bus.speed_kmh} km/h
                        </div>

                        <div>
                          <strong>ETA:</strong>{" "}
                          {bus.eta_minutes == null
                            ? "N/A"
                            : `${Number(
                                bus.eta_minutes
                              ).toFixed(1)} min`}
                        </div>

                        <div>
                          <strong>Passengers:</strong>{" "}
                          {bus.current_passengers} /{" "}
                          {bus.capacity}
                        </div>

                        <div>
                          <strong>Occupancy:</strong>{" "}
                          {Number(
                            bus.occupancy_percent || 0
                          ).toFixed(1)}
                          %
                        </div>

                        <div style={{ marginTop: "6px" }}>
                          <span
                            className={getCrowdClass(
                              bus.crowd_level
                            )}
                          >
                            {bus.crowd_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </section>
      )}
    </main>
  );
}