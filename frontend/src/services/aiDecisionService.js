import { TRAFFIC_METADATA } from './trafficService';
import { getWeatherAlert } from './weatherService';
import { TRANSPORT_OPTIONS } from '../data/mobilityData';

const FUEL_PER_KM = 10; // ₹10/km — fuel + average vehicle wear

// ── Core AI Decision Engine ───────────────────────────────────────────────────
export function makeDecision({ primaryRoute, altRoute, trafficLevel, weather, emergencyMode = false }) {
  const traffic = TRAFFIC_METADATA[trafficLevel];
  const weatherAlert = getWeatherAlert(weather);
  const isWeatherBad = weatherAlert?.level === 'danger' || weatherAlert?.level === 'warning';

  if (!primaryRoute) return null;

  const primaryMin = primaryRoute.durationMin;
  const altMin     = altRoute?.durationMin ?? null;
  const altSaving  = altMin ? primaryMin - altMin : 0;

  // Emergency override — always fastest, no transit suggestions
  if (emergencyMode) {
    return {
      type:               'emergency',
      severity:           'danger',
      headline:           `Emergency mode — fastest route locked in`,
      reason:             `Emergency override active. Primary route selected regardless of traffic. ${primaryMin} min estimated.`,
      savingsMin:         null,
      transportSuggestion: null,
      icon:               '🚨',
    };
  }

  // Case 1: Alternate road route is meaningfully faster
  if (altMin && altSaving >= 5 && trafficLevel !== 'low') {
    return {
      type:               'alternate_route',
      severity:           trafficLevel === 'critical' ? 'danger' : 'warning',
      headline:           `Switch to alternate route — save ${altSaving} min`,
      reason:             `Heavy traffic on primary route (${traffic.description}). The alternate route is ${altSaving} minutes faster.`,
      savingsMin:         altSaving,
      transportSuggestion: null,
      icon:               '🔀',
    };
  }

  // Case 2: Critical traffic, no good alt — suggest transit
  if ((trafficLevel === 'critical' || trafficLevel === 'high') && (!altMin || altSaving < 5)) {
    const bestTransit = pickBestTransit(weather);
    return {
      type:               'public_transport',
      severity:           'danger',
      headline:           `Take public transport — congestion ahead`,
      reason:             `No faster driving route found. ${traffic.description}. ${bestTransit.name} can get you there in ~${bestTransit.avgDurationMin} min.`,
      savingsMin:         primaryMin - bestTransit.avgDurationMin,
      transportSuggestion: bestTransit,
      icon:               '🚇',
    };
  }

  // Case 3: Weather + moderate traffic
  if (isWeatherBad && trafficLevel === 'medium') {
    const bestTransit = pickBestTransit(weather);
    return {
      type:               'weather_advisory',
      severity:           'warning',
      headline:           `Weather + traffic — transit recommended`,
      reason:             `${weatherAlert.message} Public transport avoids slippery roads and offers shelter.`,
      savingsMin:         null,
      transportSuggestion: bestTransit,
      icon:               '🌧️',
    };
  }

  // Case 4: All clear
  return {
    type:               'drive_recommended',
    severity:           'success',
    headline:           `Drive ahead — roads are clear`,
    reason:             `Traffic is ${traffic.label.toLowerCase()} on your route. ${primaryMin} min estimated journey time.`,
    savingsMin:         null,
    transportSuggestion: null,
    icon:               '✅',
  };
}

function pickBestTransit(weather) {
  const weatherAlert = getWeatherAlert(weather);
  const isBadWeather = weatherAlert?.level === 'danger' || weatherAlert?.level === 'warning';
  if (isBadWeather) {
    return TRANSPORT_OPTIONS.find((t) => t.type === 'metro') ?? TRANSPORT_OPTIONS[0];
  }
  return [...TRANSPORT_OPTIONS].sort((a, b) => a.avgDurationMin - b.avgDurationMin)[0];
}

