import { useMemo, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useLiveBuses } from "../hooks/useLiveBuses";

/* ==========================================================
   NORMALIZE TEXT
   ========================================================== */

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[?.,!]+$/g, "")
    .trim();
}

/* ==========================================================
   FORMAT PLACE NAME
   Used only for displaying locations to the user.
   ========================================================== */

function formatPlaceName(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

/* ==========================================================
   OCCUPANCY
   ========================================================== */

function getOccupancy(bus) {
  const directValue = Number(
    bus?.occupancy_percent
  );

  if (Number.isFinite(directValue)) {
    return directValue;
  }

  const passengers = Number(
    bus?.passengers
  );

  const capacity = Number(
    bus?.capacity ?? 52
  );

  if (
    Number.isFinite(passengers) &&
    capacity > 0
  ) {
    return (passengers / capacity) * 100;
  }

  return 0;
}

/* ==========================================================
   ETA
   ========================================================== */

function getEta(bus) {
  const value = Number(
    bus?.eta_minutes ??
      bus?.eta ??
      bus?.arrival_minutes
  );

  return Number.isFinite(value)
    ? value
    : null;
}

/* ==========================================================
   BUS NAME
   ========================================================== */

function getBusName(bus) {
  return (
    bus?.bus_name ||
    bus?.bus_number ||
    "Unknown bus"
  );
}

/* ==========================================================
   ROUTE
   ========================================================== */

function getRoute(bus) {
  return (
    bus?.route_name ||
    `${bus?.source || ""} → ${
      bus?.destination || ""
    }`
  ).trim();
}

/* ==========================================================
   FARE
   ========================================================== */

function getFare(bus) {
  const value = Number(bus?.fare);

  return Number.isFinite(value)
    ? value
    : null;
}

/* ==========================================================
   FIND EXACT BUS
   ========================================================== */

function findBus(buses, query) {
  const normalizedQuery =
    normalize(query);

  return (
    buses.find((bus) => {
      const busName = normalize(
        bus?.bus_name
      );

      const busNumber = normalize(
        bus?.bus_number
      );

      return (
        busName === normalizedQuery ||
        busNumber === normalizedQuery
      );
    }) || null
  );
}

/* ==========================================================
   FIND BUS MENTIONED INSIDE A SENTENCE
   ========================================================== */

function findBusMentionedInText(
  buses,
  text
) {
  const normalizedText =
    normalize(text);

  return (
    buses.find((bus) => {
      const candidates = [
        bus?.bus_name,
        bus?.bus_number,
      ]
        .filter(Boolean)
        .map(normalize);

      return candidates.some(
        (candidate) => {
          if (!candidate) {
            return false;
          }

          const escapedCandidate =
            candidate.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );

          const pattern = new RegExp(
            `(^|\\s)${escapedCandidate}(?=\\s|$)`,
            "i"
          );

          return pattern.test(
            normalizedText
          );
        }
      );
    }) || null
  );
}

/* ==========================================================
   ROUTE PARSER
   ========================================================== */

function findRouteParts(text) {
  const patterns = [
    /from\s+(.+?)\s+to\s+(.+)$/i,
    /between\s+(.+?)\s+and\s+(.+)$/i,
    /(.+?)\s*(?:→|->)\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      const source = normalize(
        match[1]
      );

      const destination = normalize(
        match[2]
      );

      if (source && destination) {
        return {
          source,
          destination,
        };
      }
    }
  }

  return null;
}

/* ==========================================================
   FILTER ROUTE
   ========================================================== */

function filterByRoute(
  buses,
  source,
  destination
) {
  const normalizedSource =
    normalize(source);

  const normalizedDestination =
    normalize(destination);

  return buses.filter((bus) => {
    const busSource = normalize(
      bus?.source
    );

    const busDestination =
      normalize(bus?.destination);

    return (
      busSource ===
        normalizedSource &&
      busDestination ===
        normalizedDestination
    );
  });
}

/* ==========================================================
   DESTINATION MATCH
   ========================================================== */

