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
  Heart,
  IndianRupee,
  RotateCcw,
} from "lucide-react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useLiveBuses } from "../hooks/useLiveBuses";
import { useWishlist } from "../context/WishlistContext";

/* ============================================================
   HELPERS
   ============================================================ */

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeStopSearch(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
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
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;

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
    return 0;
  }

  if (cleanStop === cleanQuery) {
    return 1200;
  }

  const directIndex = cleanStop.indexOf(cleanQuery);

  if (directIndex !== -1) {
    return 1100 - directIndex;
  }

  if (isSubsequence(cleanQuery, cleanStop)) {
    return 900 - Math.max(0, cleanStop.length - cleanQuery.length);
  }

  const queryLength = cleanQuery.length;
  let bestDistance = levenshteinDistance(
    cleanQuery,
    cleanStop
  );

  if (cleanStop.length > queryLength) {
    const minimumLength = Math.max(1, queryLength - 1);
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
        bestDistance = Math.min(
          bestDistance,
          levenshteinDistance(
            cleanQuery,
            cleanStop.slice(
              start,
              start + length
            )
          )
        );
      }
    }
  }

  const allowedDistance =
    queryLength <= 2
      ? 1
      : Math.max(1, Math.floor(queryLength * 0.4));

  if (bestDistance <= allowedDistance) {
    return 800 - bestDistance * 80;
  }

  return -1;
}

