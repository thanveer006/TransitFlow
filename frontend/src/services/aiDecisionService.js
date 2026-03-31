import { TRAFFIC_METADATA } from './trafficService';
import { getWeatherAlert } from './weatherService';
import { TRANSPORT_OPTIONS } from '../data/mobilityData';

// ── Core AI Decision Engine ───────────────────────────────────────────────────
// Returns a recommendation object for the UI to render.
export function makeDecision({ primaryRoute, altRoute, trafficLevel, weather }) {
  const traffic = TRAFFIC_METADATA[trafficLevel];
  const weatherAlert = getWeatherAlert(weather);
  const isWeatherBad = weatherAlert?.level === 'danger' || weatherAlert?.level === 'warning';

  // No route data yet
  if (!primaryRoute) return null;

  const primaryMin  = primaryRoute.durationMin;
  const altMin      = altRoute?.durationMin ?? null;
  const altSaving   = altMin ? primaryMin - altMin : 0;

  // ── Decision tree ─────────────────────────────────────────────────────────
  // Case 1: Alternative road route is meaningfully faster
  if (altMin && altSaving >= 5 && trafficLevel !== 'low') {
    return {
      type: 'alternate_route',
      severity: trafficLevel === 'critical' ? 'danger' : 'warning',
      headline: `Switch to alternate route — save ${altSaving} min`,
      reason: `Heavy traffic on primary route (${traffic.description}). The alternate route is ${altSaving} minutes faster.`,
      savingsMin: altSaving,
      transportSuggestion: null,
      icon: '🔀',
    };
  }

  // Case 2: Traffic is critical and no good alt route — suggest transit
  if ((trafficLevel === 'critical' || trafficLevel === 'high') && (!altMin || altSaving < 5)) {
    const bestTransit = pickBestTransit(weather);
    return {
      type: 'public_transport',
      severity: 'danger',
      headline: `Take public transport — congestion ahead`,
      reason: `No faster driving route found. ${traffic.description}. ${bestTransit.name} can get you there in ~${bestTransit.avgDurationMin} min.`,
      savingsMin: primaryMin - bestTransit.avgDurationMin,
      transportSuggestion: bestTransit,
      icon: '🚇',
    };
  }

  // Case 3: Weather + moderate traffic — nudge to transit
  if (isWeatherBad && trafficLevel === 'medium') {
    const bestTransit = pickBestTransit(weather);
    return {
      type: 'weather_advisory',
      severity: 'warning',
      headline: `Weather + traffic — transit recommended`,
      reason: `${weatherAlert.message} Public transport avoids slippery roads and offers shelter.`,
      savingsMin: null,
      transportSuggestion: bestTransit,
      icon: '🌧️',
    };
  }

  // Case 4: Roads are clear
  return {
    type: 'drive_recommended',
    severity: 'success',
    headline: `Drive ahead — roads are clear`,
    reason: `Traffic is ${traffic.label.toLowerCase()} on your route. ${primaryMin} min estimated journey time.`,
    savingsMin: null,
    transportSuggestion: null,
    icon: '✅',
  };
}

function pickBestTransit(weather) {
  const weatherAlert = getWeatherAlert(weather);
  const isBadWeather = weatherAlert?.level === 'danger' || weatherAlert?.level === 'warning';

  // Prefer covered transport in bad weather
  if (isBadWeather) {
    return TRANSPORT_OPTIONS.find((t) => t.type === 'metro') ?? TRANSPORT_OPTIONS[0];
  }

  // Otherwise pick fastest (metro > bus > auto)
  return TRANSPORT_OPTIONS.sort((a, b) => a.avgDurationMin - b.avgDurationMin)[0];
}

// Enrich transport options with real-time-ish adjustments
export function getEnrichedTransportOptions(primaryDurationMin, weather) {
  const weatherAlert = getWeatherAlert(weather);
  const isBadWeather = weatherAlert?.level === 'danger';

  return TRANSPORT_OPTIONS.map((opt) => {
    const totalMin = opt.walkToStopMin + opt.avgDurationMin;
    const fasterThanDriving = totalMin < primaryDurationMin;
    return {
      ...opt,
      totalMin,
      fasterThanDriving,
      recommended: fasterThanDriving || (isBadWeather && opt.type !== 'auto'),
      // Simulate dynamic next departure
      nextDeparturMin: opt.nextDeparturMin + Math.floor(Math.random() * 4),
    };
  });
}