function findDestinationMatches(
  buses,
  destination
) {
  const normalizedDestination =
    normalize(destination);

  return buses.filter(
    (bus) =>
      normalize(bus?.destination) ===
      normalizedDestination
  );
}

/* ==========================================================
   RECOMMEND BUS
   ========================================================== */

function recommendBus(buses) {
  if (!buses.length) {
    return null;
  }

  /*
    Lower is better for:
    - ETA
    - Occupancy
    - Fare

    Weight:
    ETA        = 45%
    Occupancy  = 40%
    Fare       = 15%
  */

  const etaValues = buses.map(
    (bus) => getEta(bus) ?? 999
  );

  const crowdValues = buses.map(
    (bus) => getOccupancy(bus)
  );

  const fareValues = buses.map(
    (bus) => getFare(bus) ?? null
  );

  const validFares = fareValues.filter(
    (fare) => fare !== null
  );

  const minEta = Math.min(
    ...etaValues
  );

  const maxEta = Math.max(
    ...etaValues
  );

  const minCrowd = Math.min(
    ...crowdValues
  );

  const maxCrowd = Math.max(
    ...crowdValues
  );

  const minFare =
    validFares.length
      ? Math.min(...validFares)
      : 0;

  const maxFare =
    validFares.length
      ? Math.max(...validFares)
      : 0;

  function normalizeScore(
    value,
    min,
    max
  ) {
    if (max === min) {
      return 50;
    }

    /*
      Lower raw value = better score.
      Therefore we reverse the scale.
    */

    return (
      ((max - value) /
        (max - min)) *
      100
    );
  }

  return [...buses].sort(
    (a, b) => {
      const etaA =
        getEta(a) ?? 999;

      const etaB =
        getEta(b) ?? 999;

      const crowdA =
        getOccupancy(a);

      const crowdB =
        getOccupancy(b);

      const fareA =
        getFare(a);

      const fareB =
        getFare(b);

      const etaScoreA =
        normalizeScore(
          etaA,
          minEta,
          maxEta
        );

      const etaScoreB =
        normalizeScore(
          etaB,
          minEta,
          maxEta
        );

      const crowdScoreA =
        normalizeScore(
          crowdA,
          minCrowd,
          maxCrowd
        );

      const crowdScoreB =
        normalizeScore(
          crowdB,
          minCrowd,
          maxCrowd
        );

      const fareScoreA =
        fareA !== null &&
        validFares.length
          ? normalizeScore(
              fareA,
              minFare,
              maxFare
            )
          : 50;

      const fareScoreB =
        fareB !== null &&
        validFares.length
          ? normalizeScore(
              fareB,
              minFare,
              maxFare
            )
          : 50;

      const scoreA =
        etaScoreA * 0.45 +
        crowdScoreA * 0.40 +
        fareScoreA * 0.15;

      const scoreB =
        etaScoreB * 0.45 +
        crowdScoreB * 0.40 +
        fareScoreB * 0.15;

      return scoreB - scoreA;
    }
  )[0];
}
/* ==========================================================
   FORMAT BUS DETAILS
   ========================================================== */

function formatBusDetails(bus) {
  const route =
    getRoute(bus) ||
    "Route unavailable";

  const occupancy =
    Math.round(
      getOccupancy(bus)
    );

  const eta =
    getEta(bus);

  const fare =
    getFare(bus);

  const vehicle =
    bus?.bus_number
      ? ` Vehicle: ${bus.bus_number}.`
      : "";

  const fareText =
    fare !== null
      ? ` Fare: ₹${fare}.`
      : " Fare unavailable.";

  return `${route}.${vehicle} Occupancy: ${occupancy}%. ${
    eta !== null
      ? `ETA: ${eta} min.`
      : "ETA unavailable."
  }${fareText}`;
}

/* ==========================================================
   FORMAT RECOMMENDATION
   ========================================================== */

