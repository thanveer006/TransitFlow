import { HIGHWAY_HOTSPOTS as TRAFFIC_HOTSPOTS } from '../data/mobilityData';

// ── Traffic level based on time of day ───────────────────────────────────────
export function getTrafficLevel(date = new Date()) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeDecimal = hour + minute / 60;

  // Peak hours: 8–10 AM and 5–8 PM
  if ((timeDecimal >= 8 && timeDecimal < 10) || (timeDecimal >= 17 && timeDecimal < 20)) {
    return 'critical';
  }
  // Near-peak: 7–8 AM, 10–11 AM, 4–5 PM, 8–9 PM
  if ((timeDecimal >= 7 && timeDecimal < 8) ||
      (timeDecimal >= 10 && timeDecimal < 11) ||
      (timeDecimal >= 16 && timeDecimal < 17) ||
      (timeDecimal >= 20 && timeDecimal < 21)) {
    return 'high';
  }
  // Off-peak mid-day
  if (timeDecimal >= 11 && timeDecimal < 16) return 'medium';
  // Late night / early morning
  if (timeDecimal >= 22 || timeDecimal < 6) return 'low';

  return 'medium';
}

export const TRAFFIC_METADATA = {
  critical: { label: 'Critical',  color: '#ff1744', delayFactor: 2.8, description: 'Severe gridlock — consider transit' },
  high:     { label: 'Heavy',     color: '#ff6d00', delayFactor: 2.0, description: 'Heavy congestion on key routes' },
  medium:   { label: 'Moderate',  color: '#ffd600', delayFactor: 1.4, description: 'Moderate delays expected' },
  low:      { label: 'Clear',     color: '#00e676', delayFactor: 1.0, description: 'Roads are clear' },
};

// Estimate actual driving time given traffic level
export function adjustDrivingTime(freeFlowMin, trafficLevel) {
  return Math.ceil(freeFlowMin * TRAFFIC_METADATA[trafficLevel].delayFactor);
}

// Return hotspots near a route bounding box (lat/lng range check)
export function getHotspotsInArea(bounds) {
  if (!bounds) return TRAFFIC_HOTSPOTS;
  const { north, south, east, west } = bounds;
  return TRAFFIC_HOTSPOTS.filter(
    (h) => h.lat >= south && h.lat <= north && h.lng >= west && h.lng <= east
  );
}

// Determine if a specific route is going through a known hotspot
export function routePassesThroughHotspot(encodedPolyline) {
  if (!encodedPolyline || !window.google?.maps?.geometry) return false;
  try {
    const path = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
    for (const hotspot of TRAFFIC_HOTSPOTS) {
      for (const point of path) {
        const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
          point,
          new window.google.maps.LatLng(hotspot.lat, hotspot.lng)
        );
        if (dist < 800) return true; // within 800 m
      }
    }
  } catch { /* ignore */ }
  return false;
}
