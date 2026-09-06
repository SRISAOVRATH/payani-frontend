import { ArrowRight, Wifi } from "lucide-react";

function crowdClass(level) {
  return {
    Critical: "crowd-critical",
    High: "crowd-high",
    Medium: "crowd-medium",
    Low: "crowd-low",
  }[level] || "crowd-low";
}

function formatEta(value) {
  return value == null ? "N/A" : `${Number(value).toFixed(1)} min`;
}

function confidence(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${(n <= 1 ? n * 100 : n).toFixed(0)}%` : "—";
}

export default function BusCard({ bus }) {
  const occupancy = Math.min(100, Math.max(0, Number(bus.occupancy_percent || 0)));
  const predicted = Number(bus.predicted_occupancy_percent);
  const predictedPassengers = Number(bus.predicted_passengers);
  const currentPassengers = Number(bus.current_passengers);
  const delta = Number.isFinite(predictedPassengers) && Number.isFinite(currentPassengers)
    ? predictedPassengers - currentPassengers
    : null;
  const status = bus.trip_status || bus.bus_status || "Unknown";
  const barClass = occupancy >= 85 ? "critical" : occupancy >= 70 ? "high" : occupancy >= 40 ? "medium" : "low";

  return (
    <article className="bus-card">
      <div className="bus-card-top">
        <div>
          <div className="bus-number">{bus.bus_number || "Bus"}</div>
          <div className="bus-type">{bus.bus_type || "Service"}</div>
        </div>
        <span className={crowdClass(bus.crowd_level)}>{bus.crowd_level || "Low"}</span>
      </div>

      <div className="bus-route-row">
        <div>
          <div className="route-name">{bus.route_name || `${bus.source || "Origin"} → ${bus.destination || "Destination"}`}</div>
          <div className="stop-line">{bus.current_stop || "Current stop"} <ArrowRight size={12} /> {bus.next_stop || "Next stop"}</div>
        </div>
        <div className="status-inline"><Wifi size={12} /> {status}</div>
      </div>

      <div className="occupancy-row">
        <div>
          <div className="occupancy-label">Occupancy</div>
          <div className="occupancy-value">{occupancy.toFixed(1)}%</div>
        </div>
        <div className="passenger-count">
          <span>Passengers</span>
          <strong>{bus.current_passengers ?? "—"} / {bus.capacity ?? "—"}</strong>
        </div>
      </div>

      <div className="progress-track"><div className={`progress-bar ${barClass}`} style={{ width: `${occupancy}%` }} /></div>

      <div className="bus-metrics">
        <div className="metric"><span>ETA</span><strong>{formatEta(bus.eta_minutes)}</strong></div>
        <div className="metric"><span>Seats</span><strong>{bus.available_seats ?? "—"}</strong></div>
        <div className="metric"><span>Speed</span><strong>{bus.speed_kmh ?? "—"} km/h</strong></div>
        <div className="metric"><span>Status</span><strong>{status}</strong></div>
      </div>

      {Number.isFinite(predicted) && (
        <div className="prediction-strip">
          <div>
            <span>Next {bus.prediction_horizon_minutes || 15} min</span>
            <strong>{predicted.toFixed(1)}% predicted</strong>
          </div>
          <div className="prediction-meta">
            <span>Confidence {confidence(bus.confidence_score)}</span>
            <span className={delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "delta-flat"}>
              {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta} pax`}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