function formatRecommendation(
  selectedBus,
  comparedBuses
) {
  if (!selectedBus) {
    return "No suitable bus is currently available.";
  }

  const selectedEta =
    getEta(selectedBus);

  const selectedCrowd =
    Math.round(
      getOccupancy(selectedBus)
    );

  const selectedFare =
    getFare(selectedBus);

  const route =
    getRoute(selectedBus) ||
    "Route unavailable";

  const alternativeBuses =
    comparedBuses.filter(
      (bus) =>
        bus !== selectedBus
    );

  const fastestBus =
    [...comparedBuses]
      .filter(
        (bus) =>
          getEta(bus) !== null
      )
      .sort(
        (a, b) =>
          getEta(a) -
          getEta(b)
      )[0];

  const leastCrowdedBus =
    [...comparedBuses].sort(
      (a, b) =>
        getOccupancy(a) -
        getOccupancy(b)
    )[0];

  const cheapestBus =
    [...comparedBuses]
      .filter(
        (bus) =>
          getFare(bus) !== null
      )
      .sort(
        (a, b) =>
          getFare(a) -
          getFare(b)
      )[0];

  let reason =
    "It offers the best overall balance of arrival time, crowd level, and fare.";

  if (
    fastestBus === selectedBus &&
    leastCrowdedBus === selectedBus
  ) {
    reason =
      "It has the fastest arrival and the lowest crowd level among the matching buses.";
  } else if (
    fastestBus === selectedBus
  ) {
    reason =
      "It has the fastest arrival among the matching buses while maintaining a good crowd/fare balance.";
  } else if (
    leastCrowdedBus === selectedBus
  ) {
    reason =
      "It has the lowest crowd level among the matching buses while maintaining a good ETA/fare balance.";
  } else if (
    cheapestBus === selectedBus
  ) {
    reason =
      "It has the lowest fare while maintaining a good ETA and crowd balance.";
  }

  const etaText =
    selectedEta !== null
      ? `ETA: ${selectedEta} min.`
      : "ETA unavailable.";

  const fareText =
    selectedFare !== null
      ? `Fare: ₹${selectedFare}.`
      : "Fare unavailable.";

  const comparisonText =
    alternativeBuses.length > 0
      ? ` I compared it with ${alternativeBuses
          .map(getBusName)
          .join(", ")}.`
      : "";

  return `${route}. ${etaText} Occupancy: ${selectedCrowd}%. ${fareText} ${reason}${comparisonText}`;
}
/* ==========================================================
   FARE ANSWER
   ========================================================== */

