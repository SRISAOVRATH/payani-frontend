const API_URL = import.meta.env.VITE_LIVE_API_URL;

export async function getLiveBuses() {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Live API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.live)) {
    throw new Error("Invalid live API response");
  }

  return data.live;
}