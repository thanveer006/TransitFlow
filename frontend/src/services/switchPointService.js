import {
  TRANSIT_HUBS,
  FUEL_COST_PER_KM,
  PARKING_COST_PER_HOUR,
  AVG_PARKING_HOURS,
} from '../data/kochiData';

// If driving is MORE than THRESHOLD minutes slower than transit → trigger escape hatch
const SWITCH_THRESHOLD_MIN = 10;

// ── Switch Point Detection ────────────────────────────────────────────────────
export function detectSwitchPoint(drivingTimeMin, route) {
  const hub = TRANSIT_HUBS.find((h) => h.id === route.escapeHubId);
  if (!hub) return null;

  const transitTimeMin = calcTransitTime(route, hub);
  const triggered = drivingTimeMin > transitTimeMin + SWITCH_THRESHOLD_MIN;
  const timeSavingsMin = drivingTimeMin - transitTimeMin;

  return {
    triggered,
    hub,
    drivingTimeMin,
    transitTimeMin,
    timeSavingsMin,
  };
}

// Transit time = walk to hub + metro/bus travel + walk to destination
function calcTransitTime(route, hub) {
  const walkToHub = hub.walkFromBottleneck ?? 7;    // minutes
  const transitTravel = route.baseTransitTravelMin;  // metro/bus leg
  const walkToDestination = 5;                       // avg last-mile walk
  return walkToHub + transitTravel + walkToDestination;
}

// ── Cost Calculations ─────────────────────────────────────────────────────────
export function calcDrivingCost(distanceKm) {
  const fuel = Math.round(distanceKm * FUEL_COST_PER_KM);
  const parking = PARKING_COST_PER_HOUR * AVG_PARKING_HOURS;
  return { fuel, parking, total: fuel + parking };
}

export function calcTransitCost(hub) {
  // Return full-day cost: transit ticket × 2 (return trip)
  return hub.ticketPrice * 2;
}

export function calcMoneySavings(drivingCost, transitCost) {
  return drivingCost.total - transitCost;
}