function answerFareQuestion(
  text,
  buses
) {
  /* ========================================================
     1. ROUTE-SPECIFIC FARE
     ======================================================== */

  const routeParts =
    findRouteParts(text);

  if (routeParts) {
    const routeBuses =
      filterByRoute(
        buses,
        routeParts.source,
        routeParts.destination
      );

    if (!routeBuses.length) {
      return {
        title: "Fare unavailable",
        body: `I couldn't find a live bus from ${formatPlaceName(
          routeParts.source
        )} to ${formatPlaceName(
          routeParts.destination
        )}.`,
      };
    }

    const fares =
      routeBuses
        .map(getFare)
        .filter(
          (fare) => fare !== null
        );

    const uniqueFares =
      [...new Set(fares)];

    if (!uniqueFares.length) {
      return {
        title: "Fare unavailable",
        body: `Live fare information is currently unavailable for ${formatPlaceName(
          routeParts.source
        )} → ${formatPlaceName(
          routeParts.destination
        )}.`,
      };
    }

    const fareText =
      uniqueFares
        .map(
          (fare) =>
            `₹${fare}`
        )
        .join(", ");

    const busNames =
      routeBuses
        .map(getBusName)
        .join(", ");

    return {
      title: `💰 Fare: ${formatPlaceName(
        routeParts.source
      )} → ${formatPlaceName(
        routeParts.destination
      )}`,
      body:
        uniqueFares.length === 1
          ? `The current fare is ${fareText}. Live buses on this route: ${busNames}.`
          : `The current live fares are ${fareText}. Live buses on this route: ${busNames}.`,
    };
  }

  /* ========================================================
     2. SPECIFIC BUS FARE
     ======================================================== */

  const mentionedBus =
    findBusMentionedInText(
      buses,
      text
    );

  if (mentionedBus) {
    const fare =
      getFare(mentionedBus);

    if (fare === null) {
      return {
        title: `💰 Fare for ${getBusName(
          mentionedBus
        )}`,
        body:
          "Fare information is currently unavailable for this bus.",
      };
    }

    return {
      title: `💰 Fare for ${getBusName(
        mentionedBus
      )}`,
      body: `${getBusName(
        mentionedBus
      )} currently has a fare of ₹${fare}. Route: ${
        getRoute(mentionedBus) ||
        "Route unavailable"
      }.`,
    };
  }

  /* ========================================================
     3. GENERAL FARE
     ======================================================== */

  const fares =
    buses
      .map(getFare)
      .filter(
        (fare) => fare !== null
      );

  const uniqueFares =
    [...new Set(fares)];

  if (!uniqueFares.length) {
    return {
      title: "Fare unavailable",
      body:
        "Live fare information is currently unavailable.",
    };
  }

  if (uniqueFares.length === 1) {
    return {
      title: "💰 Current fare",
      body: `The current live fare is ₹${uniqueFares[0]}.`,
    };
  }

  return {
    title: "💰 Current live fares",
    body: `The current live fares are ${uniqueFares
      .map(
        (fare) => `₹${fare}`
      )
      .join(
        ", "
      )}, depending on the route.`,
  };
}

/* ==========================================================
   MAIN QUESTION ANSWER
   ========================================================== */