function getStopMatches(query, stops, limit = 10) {
  const trimmedQuery = normalize(query);

  if (!trimmedQuery) {
    return stops.slice(0, limit);
  }

  return stops
    .map((stop) => ({
      stop,
      score: fuzzyStopScore(trimmedQuery, stop),
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

function isBusServingJourney(bus, from, to) {
  const routeStops = Array.isArray(bus.route_stops)
    ? bus.route_stops
        .map((stop) => normalize(stop))
        .filter(Boolean)
    : [];

  if (routeStops.length < 2) {
    return (
      normalize(bus.source) === from &&
      normalize(bus.destination) === to
    );
  }

  const fromIndex = routeStops.indexOf(from);
  const toIndex = routeStops.indexOf(to);

  if (
    fromIndex === -1 ||
    toIndex === -1 ||
    fromIndex === toIndex
  ) {
    return false;
  }

  const currentIndex = routeStops.indexOf(
    normalize(bus.current_stop)
  );

  const nextIndex = routeStops.indexOf(
    normalize(bus.next_stop)
  );

  let direction = null;

  if (
    currentIndex !== -1 &&
    nextIndex !== -1 &&
    currentIndex !== nextIndex
  ) {
    direction =
      nextIndex > currentIndex
        ? 1
        : -1;
  }

  if (direction === null) {
    direction =
      normalize(bus.destination) ===
      routeStops[routeStops.length - 1]
        ? 1
        : -1;
  }

  const requestedDirection =
    toIndex > fromIndex ? 1 : -1;

  if (direction !== requestedDirection) {
    return false;
  }

  if (direction === 1) {
    return currentIndex === -1 ||
      currentIndex <= toIndex;
  }

  return currentIndex === -1 ||
    currentIndex >= toIndex;
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
  journeyFrom,
  journeyTo,
}) {
  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();
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
            {bus.bus_name || bus.bus_number}
          </strong>

          <small>
            {bus.bus_number} · {
              journeyFrom && journeyTo
                ? `${journeyFrom} → ${journeyTo}`
                : bus.route_name
            }
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
{/* FARE */}

<div className="result-fare">

  <small>
    <IndianRupee size={10} />
    Fare
  </small>

  <strong>
    {bus.fare != null
      ? `₹${Number(bus.fare).toFixed(0)}`
      : "N/A"}
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

      <button
        type="button"
        className={`wishlist-heart-button result-wishlist-heart ${
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

  const [params, setParams] =
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

  const initialBusSearch =
    params.get("bus") || "";

  const initialBusSearched =
    params.get("busSearch") === "1";

  const [source, setSource] =
    useState(initialFrom);

  const [destination, setDestination] =
    useState(initialTo);

  const [sourceQuery, setSourceQuery] =
    useState(initialFrom);

  const [destinationQuery, setDestinationQuery] =
    useState(initialTo);

  const [activeStopField, setActiveStopField] =
    useState(null);

  const [busSearch, setBusSearch] =
    useState(initialBusSearch);
  const [busSearchError, setBusSearchError] =
  useState(false);
  const [busSearched, setBusSearched] =
    useState(initialBusSearched);

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
      if (Array.isArray(bus.route_stops)) {
        bus.route_stops.forEach((stop) => {
          if (stop) {
            values.add(stop);
          }
        });
      }

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

  const sourceMatches = useMemo(
    () =>
      getStopMatches(
        sourceQuery,
        stops
      ),
    [sourceQuery, stops]
  );

  const destinationMatches = useMemo(
    () =>
      getStopMatches(
        destinationQuery,
        stops
      ),
    [destinationQuery, stops]
  );

  /* ==========================================================
     SEARCH RESULTS

     NO RESULT unless:
       1. From selected
       2. To selected
       3. Search button pressed
     ========================================================== */

 const results = useMemo(() => {
  const busQuery = normalize(busSearch);

  if (busSearched && busQuery) {
    const filtered = buses.filter((bus) => {
      const busName = normalize(bus.bus_name);
      const busNumber = normalize(bus.bus_number);

      return (
  busName === busQuery ||
  busNumber === busQuery
);
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
  }

  if (!searched || !source || !destination) {
    return [];
  }

  const from = normalize(source);
  const to = normalize(destination);

  const filtered = buses.filter((bus) =>
    isBusServingJourney(
      bus,
      from,
      to
    )
  );

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
  busSearch,
  busSearched,
]);

  /* ==========================================================
     FROM CHANGE
     ========================================================== */

  function handleSourceChange(value) {
    setSource(value);
    setSourceQuery(value);
    setSourceError(false);
    setActiveStopField(null);

    /*
     * Changing a field means the current search
     * is no longer considered submitted.
     */
    setSearched(false);
    setBusSearched(false);
  }

  function handleSourceInput(value) {
    setSourceQuery(value);
    setSource("");
    setSourceError(false);
    setSearched(false);
    setBusSearched(false);
    setActiveStopField("source");
  }

  /* ==========================================================
     TO CHANGE
     ========================================================== */

  function handleDestinationChange(value) {
    setDestination(value);
    setDestinationQuery(value);
    setDestinationError(false);
    setActiveStopField(null);

    /*
     * Changing a field means the current search
     * is no longer considered submitted.
     */
    setSearched(false);
    setBusSearched(false);
  }

  function handleDestinationInput(value) {
    setDestinationQuery(value);
    setDestination("");
    setDestinationError(false);
    setSearched(false);
    setBusSearched(false);
    setActiveStopField("destination");
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
      handleSourceChange(matches[0]);
    } else {
      handleDestinationChange(matches[0]);
    }
  }

  /* ==========================================================
     SEARCH SUBMIT
     ========================================================== */
  function submitBusSearch(event) {
  event.preventDefault();

  const missingBusSearch =
    !busSearch.trim();

  setBusSearchError(missingBusSearch);

  if (missingBusSearch) {
    setBusSearched(false);
    return;
  }

  setBusSearchError(false);
  setSearched(false);
  setBusSearched(true);

  setParams({
    bus: busSearch.trim(),
    busSearch: "1",
  });
}

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
      setBusSearched(false);
      
      return;
    }

    setSearched(true);

    setParams({
      from: source,
      to: destination,
    });
  }

  /* ==========================================================
     CLEAR
     ========================================================== */

  function clear() {
    setSource("");
    setDestination("");
    setSourceQuery("");
    setDestinationQuery("");
    setBusSearch("");


    setSourceError(false);
    setDestinationError(false);
    setBusSearchError(false);


    setSearched(false);
    setBusSearched(false);
    setActiveStopField(null);
    setParams({});
  }

  /* ==========================================================
     SWAP
     ========================================================== */

  function swapLocations() {
    const oldSource =
      source;

    const oldSourceQuery =
      sourceQuery;

    setSource(
      destination
    );

    setDestination(
      oldSource
    );

    setSourceQuery(
      destinationQuery
    );

    setDestinationQuery(
      oldSourceQuery
    );

    setSourceError(false);
    setDestinationError(false);
    setActiveStopField(null);

    /*
     * User must press Search again
     * after swapping.
     */
    setSearched(false);
    setBusSearched(false);
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

    const returnParams =
      new URLSearchParams();

    returnParams.set(
      "returnTo",
      "search"
    );

    if (source && destination) {
      returnParams.set(
        "from",
        source
      );

      returnParams.set(
        "to",
        destination
      );
    }

    if (busSearched && busSearch.trim()) {
      returnParams.set(
        "bus",
        busSearch.trim()
      );

      returnParams.set(
        "busSearch",
        "1"
      );
    }

    navigate(
      `/bus/${bus.trip_id}?${returnParams.toString()}`
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

    <div
      className="eyebrow"
      style={{
        color: "#f5c400",
      }}
    >
      SMART JOURNEY SEARCH
    </div>

    <h1
      style={{
        color: "#ffffff",
      }}
    >
      Find your bus.
    </h1>

    <p
      style={{
        color: "rgba(255, 255, 255, 0.86)",
      }}
    >
      Compare live buses by
      route, ETA, capacity and
      crowd level.
    </p>
   
    <form
      className="bus-name-search"
      onSubmit={submitBusSearch}
    >

      <input
        type="text"
        value={busSearch}
        onChange={(event) => {
          setBusSearch(event.target.value);
          setBusSearchError(false);
          setBusSearched(false);
          setSearched(false);
        }}
        placeholder="Bus name or bus number"
        aria-label="Search by bus name or bus number"
        aria-invalid={busSearchError}
      />

      {busSearchError && (
        <small className="bus-search-error">
          Enter a bus name or bus number
        </small>
      )}

      <button type="submit">
        <SearchIcon size={15} />
        Search bus
      </button>

    </form>

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
                setActiveStopField("source")
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
              placeholder="Search starting point"
              autoComplete="off"
              aria-label="Search starting point"
              aria-invalid={sourceError}
              style={{
                width: "100%",
                height: "40px",
                boxSizing: "border-box",
                padding: "0 14px",
                border: "1px solid #d8e1ec",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#16335c",
                fontSize: "13px",
                outline: "none",
              }}
            />

            {activeStopField === "source" && (
              <div
                role="listbox"
                style={{
                  position: "absolute",
                  top: "calc(100% + 5px)",
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  maxHeight: "260px",
                  overflowY: "auto",
                  background: "#ffffff",
                  border: "1px solid #d8e1ec",
                  borderRadius: "10px",
                  boxShadow: "0 12px 28px rgba(24, 55, 93, 0.16)",
                  padding: "6px",
                }}
              >
                {sourceMatches.length ? (
                  sourceMatches.map((stop) => (
                    <button
                      key={stop}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSourceChange(stop);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        borderRadius: "7px",
                        background: "transparent",
                        color: "#173b6b",
                        textAlign: "left",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {stop}
                    </button>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "10px 12px",
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
                setActiveStopField("destination")
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
              placeholder="Search destination"
              autoComplete="off"
              aria-label="Search destination"
              aria-invalid={destinationError}
              style={{
                width: "100%",
                height: "40px",
                boxSizing: "border-box",
                padding: "0 14px",
                border: "1px solid #d8e1ec",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#16335c",
                fontSize: "13px",
                outline: "none",
              }}
            />

            {activeStopField === "destination" && (
              <div
                role="listbox"
                style={{
                  position: "absolute",
                  top: "calc(100% + 5px)",
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  maxHeight: "260px",
                  overflowY: "auto",
                  background: "#ffffff",
                  border: "1px solid #d8e1ec",
                  borderRadius: "10px",
                  boxShadow: "0 12px 28px rgba(24, 55, 93, 0.16)",
                  padding: "6px",
                }}
              >
                {destinationMatches.length ? (
                  destinationMatches.map((stop) => (
                    <button
                      key={stop}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleDestinationChange(stop);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        borderRadius: "7px",
                        background: "transparent",
                        color: "#173b6b",
                        textAlign: "left",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {stop}
                    </button>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "10px 12px",
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
              <span>!</span>
              Select a destination
            </small>
          )}
        </label>

        {/* SEARCH */}

       
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <button
            type="submit"
            className="primary-button"
            style={{
              flex: 1,
            }}
          >
            <SearchIcon size={16} />
            Search buses
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={clear}
            title="Reset search"
            aria-label="Reset search"
          >
            <RotateCcw size={15} />
          </button>
        </div>

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
              {busSearched
  ? `${results.length} buses found`
  : searched
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

            {(searched || busSearched) && (
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
          !searched && 
          !busSearched && (
            <section className="state-card search-empty-state">
              <strong>
                Start a search
              </strong>

              <span>
                 Choose From and To for a route search,
                 or search directly by bus name or bus number above.
              </span>
            </section>
          )}

        {/* ====================================================
            SEARCHED RESULTS
           ==================================================== */}

        {!loading &&
          !error &&
          (searched || busSearched) && (
            <div className="result-list">

              {results.map((bus) => (
                <SearchResultRow
                  key={
                    bus.trip_id ||
                    bus.bus_id
                  }
                  bus={bus}
                  journeyFrom={
                    searched ? source : null
                  }
                  journeyTo={
                    searched ? destination : null
                  }
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
                    No matching buses.

                    Try another bus name,
                    bus number, or journey.
                  </span>
                </section>
              )}

            </div>
          )}

      </section>

    </main>
  );
}