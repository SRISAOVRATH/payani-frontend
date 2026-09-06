import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  BusFront,
  Clock3,
  UsersRound,
  MapPin,
} from "lucide-react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useLiveBuses } from "../hooks/useLiveBuses";

/* ============================================================
   HELPERS
   ============================================================ */

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function crowdClass(level) {
  return (
    {
      Critical: "crowd-critical",
      High: "crowd-high",
      Medium: "crowd-medium",
      Low: "crowd-low",
    }[level] || "crowd-low"
  );
}

function eta(value) {
  return value == null
    ? "N/A"
    : `${Number(value).toFixed(1)} min`;
}

function getOccupancyBar(occupancy) {
  if (occupancy >= 85) {
    return "critical";
  }

  if (occupancy >= 70) {
    return "high";
  }

  if (occupancy >= 40) {
    return "medium";
  }

  return "low";
}

function formatConfidence(score) {
  if (score == null) {
    return "N/A";
  }

  const value = Number(score);

  return `${Math.round(
    value <= 1
      ? value * 100
      : value
  )}%`;
}

/* ============================================================
   SEARCH RESULT ROW
   ============================================================ */

function SearchResultRow({
  bus,
  onDetails,
}) {
  const occupancy = Math.min(
    100,
    Math.max(
      0,
      Number(
        bus.occupancy_percent || 0
      )
    )
  );

  const status =
    bus.trip_status ||
    bus.bus_status ||
    "Unknown";

  const bar =
    getOccupancyBar(
      occupancy
    );

  return (
    <article className="result-row">

      {/* BUS / ROUTE */}

      <div className="result-main">

        <div className="result-bus-icon">
          <BusFront size={17} />
        </div>

        <div>
          <strong>
            {bus.bus_number}
          </strong>

          <small>
            {bus.route_name}
          </small>

          <small className="result-location">
            <MapPin size={10} />

            {bus.current_stop ||
              "Current stop"}

            {" → "}

            {bus.next_stop ||
              "Next stop"}
          </small>
        </div>

      </div>

      {/* STATUS */}

      <span
        className={crowdClass(
          bus.crowd_level
        )}
      >
        {status}
      </span>

      {/* ETA */}

      <div className="result-eta">

        <small>
          <Clock3 size={10} />
          ETA
        </small>

        <strong>
          {eta(
            bus.eta_minutes
          )}
        </strong>

      </div>

      {/* OCCUPANCY */}

      <div className="result-occupancy">

        <div>
          <strong>
            {occupancy.toFixed(1)}%
          </strong>

          <small>
            <UsersRound size={10} />

            {bus.available_seats ??
              "—"}{" "}
            seats
          </small>
        </div>

        <div className="mini-progress">
          <i
            className={bar}
            style={{
              width: `${occupancy}%`,
            }}
          />
        </div>

      </div>

      {/* DETAILS */}

      <button
        className="row-action"
        type="button"
        onClick={() =>
          onDetails(bus)
        }
      >
        View details
        <ArrowRight size={14} />
      </button>

    </article>
  );
}

/* ============================================================
   SEARCH PAGE
   ============================================================ */