function answerQuestion(
  query,
  buses
) {
  const text =
    normalize(query);

  if (!text) {
    return {
      title: "Ask PAYANI AI",
      body:
        "Ask me about the best bus, ETA, crowd level, fare, a route, or a specific bus.",
    };
  }

  /* ========================================================
     GREETINGS
     ======================================================== */

  if (
    /^(hello|hi|hey)\b/.test(text)
  ) {
    return {
      title: "👋 Hello!",
      body:
        "I'm PAYANI AI. Ask me about buses, routes, ETA, crowd levels, fares, or the best option for your journey.",
    };
  }

  /* ========================================================
     FARE / PRICE / COST
     ======================================================== */

  const isFareQuestion =
    text.includes("fare") ||
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("how much");

  if (isFareQuestion) {
    return answerFareQuestion(
      text,
      buses
    );
  }

  /* ========================================================
     ROUTE-AWARE QUESTIONS
     ======================================================== */

  const routeParts =
    findRouteParts(text);

  if (routeParts) {
    const routeBuses =
      filterByRoute(
        buses,
        routeParts.source,
        routeParts.destination
      );

    if (!routeBuses.length) {
      return {
        title:
          "No matching buses found",
        body: `I couldn't find a live bus from ${formatPlaceName(
          routeParts.source
        )} to ${formatPlaceName(
          routeParts.destination
        )}.`,
      };
    }

    const isLeastCrowded =
      text.includes(
        "least crowded"
      ) ||
      text.includes(
        "less crowded"
      ) ||
      text.includes(
        "less busy"
      ) ||
      text.includes("empty");

    const isFastest =
      text.includes("fastest") ||
      text.includes("first") ||
      text.includes("soon") ||
      text.includes(
        "earliest"
      );

    const isRecommendation =
      text.includes("best") ||
      text.includes(
        "recommend"
      ) ||
      text.includes(
        "should i take"
      ) ||
      text.includes(
        "which bus"
      );

    let selectedBus;

    if (isLeastCrowded) {
      selectedBus =
        [...routeBuses].sort(
          (a, b) =>
            getOccupancy(a) -
            getOccupancy(b)
        )[0];
    } else if (isFastest) {
      selectedBus =
        [...routeBuses]
          .filter(
            (bus) =>
              getEta(bus) !== null
          )
          .sort(
            (a, b) =>
              getEta(a) -
              getEta(b)
          )[0];

      selectedBus =
        selectedBus ||
        recommendBus(routeBuses);
    } else if (isRecommendation) {
      selectedBus =
        recommendBus(routeBuses);
    } else {
      selectedBus =
        recommendBus(routeBuses);
    }

    return {
      title: `⭐ Recommended: ${getBusName(
        selectedBus
      )}`,
      body: formatRecommendation(
        selectedBus,
        routeBuses
      ),
    };
  }

  /* ========================================================
     DESTINATION QUESTIONS
     ======================================================== */

  const destinationMatch =
    ["to ", "for "]
      .map((prefix) => {
        const index =
          text.indexOf(prefix);

        if (index === -1) {
          return null;
        }

        return text
          .slice(
            index +
              prefix.length
          )
          .trim();
      })
      .find(Boolean);

  if (
    destinationMatch &&
    !text.includes(
      "how much"
    )
  ) {
    const destinationBuses =
      findDestinationMatches(
        buses,
        destinationMatch
      );

    if (destinationBuses.length) {
      const selectedBus =
        recommendBus(
          destinationBuses
        );

      return {
        title: `⭐ Recommended: ${getBusName(
          selectedBus
        )}`,
        body: formatRecommendation(
          selectedBus,
          destinationBuses
        ),
      };
    }
  }

  /* ========================================================
     GENERAL RECOMMENDATION
     ======================================================== */

  if (
    text.includes("best") ||
    text.includes(
      "recommend"
    ) ||
    text.includes(
      "should i take"
    ) ||
    text.includes(
      "which bus should"
    )
  ) {
    if (!buses.length) {
      return {
        title:
          "Live buses unavailable",
        body:
          "I cannot recommend a bus because live fleet data is currently unavailable.",
      };
    }

    const selectedBus =
      recommendBus(buses);

    return {
      title: `⭐ I recommend ${getBusName(
        selectedBus
      )}`,
      body: formatRecommendation(
        selectedBus,
        buses
      ),
    };
  }

  /* ========================================================
     LEAST CROWDED
     ======================================================== */

  if (
    text.includes(
      "least crowded"
    ) ||
    text.includes(
      "less crowded"
    ) ||
    text.includes(
      "less busy"
    ) ||
    text.includes("empty")
  ) {
    if (!buses.length) {
      return {
        title:
          "Crowd data unavailable",
        body:
          "Live crowd information is currently unavailable.",
      };
    }

    const selectedBus =
      [...buses].sort(
        (a, b) =>
          getOccupancy(a) -
          getOccupancy(b)
      )[0];

    const fare =
      getFare(selectedBus);

    const fareText =
      fare !== null
        ? ` Fare: ₹${fare}.`
        : "";

    return {
      title: `🟢 ${getBusName(
        selectedBus
      )} is the least crowded`,
      body: `${getBusName(
        selectedBus
      )} currently has about ${Math.round(
        getOccupancy(selectedBus)
      )}% occupancy${
        getEta(selectedBus) !== null
          ? ` and an ETA of ${getEta(
              selectedBus
            )} min.`
          : "."
      }${fareText}`,
    };
  }

  /* ========================================================
     FASTEST ARRIVAL
     ======================================================== */

  if (
    text.includes("first") ||
    text.includes("soon") ||
    text.includes(
      "earliest"
    ) ||
    text.includes("fastest")
  ) {
    const available =
      buses.filter(
        (bus) =>
          getEta(bus) !== null
      );

    if (!available.length) {
      return {
        title:
          "ETA unavailable",
        body:
          "Current ETA information is unavailable.",
      };
    }

    const selectedBus =
      [...available].sort(
        (a, b) =>
          getEta(a) -
          getEta(b)
      )[0];

    const fare =
      getFare(selectedBus);

    const fareText =
      fare !== null
        ? ` Fare: ₹${fare}.`
        : "";

    return {
      title: `🚌 ${getBusName(
        selectedBus
      )} arrives first`,
      body: `${
        getEta(selectedBus)
      } min away on ${
        getRoute(selectedBus) ||
        "the selected route"
      }.${fareText}`,
    };
  }

  /* ========================================================
     SPECIFIC BUS
     ======================================================== */

  const requestedBus =
    findBus(
      buses,
      text
    );

  if (requestedBus) {
    return {
      title: `🚌 ${getBusName(
        requestedBus
      )}`,
      body: formatBusDetails(
        requestedBus
      ),
    };
  }

  /* ========================================================
     BUS MENTIONED IN SENTENCE
     ======================================================== */

  const mentionedBus =
    findBusMentionedInText(
      buses,
      text
    );

  if (mentionedBus) {
    return {
      title: `🚌 ${getBusName(
        mentionedBus
      )}`,
      body: formatBusDetails(
        mentionedBus
      ),
    };
  }

  /* ========================================================
     FALLBACK
     ======================================================== */

  return {
    title:
      "I can help with your journey",
    body:
      "Try asking: “What is the fare from Erode to Coimbatore?”, “Which bus should I take from Erode to Coimbatore?”, “Which bus is less crowded?”, “Which bus arrives first?”, or “Is 20b crowded?”",
  };
}

