import { useCallback, useEffect, useState } from "react";
import { getLiveBuses } from "../services/api";

export function useLiveBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBuses = useCallback(async () => {
    try {
      setError("");

      const liveBuses = await getLiveBuses();

      // The latest API response completely replaces the previous fleet.
      setBuses(liveBuses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load live buses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuses();

    const interval = setInterval(loadBuses, 15000);

    return () => clearInterval(interval);
  }, [loadBuses]);

  return {
    buses,
    loading,
    error,
    refresh: loadBuses,
  };
}