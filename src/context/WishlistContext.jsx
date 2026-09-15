import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "payani_wishlist_v1";

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

function readStoredWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(readStoredWishlist);

  function saveWishlist(next) {
    setWishlist(next);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );
  }

  function isWishlisted(bus) {
    const key = getBusKey(bus);
    return key !== "" && wishlist.includes(key);
  }

  function toggleWishlist(bus) {
    const key = getBusKey(bus);
    if (!key) return;

    const next = wishlist.includes(key)
      ? wishlist.filter((item) => item !== key)
      : [...wishlist, key];

    saveWishlist(next);
  }

  function removeFromWishlist(bus) {
    const key = getBusKey(bus);
    if (!key) return;

    saveWishlist(
      wishlist.filter((item) => item !== key)
    );
  }

  function removeWishlistKey(key) {
    const value = String(key || "");
    if (!value) return;

    saveWishlist(
      wishlist.filter((item) => item !== value)
    );
  }

  const value = useMemo(
    () => ({
      wishlist,
      wishlistCount: wishlist.length,
      getBusKey,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
      removeWishlistKey,
    }),
    [wishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}