/* ==========================================================
   FOLLOW-UP QUESTIONS
   ========================================================== */

function getFollowUpQuestions(
  question,
  buses
) {
  const text =
    normalize(question);

  const busMatch =
    findBusMentionedInText(
      buses,
      text
    );

  /* ========================================================
     FARE
     ======================================================== */

  if (
    text.includes("fare") ||
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("how much")
  ) {
    return [
      "Which bus is less crowded?",
      "Which bus arrives first?",
      "Which bus should I take?",
    ];
  }

  /* ========================================================
     CROWD
     ======================================================== */

  if (
    text.includes(
      "least crowded"
    ) ||
    text.includes(
      "less crowded"
    ) ||
    text.includes(
      "less busy"
    ) ||
    text.includes("empty")
  ) {
    return [
      "Which bus arrives first?",
      "What is the fare?",
      "Which bus should I take?",
    ];
  }

  /* ========================================================
     ETA
     ======================================================== */

  if (
    text.includes("first") ||
    text.includes("soon") ||
    text.includes(
      "fastest"
    ) ||
    text.includes(
      "earliest"
    )
  ) {
    return [
      "Which bus is less crowded?",
      "What is the fare?",
      "Which bus should I take?",
    ];
  }

  /* ========================================================
     RECOMMENDATION
     ======================================================== */

  if (
    text.includes(
      "which bus should"
    ) ||
    text.includes("best") ||
    text.includes(
      "recommend"
    )
  ) {
    return [
      "Which bus is less crowded?",
      "Which bus arrives first?",
      "What is the fare?",
    ];
  }

  /* ========================================================
     SPECIFIC BUS
     ======================================================== */

  if (busMatch) {
    return [
      `What is the fare for ${getBusName(
        busMatch
      )}?`,
      `Is ${getBusName(
        busMatch
      )} crowded?`,
      `When does ${getBusName(
        busMatch
      )} arrive?`,
    ];
  }

  /* ========================================================
     GENERAL CROWD / OCCUPANCY
     ======================================================== */

  if (
    text.includes(
      "crowded"
    ) ||
    text.includes(
      "occupancy"
    )
  ) {
    return [
      "Which bus arrives first?",
      "Which bus should I take?",
      "What is the fare?",
    ];
  }

  /* ========================================================
     DEFAULT
     ======================================================== */

  return [
    "Which bus should I take?",
    "Which bus is less crowded?",
    "Which bus arrives first?",
  ];
}

/* ==========================================================
   PAYANI AI COMPONENT
   ========================================================== */

