import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Siren,
  X,
} from "lucide-react";

const SOS_API_URL = import.meta.env.VITE_SOS_API_URL;

export default function SOSButtonTest({ bus = null }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  function openConfirmation() {
    setResult(null);
    setMessage("");
    setShowConfirm(true);
  }

  function closeConfirmation() {
    if (sending) return;

    setShowConfirm(false);
    setMessage("");
    setResult(null);
  }

  async function handleSendSOS() {
    if (!bus) {
      setResult({
        type: "error",
        text: "No live bus is currently selected.",
      });
      return;
    }

    if (!SOS_API_URL) {
      setResult({
        type: "error",
        text:
          "SOS API URL is not configured. Add VITE_SOS_API_URL to the frontend environment.",
      });
      return;
    }

    setSending(true);
    setResult(null);

    const payload = {
      emergency_type: "general",

      bus_id: bus.bus_id ?? null,
      bus_name: bus.bus_name ?? null,
      bus_number: bus.bus_number ?? null,

      trip_id: bus.trip_id ?? null,
      trip_code: bus.trip_code ?? null,

      route_id: bus.route_id ?? null,
      route_code: bus.route_code ?? null,
      route_name: bus.route_name ?? null,

      source: bus.source ?? bus.origin ?? null,
      destination: bus.destination ?? null,

      current_stop: bus.current_stop ?? null,
      next_stop: bus.next_stop ?? null,

      bus_latitude:
        bus.latitude !== undefined && bus.latitude !== null
          ? Number(bus.latitude)
          : null,

      bus_longitude:
        bus.longitude !== undefined && bus.longitude !== null
          ? Number(bus.longitude)
          : null,

      passenger_message:
        message.trim() || "Passenger emergency alert",
    };

    try {
      const response = await fetch(SOS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.details ||
            data?.error ||
            `SOS request failed with status ${response.status}`
        );
      }

      setResult({
        type: "success",
        text: `Emergency alert sent successfully. Incident ID: ${
          data.incident?.id || "created"
        }.`,
      });
    } catch (error) {
      setResult({
        type: "error",
        text:
          error?.message ||
          "Unable to send the emergency alert.",
      });
    } finally {
      setSending(false);
    }
  }

  const busLabel =
    bus?.bus_name ||
    bus?.bus_number ||
    "Selected bus";

  const routeLabel =
    bus?.route_name ||
    `${bus?.source || ""} → ${bus?.destination || ""}`;

  return (
    <>
      {/* SOS BUTTON */}
      <button
        type="button"
        aria-label="Emergency SOS"
        onClick={openConfirmation}
        style={{
          position: "fixed",
          right: "22px",
          bottom: "22px",
          zIndex: 999999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          padding: "13px 19px",
          border: "none",
          borderRadius: "999px",
          background: "#c62828",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 900,
          cursor: "pointer",
          boxShadow:
            "0 10px 28px rgba(198, 40, 40, 0.28)",
        }}
      >
        <Siren size={18} />
        SOS
      </button>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          {/* BACKDROP */}
          <div
            onClick={sending ? undefined : closeConfirmation}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.56)",
            }}
          />

          {/* MODAL */}
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payani-sos-title"
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(470px, 100%)",
              padding: "26px",
              borderRadius: "22px",
              background: "#ffffff",
              boxShadow:
                "0 24px 70px rgba(15, 35, 70, 0.24)",
              fontFamily:
                'Inter, "Segoe UI", Roboto, Arial, sans-serif',
            }}
          >
            {/* CLOSE */}
            <button
              type="button"
              onClick={closeConfirmation}
              disabled={sending}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "36px",
                height: "36px",
                display: "grid",
                placeItems: "center",
                border: "none",
                borderRadius: "10px",
                background: "#f5f8fc",
                color: "#667085",
                cursor: sending
                  ? "not-allowed"
                  : "pointer",
                opacity: sending ? 0.5 : 1,
              }}
            >
              <X size={20} />
            </button>

            {/* ICON */}
            <div
              style={{
                width: "62px",
                height: "62px",
                display: "grid",
                placeItems: "center",
                borderRadius: "18px",
                background: "#fff1f1",
                color: "#c62828",
              }}
            >
              <Siren size={30} />
            </div>

            {/* HEADING */}
            <div
              style={{
                marginTop: "16px",
                paddingRight: "40px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  color: "#667085",
                }}
              >
                EMERGENCY ASSISTANCE
              </div>

              <h2
                id="payani-sos-title"
                style={{
                  margin: "7px 0 8px",
                  fontSize: "24px",
                  lineHeight: 1.2,
                  color: "#172033",
                }}
              >
                Send an SOS alert?
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                PAYANI will send the current bus and trip
                details to the authority system.
              </p>
            </div>

            {/* BUS DETAILS */}
            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "20px",
                padding: "15px",
                borderRadius: "15px",
                background: "#f8fbff",
                border: "1px solid #dbe4ef",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                  }}
                >
                  Bus
                </span>

                <strong
                  style={{
                    color: "#172033",
                    fontSize: "13px",
                  }}
                >
                  {busLabel}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                  }}
                >
                  Vehicle
                </span>

                <strong
                  style={{
                    color: "#172033",
                    fontSize: "13px",
                  }}
                >
                  {bus?.bus_number || "—"}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                  }}
                >
                  Route
                </span>

                <strong
                  style={{
                    color: "#172033",
                    fontSize: "13px",
                    textAlign: "right",
                  }}
                >
                  {routeLabel}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                  }}
                >
                  Current Stop
                </span>

                <strong
                  style={{
                    color: "#172033",
                    fontSize: "13px",
                  }}
                >
                  {bus?.current_stop || "—"}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                  }}
                >
                  Next Stop
                </span>

                <strong
                  style={{
                    color: "#172033",
                    fontSize: "13px",
                  }}
                >
                  {bus?.next_stop || "—"}
                </strong>
              </div>
            </div>

            {/* MESSAGE */}
            <label
              style={{
                display: "block",
                marginTop: "18px",
                color: "#172033",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              Message (optional)

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Describe the emergency..."
                rows={3}
                disabled={sending}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "7px",
                  padding: "11px 12px",
                  border: "1px solid #dbe4ef",
                  borderRadius: "12px",
                  outline: "none",
                  resize: "vertical",
                  color: "#172033",
                  background: "#ffffff",
                  font: "inherit",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            {/* RESULT */}
            {result && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "9px",
                  marginTop: "14px",
                  padding: "12px",
                  borderRadius: "12px",
                  background:
                    result.type === "success"
                      ? "#edf9f1"
                      : "#fff1f1",
                  color:
                    result.type === "success"
                      ? "#16803c"
                      : "#c62828",
                  fontSize: "12px",
                  lineHeight: 1.45,
                  wordBreak: "break-word",
                }}
              >
                {result.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}

                <span>{result.text}</span>
              </div>
            )}

            {/* ACTIONS */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={sending}
                style={{
                  padding: "11px 16px",
                  borderRadius: "11px",
                  border: "1px solid #dbe4ef",
                  background: "#f8fbff",
                  color: "#667085",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: sending
                    ? "not-allowed"
                    : "pointer",
                  opacity: sending ? 0.6 : 1,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendSOS}
                disabled={sending || !bus}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: "11px 16px",
                  borderRadius: "11px",
                  border: "none",
                  background: "#c62828",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 900,
                  cursor:
                    sending || !bus
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    sending || !bus ? 0.65 : 1,
                }}
              >
                {sending ? (
                  <>
                    <LoaderCircle
                      size={18}
                      style={{
                        animation:
                          "payani-sos-spin 1s linear infinite",
                      }}
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Siren size={18} />
                    Send SOS
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      <style>
        {`
          @keyframes payani-sos-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
}