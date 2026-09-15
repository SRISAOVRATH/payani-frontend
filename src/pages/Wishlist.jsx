import {
  ArrowRight,
  BusFront,
  Heart,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useLiveBuses } from "../hooks/useLiveBuses";
import { useWishlist } from "../context/WishlistContext";

function formatEta(value) {
  return value == null
    ? "N/A"
    : `${Number(value).toFixed(1)} min`;
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

export default function Wishlist() {
  const navigate = useNavigate();

  const {
    buses,
    loading,
    error,
  } = useLiveBuses();

  const {
    wishlist,
    getBusKey,
    removeFromWishlist,
    removeWishlistKey,
  } = useWishlist();

  const savedBuses = wishlist.map((key) => ({
    key,
    bus: buses.find(
      (item) => getBusKey(item) === key
    ),
  }));

  function clearAllBuses() {
    wishlist.forEach((key) => {
      removeWishlistKey(key);
    });
  }

  return (
    <main className="page-shell wishlist-page">
      <section className="page-intro">
        <div>
          <div className="section-kicker">
            SAVED BUSES
          </div>

          <h1>My Buses</h1>

          <p>
            Keep your favourite buses in one place and
            open their live details quickly.
          </p>

          <div className="wishlist-header-actions">
            <div className="wishlist-count">
              <Heart
                size={15}
                fill="currentColor"
              />
              {wishlist.length} saved
            </div>

            {wishlist.length > 0 && (
              <button
                type="button"
                className="wishlist-clear-button"
                onClick={clearAllBuses}
              >
                <Trash2 size={14} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </section>

      {loading && (
        <section className="state-card">
          <strong>
            Loading your saved buses...
          </strong>
        </section>
      )}

      {!loading && error && (
        <section className="state-card state-error">
          <strong>
            Unable to load live bus data
          </strong>

          <span>{error}</span>
        </section>
      )}

      {!loading &&
        !error &&
        wishlist.length === 0 && (
          <section className="wishlist-empty">
            <div className="wishlist-empty-icon">
              <Heart size={22} />
            </div>

            <h2>
              No saved buses yet
            </h2>

            <p>
              Tap the heart on a bus from Home, Search,
              or Bus Details to add it here.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/search")
              }
            >
              Search buses
              <ArrowRight size={14} />
            </button>
          </section>
        )}

      {!loading &&
        !error &&
        wishlist.length > 0 && (
          <section className="wishlist-grid">
            {savedBuses.map(
              ({ key, bus }) => {
                if (!bus) {
                  return (
                    <article
                      className="wishlist-card wishlist-card-offline"
                      key={key}
                    >
                      <div className="wishlist-card-top">
                        <div className="wishlist-bus-title">
                          <div className="wishlist-bus-icon">
                            <BusFront size={17} />
                          </div>

                          <div>
                            <strong>
                              Saved bus
                            </strong>

                            <span>
                              This bus is currently not
                              in the live feed.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="wishlist-remove-button"
                          onClick={() =>
                            removeWishlistKey(key)
                          }
                          aria-label="Remove saved bus"
                          title="Remove saved bus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  );
                }

                const status =
                  bus.trip_status ||
                  bus.bus_status ||
                  "Unknown";

                return (
                  <article
                    className="wishlist-card"
                    key={key}
                  >
                    <div className="wishlist-card-top">
                      <div className="wishlist-bus-title">
                        <div className="wishlist-bus-icon">
                          <BusFront size={17} />
                        </div>

                        <div>
                          <strong>
                            {bus.bus_name ||
                              bus.bus_number}
                          </strong>

                          <span>
                            Vehicle:{" "}
                            {bus.bus_number}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="wishlist-remove-button liked"
                        onClick={() =>
                          removeFromWishlist(bus)
                        }
                        aria-label={`Remove ${
                          bus.bus_name ||
                          bus.bus_number
                        } from My Buses`}
                        title="Remove from My Buses"
                      >
                        <Heart
                          size={16}
                          fill="currentColor"
                        />
                      </button>
                    </div>

                    <div className="wishlist-route">
                      {bus.route_name ||
                        "Route unavailable"}
                    </div>

                    <div className="wishlist-stops">
                      {bus.current_stop ||
                        "Current stop"}

                      <span>→</span>

                      {bus.next_stop ||
                        "Next stop"}
                    </div>

                    <div className="wishlist-card-metrics">
                      <div>
                        <span>ETA</span>

                        <strong>
                          {formatEta(
                            bus.eta_minutes
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Seats</span>

                        <strong>
                          {bus.available_seats ??
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>

                        <strong
                          className={getCrowdClass(
                            bus.crowd_level
                          )}
                        >
                          {status}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="wishlist-details-button"
                      onClick={() =>
                        navigate(
                          `/bus/${bus.trip_id}`
                        )
                      }
                    >
                      View details
                      <ArrowRight size={14} />
                    </button>
                  </article>
                );
              }
            )}
          </section>
        )}
    </main>
  );
}