export default function PayaniAI() {
  const { buses } =
    useLiveBuses();

  const [query, setQuery] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  /* ========================================================
     QUICK QUESTIONS
     ======================================================== */

  const quickQuestions =
    useMemo(
      () => [
        "Which bus should I take?",
        "Which bus is less crowded?",
        "Which bus arrives first?",
        "What is the fare from Erode to Coimbatore?",
      ],
      []
    );

  /* ========================================================
     ASK QUESTION
     ======================================================== */

  function askQuestion(
    question
  ) {
    const value =
      String(
        question || ""
      ).trim();

    if (!value) {
      return;
    }

    const answer =
      answerQuestion(
        value,
        buses || []
      );

    const suggestions =
      getFollowUpQuestions(
        value,
        buses || []
      );

    setMessages(
      (current) => [
        ...current,
        {
          type: "user",
          text: value,
        },
        {
          type: "assistant",
          title:
            answer.title,
          text:
            answer.body,
          suggestions,
        },
      ]
    );

    setQuery("");
  }

  /* ========================================================
     FORM SUBMIT
     ======================================================== */

  function handleSubmit(
    event
  ) {
    event.preventDefault();

    askQuestion(query);
  }

  /* ========================================================
     UI
     ======================================================== */

  return (
    <main className="payani-ai-page">
      <div className="payani-ai-page-intro">
        <div className="payani-ai-eyebrow">
          SMART TRAVEL ASSISTANT
        </div>

        <h1>
          PAYANI AI
        </h1>

        <p>
          Ask about buses, ETA,
          crowd levels, routes,
          fares, and the best
          option for your journey.
        </p>
      </div>

      <section className="payani-ai-card">
        <div className="payani-ai-card-header">
          <div className="payani-ai-brand-icon">
            <Bot size={22} />
          </div>

          <div>
            <strong>
              PAYANI AI Assistant
            </strong>

            <span>
              Powered by your live fleet data
            </span>
          </div>
        </div>

        <div className="payani-ai-chat">
          {messages.length === 0 ? (
            <div className="payani-ai-welcome">
              <Sparkles size={28} />

              <h2>
                How can I help you today?
              </h2>

              <p>
                I can compare live buses
                using ETA, route,
                current occupancy,
                and fare.
              </p>

              <div className="payani-ai-quick">
                {quickQuestions.map(
                  (question) => (
                    <button
                      type="button"
                      key={question}
                      onClick={() =>
                        askQuestion(
                          question
                        )
                      }
                    >
                      {question}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            messages.map(
              (
                message,
                index
              ) => (
                <div
                  key={`${message.type}-${index}`}
                  className={`payani-ai-message ${
                    message.type ===
                    "user"
                      ? "payani-ai-user"
                      : "payani-ai-assistant"
                  }`}
                >
                  <div className="payani-ai-message-icon">
                    {message.type ===
                    "user" ? (
                      <UserRound
                        size={14}
                      />
                    ) : (
                      <Bot
                        size={14}
                      />
                    )}
                  </div>

                  <div className="payani-ai-message-content">
                    {message.title && (
                      <strong>
                        {
                          message.title
                        }
                      </strong>
                    )}

                    <p>
                      {
                        message.text
                      }
                    </p>

                    {message
                      .suggestions
                      ?.length >
                      0 && (
                      <div className="payani-ai-followups">
                        <span>
                          Try asking:
                        </span>

                        <div className="payani-ai-followup-list">
                          {message.suggestions.map(
                            (
                              suggestion
                            ) => (
                              <button
                                type="button"
                                key={
                                  suggestion
                                }
                                onClick={() =>
                                  askQuestion(
                                    suggestion
                                  )
                                }
                              >
                                {
                                  suggestion
                                }
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>

        <form
          className="payani-ai-form"
          onSubmit={
            handleSubmit
          }
        >
          <input
            type="text"
            value={query}
            onChange={(
              event
            ) =>
              setQuery(
                event.target
                  .value
              )
            }
            placeholder="Ask PAYANI AI about your journey..."
          />

          <button
            type="submit"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>
      </section>
    </main>
  );
}