// ── Multi-Route Comparison ────────────────────────────────────────────────────
// Returns 3 route cards: Fastest · Cheapest · AI Smart Hybrid
export function buildRouteComparison({ primaryRoute, altRoute, trafficLevel, weather, emergencyMode = false }) {
  const decision = makeDecision({ primaryRoute, altRoute, trafficLevel, weather, emergencyMode });
  const isTransit = decision?.type === 'public_transport' || decision?.type === 'weather_advisory';
  const transit   = decision?.transportSuggestion;

  const primaryCost = Math.round(primaryRoute.distanceKm * FUEL_PER_KM);

  // --- Fastest card (always primary — Routes API returns traffic-aware fastest) ---
  const fastest = {
    id:          'fastest',
    label:       'Fastest Route',
    emoji:       '⚡',
    durationMin: primaryRoute.durationMin,
    distanceKm:  primaryRoute.distanceKm,
    costRupees:  primaryCost,
    trafficLevel,
    tag:         null,
    mode:        'drive',
  };

  // --- Cheapest card (shorter distance = less fuel, may be the alt) ---
  const cheapBase = altRoute && altRoute.distanceKm < primaryRoute.distanceKm ? altRoute : primaryRoute;
  const cheapest = {
    id:          'cheapest',
    label:       'Cheapest Route',
    emoji:       '💰',
    durationMin: cheapBase.durationMin,
    distanceKm:  cheapBase.distanceKm,
    costRupees:  Math.round(cheapBase.distanceKm * FUEL_PER_KM),
    trafficLevel,
    tag:         null,
    mode:        'drive',
  };

  // --- AI Smart Hybrid card ---
  let aiSmart;
  if (isTransit && transit) {
    aiSmart = {
      id:          'ai_smart',
      label:       'AI Smart Hybrid',
      emoji:       '🧠',
      durationMin: (transit.walkToStopMin ?? 5) + (transit.avgDurationMin ?? 30),
      distanceKm:  null,
      costRupees:  40, // standard public transport fare (KSRTC/Metro)
      trafficLevel: 'low',
      tag:         'ai',
      mode:        'transit',
      transitName: transit.name,
    };
  } else {
    // AI picks whichever drive route is better overall
    const bestDrive = altRoute && altRoute.durationMin < primaryRoute.durationMin ? altRoute : primaryRoute;
    aiSmart = {
      id:          'ai_smart',
      label:       'AI Smart Hybrid',
      emoji:       '🧠',
      durationMin: bestDrive.durationMin,
      distanceKm:  bestDrive.distanceKm,
      costRupees:  Math.round(bestDrive.distanceKm * FUEL_PER_KM),
      trafficLevel,
      tag:         'ai',
      mode:        'drive',
    };
  }

  // Auto-tag fastest / cheapest among the three
  const cards = [fastest, cheapest, aiSmart];
  const minDur  = Math.min(...cards.map((c) => c.durationMin));
  const minCost = Math.min(...cards.map((c) => c.costRupees));
  cards.forEach((c) => {
    if (!c.tag && c.durationMin === minDur)  c.tag = 'fastest';
    if (!c.tag && c.costRupees  === minCost) c.tag = 'cheapest';
  });

  return cards;
}

// ── AI Transparency Report ────────────────────────────────────────────────────
// Returns an array of factors that explain why this decision was reached.
export function buildTransparencyReport({ primaryRoute, altRoute, trafficLevel, weather, decision }) {
  const traffic      = TRAFFIC_METADATA[trafficLevel];
  const weatherAlert = getWeatherAlert(weather);
  const points       = [];

  // Factor 1: Traffic conditions
  points.push({
    factor:  'Traffic conditions',
    value:   traffic?.label ?? '—',
    impact:  trafficLevel === 'critical' || trafficLevel === 'high' ? 'negative' : trafficLevel === 'medium' ? 'warning' : 'positive',
    detail:  traffic?.description ?? 'No traffic data available.',
    icon:    '🚦',
  });

  // Factor 2: Route time delta
  if (altRoute) {
    const delta = primaryRoute.durationMin - altRoute.durationMin;
    points.push({
      factor: 'Route comparison',
      value:  delta > 0 ? `Alt saves ${delta} min` : delta < 0 ? `Primary saves ${Math.abs(delta)} min` : 'Equal duration',
      impact: delta > 0 ? 'positive' : 'neutral',
      detail: `Primary: ${primaryRoute.durationMin} min · ${primaryRoute.distanceKm} km  |  Alt: ${altRoute.durationMin} min · ${altRoute.distanceKm} km`,
      icon:   '🗺️',
    });
  }

  // Factor 3: Cost delta
  const primaryCost = Math.round(primaryRoute.distanceKm * FUEL_PER_KM);
  const altCost     = altRoute ? Math.round(altRoute.distanceKm * FUEL_PER_KM) : null;
  if (altCost !== null) {
    const saving = primaryCost - altCost;
    points.push({
      factor: 'Fuel cost',
      value:  saving > 0 ? `Save ₹${saving} via alt` : saving < 0 ? `Alt costs ₹${Math.abs(saving)} more` : 'Same cost',
      impact: saving > 0 ? 'positive' : 'neutral',
      detail: `Primary ≈ ₹${primaryCost}  |  Alt ≈ ₹${altCost} (at ₹${FUEL_PER_KM}/km)`,
      icon:   '⛽',
    });
  }

  // Factor 4: Weather
  if (weatherAlert) {
    points.push({
      factor: 'Weather impact',
      value:  weatherAlert.level === 'danger' ? 'High risk' : 'Advisory',
      impact: weatherAlert.level === 'danger' ? 'negative' : 'warning',
      detail: weatherAlert.message,
      icon:   '🌦️',
    });
  }

  // Factor 5: AI decision outcome
  if (decision) {
    const impactMap = { success: 'positive', warning: 'warning', danger: 'negative', info: 'neutral' };
    points.push({
      factor: 'AI verdict',
      value:  decision.headline,
      impact: impactMap[decision.severity] ?? 'neutral',
      detail: decision.reason,
      icon:   decision.icon ?? '🧠',
    });
  }

  return points;
}

// ── Enriched transport options ────────────────────────────────────────────────
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
      recommended:      fasterThanDriving || (isBadWeather && opt.type !== 'auto'),
      nextDeparturMin:  opt.nextDeparturMin + Math.floor(Math.random() * 4),
    };
  });
}
