const SOS_API_URL = import.meta.env.VITE_SOS_API_URL;

export async function createSOSIncident({
  bus,
  emergencyType = "general",
  passengerMessage = "",
}) {
  if (!SOS_API_URL) {
    throw new Error("SOS API URL is not configured.");
  }

  if (!bus) {
    throw new Error("No live bus is available for this SOS request.");
  }

  const payload = {
    emergency_type: emergencyType,

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

    passenger_message: passengerMessage || null,
  };

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

  return data;
}