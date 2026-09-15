import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLiveBuses } from "../hooks/useLiveBuses";
import { useWishlist } from "./WishlistContext";

const STORAGE_KEY = "payani_notifications_v1";
const COOLDOWN_MS = 30 * 60 * 1000;

const NotificationContext = createContext(null);

function readStoredNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredNotifications(notifications) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications)
    );
  } catch {
    // Ignore localStorage failures.
  }
}

function getBusKey(bus) {
  if (!bus) return "";

  return String(
    bus.bus_id ??
      bus.bus_number ??
      bus.bus_name ??
      bus.trip_id ??
      ""
  );
}

function getBusLabel(bus) {
  return (
    bus?.bus_name ||
    bus?.bus_number ||
    "Your saved bus"
  );
}

function getOccupancy(bus) {
  const value = Number(bus?.occupancy_percent);

  return Number.isFinite(value) ? value : 0;
}

function getEta(bus) {
  const value = Number(bus?.eta_minutes);

  return Number.isFinite(value) ? value : null;
}

function getNotificationKey(type, bus) {
  return `${type}:${getBusKey(bus)}`;
}

function isRecentlyGenerated(notifications, key) {
  const now = Date.now();

  return notifications.some((item) => {
    if (item.event_key !== key) {
      return false;
    }

    const createdAt = new Date(
      item.created_at
    ).getTime();

    return (
      Number.isFinite(createdAt) &&
      now - createdAt < COOLDOWN_MS
    );
  });
}

function buildNotifications(
  buses,
  wishlist,
  existingNotifications
) {
  if (!Array.isArray(buses) || !buses.length) {
    return [];
  }

  if (!Array.isArray(wishlist) || !wishlist.length) {
    return [];
  }

  const wishlistSet = new Set(
    wishlist.map(String)
  );

  const savedBuses = buses.filter((bus) =>
    wishlistSet.has(getBusKey(bus))
  );

  const generated = [];

  for (const bus of savedBuses) {
    const busName = getBusLabel(bus);
    const occupancy = getOccupancy(bus);
    const eta = getEta(bus);

    const route =
      bus?.route_name ||
      `${bus?.source || ""} → ${
        bus?.destination || ""
      }`;

    const tripId = bus?.trip_id ?? null;

    /*
     * CRITICAL CROWD
     */
    if (occupancy >= 95) {
      const eventKey = getNotificationKey(
        "critical_crowd",
        bus
      );

      if (
        !isRecentlyGenerated(
          existingNotifications,
          eventKey
        )
      ) {
        generated.push({
          id: `${eventKey}:${Date.now()}`,
          event_key: eventKey,
          type: "critical_crowd",
          title: `${busName} is critically crowded`,
          message: `Current occupancy is about ${Math.round(
            occupancy
          )}%. Consider another bus if available.`,
          bus_name: busName,
          bus_id: getBusKey(bus),
          trip_id: tripId,
          route_name: route,
          created_at: new Date().toISOString(),
          read: false,
        });
      }

      continue;
    }

    /*
     * HIGH CROWD
     */
    if (occupancy >= 80) {
      const eventKey = getNotificationKey(
        "high_crowd",
        bus
      );

      if (
        !isRecentlyGenerated(
          existingNotifications,
          eventKey
        )
      ) {
        generated.push({
          id: `${eventKey}:${Date.now()}`,
          event_key: eventKey,
          type: "high_crowd",
          title: `${busName} is getting crowded`,
          message: `Current occupancy is about ${Math.round(
            occupancy
          )}% on ${route}.`,
          bus_name: busName,
          bus_id: getBusKey(bus),
          trip_id: tripId,
          route_name: route,
          created_at: new Date().toISOString(),
          read: false,
        });
      }
    }

    /*
     * APPROACHING
     */
    if (
      eta !== null &&
      eta >= 0 &&
      eta <= 5
    ) {
      const eventKey = getNotificationKey(
        "approaching",
        bus
      );

      if (
        !isRecentlyGenerated(
          existingNotifications,
          eventKey
        )
      ) {
        generated.push({
          id: `${eventKey}:${Date.now()}`,
          event_key: eventKey,
          type: "approaching",
          title: `${busName} is approaching`,
          message:
            eta === 0
              ? "Your saved bus is arriving now."
              : `Your saved bus is about ${Math.round(
                  eta
                )} minutes away.`,
          bus_name: busName,
          bus_id: getBusKey(bus),
          trip_id: tripId,
          route_name: route,
          created_at: new Date().toISOString(),
          read: false,
        });
      }
    }
  }

  return generated;
}

export function NotificationProvider({
  children,
}) {
  const { buses } = useLiveBuses();
  const { wishlist } = useWishlist();

  const [notifications, setNotifications] =
    useState(readStoredNotifications);

  useEffect(() => {
    writeStoredNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!buses?.length || !wishlist?.length) {
      return;
    }

    setNotifications((current) => {
      const newNotifications =
        buildNotifications(
          buses,
          wishlist,
          current
        );

      if (!newNotifications.length) {
        return current;
      }

      return [
        ...newNotifications,
        ...current,
      ].slice(0, 50);
    });
  }, [buses, wishlist]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (item) => !item.read
      ).length,
    [notifications]
  );

  const markAsRead = useCallback((id) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
            }
          : item
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback(
    (id) => {
      setNotifications((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      removeNotification,
    }),
    [
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      removeNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(
    NotificationContext
  );

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}