export default function SearchPage() {
  const navigate =
    useNavigate();

  const {
    buses,
    loading,
    error,
    refresh,
  } = useLiveBuses();

  const [params] =
    useSearchParams();

  /*
   * IMPORTANT:
   * Search is considered active only when BOTH
   * From and To are present.
   */
  const initialFrom =
    params.get("from") || "";

  const initialTo =
    params.get("to") || "";

  const [source, setSource] =
    useState(initialFrom);

  const [destination, setDestination] =
    useState(initialTo);

  const [searched, setSearched] =
    useState(
      Boolean(
        initialFrom &&
        initialTo
      )
    );

  const [sourceError, setSourceError] =
    useState(false);

  const [
    destinationError,
    setDestinationError,
  ] = useState(false);

  const [sort, setSort] =
    useState("eta");

  const [refreshing, setRefreshing] =
    useState(false);

  /* ==========================================================
     STOP OPTIONS
     ========================================================== */

  const stops = useMemo(() => {
    const values = new Set();

    buses.forEach((bus) => {
      [
        bus.source,
        bus.destination,
        bus.current_stop,
        bus.next_stop,
      ].forEach((value) => {
        if (value) {
          values.add(value);
        }
      });
    });

    return [...values].sort();
  }, [buses]);

  /* ==========================================================
     SEARCH RESULTS

     NO RESULT unless:
       1. From selected
       2. To selected
       3. Search button pressed
     ========================================================== */

 const results = useMemo(() => {
  if (!searched || !source || !destination) {
    return [];
  }

  const from = normalize(source);
  const to = normalize(destination);

  const filtered = buses.filter((bus) => {
    // Only use the actual trip direction.
    // DO NOT use route_name for matching.
    const busSource = normalize(bus.source);
    const busDestination = normalize(bus.destination);

    // Exact directional match:
    // Coimbatore -> Erode will NOT match Erode -> Coimbatore
    const fromMatch = busSource === from;
    const toMatch = busDestination === to;

    return fromMatch && toMatch;
  });

  return [...filtered].sort((a, b) => {
    if (sort === "occupancy") {
      return (
        Number(a.occupancy_percent || 0) -
        Number(b.occupancy_percent || 0)
      );
    }

    return (
      Number(a.eta_minutes ?? 999) -
      Number(b.eta_minutes ?? 999)
    );
  });
}, [
  buses,
  searched,
  source,
  destination,
  sort,
]);

  /* ==========================================================
     FROM CHANGE
     ========================================================== */

  function handleSourceChange(value) {
    setSource(value);
    setSourceError(false);

    /*
     * Changing a field means the current search
     * is no longer considered submitted.
     */
    setSearched(false);
  }

  /* ==========================================================
     TO CHANGE
     ========================================================== */

  function handleDestinationChange(value) {
    setDestination(value);
    setDestinationError(false);

    /*
     * Changing a field means the current search
     * is no longer considered submitted.
     */
    setSearched(false);
  }

  /* ==========================================================
     SEARCH SUBMIT
     ========================================================== */

  function submit(event) {
    event.preventDefault();

    const missingSource =
      !source;

    const missingDestination =
      !destination;

    setSourceError(
      missingSource
    );

    setDestinationError(
      missingDestination
    );

    /*
     * Absolutely no search when either field is empty.
     */
    if (
      missingSource ||
      missingDestination
    ) {
      setSearched(false);
      return;
    }

    setSearched(true);
  }

  /* ==========================================================
     CLEAR
     ========================================================== */

  function clear() {
    setSource("");
    setDestination("");

    setSourceError(false);
    setDestinationError(false);

    setSearched(false);
  }

  /* ==========================================================
     SWAP
     ========================================================== */

  function swapLocations() {
    const oldSource =
      source;

    setSource(
      destination
    );

    setDestination(
      oldSource
    );

    setSourceError(false);
    setDestinationError(false);

    /*
     * User must press Search again
     * after swapping.
     */
    setSearched(false);
  }

  /* ==========================================================
     REFRESH
     ========================================================== */

  async function handleRefresh() {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
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

  /* ==========================================================
     RETURN
     ========================================================== */

  return (
    <main className="page-shell">

      {/* ======================================================
          PAGE INTRO
         ====================================================== */}

    <section className="page-intro search-intro">

  <div className="search-intro-content">

    <div className="eyebrow">
      SMART JOURNEY SEARCH
    </div>

    <h1>
      Find your bus.
    </h1>

    <p>
      Compare live buses by
      route, ETA, capacity and
      crowd level.
    </p>

  </div>

  <div className="search-intro-image">
    <img
      src="/search-bus-hero.png"
      alt="PAYANI SmartBus"
    />
  </div>

</section>

      {/* ======================================================
          SEARCH PANEL
         ====================================================== */}

      <form
        className="search-panel"
        onSubmit={submit}
        noValidate
      >

        {/* FROM */}

        <label
          className={
            sourceError
              ? "field-error"
              : ""
          }
        >
          <span>
            From
          </span>

          <select
            value={source}
            onChange={(event) =>
              handleSourceChange(
                event.target.value
              )
            }
          >
            <option value="" disabled hidden>
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
              <span>!</span>
              Select a starting point
            </small>
          )}
        </label>

        {/* SWAP */}

        <button
          type="button"
          className="swap-button"
          onClick={
            swapLocations
          }
          aria-label="Swap origin and destination"
          title="Swap origin and destination"
        >
          <ArrowLeftRight
            size={16}
          />
        </button>

        {/* TO */}

        <label
          className={
            destinationError
              ? "field-error"
              : ""
          }
        >
          <span>
            To
          </span>

          <select
            value={destination}
            onChange={(event) =>
              handleDestinationChange(
                event.target.value
              )
            }
          >
            <option value="">
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
              <span>!</span>
              Select a destination
            </small>
          )}
        </label>

        {/* SEARCH */}

        <button
          type="submit"
          className="primary-button"
        >
          <SearchIcon size={16} />
          Search buses
        </button>

      </form>

      {/* ======================================================
          RESULTS
         ====================================================== */}

      <section className="search-results-section">

        <div className="section-heading-row">

          <div>
            <div className="section-kicker">
              SEARCH RESULTS
            </div>

            <h2>
              {searched
                ? `${results.length} buses found`
                : "Choose your journey"}
            </h2>
          </div>

          <div className="search-toolbar">

            <SlidersHorizontal
              size={15}
            />

            {/* SORT */}

            <div
              className="sort-toggle"
              role="group"
              aria-label="Sort search results"
            >
              <button
                type="button"
                className={
                  sort === "eta"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSort("eta")
                }
              >
                Fastest ETA
              </button>

              <button
                type="button"
                className={
                  sort ===
                  "occupancy"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSort(
                    "occupancy"
                  )
                }
              >
                Lowest occupancy
              </button>
            </div>

            {/* CLEAR */}

            {searched && (
              <button
                type="button"
                className="ghost-button"
                onClick={
                  clear
                }
              >
                <X size={14} />
                Clear
              </button>
            )}

            {/* REFRESH */}

            <button
              type="button"
              className="refresh-button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

        </div>

        {/* ====================================================
            LOADING
           ==================================================== */}

        {loading && (
          <section className="state-card">
            Loading live search
            results…
          </section>
        )}

        {/* ====================================================
            ERROR
           ==================================================== */}

        {error && (
          <section
            className="state-card state-error"
          >
            {error}
          </section>
        )}

        {/* ====================================================
            BEFORE SEARCH
           ==================================================== */}

        {!loading &&
          !error &&
          !searched && (
            <section className="state-card search-empty-state">
              <strong>
                Select both locations
              </strong>

              <span>
                Choose a starting point
                and destination, then
                press Search buses.
              </span>
            </section>
          )}

        {/* ====================================================
            SEARCHED RESULTS
           ==================================================== */}

        {!loading &&
          !error &&
          searched && (
            <div className="result-list">

              {results.map((bus) => (
                <SearchResultRow
                  key={
                    bus.trip_id ||
                    bus.bus_id
                  }
                  bus={bus}
                  onDetails={
                    openBusDetails
                  }
                />
              ))}

              {!results.length && (
                <section className="state-card">
                  <strong>
                    No buses found
                  </strong>

                  <span>
                    No live buses match
                    this journey. Try
                    another pair of stops.
                  </span>
                </section>
              )}

            </div>
          )}

      </section>

    </main>
  );
}