// ── Persistent storage — localStorage wrapper ─────────────────────────────────
// All operations are wrapped in try/catch so storage quota or private-browsing
// issues never crash the app.

const KEYS = {
  stats:   'tf_lifetime_stats',
  cache:   'tf_route_cache',
  history: 'tf_departure_history',
};

const ROUTE_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ── Lifetime gamification stats ───────────────────────────────────────────────
const DEFAULT_STATS = { timeSavedMin: 0, moneySavedRupees: 0, hotspotAvoided: 0, tripsCount: 0 };

export function getLifetimeStats() {
  try {
    return { ...DEFAULT_STATS, ...(JSON.parse(localStorage.getItem(KEYS.stats)) ?? {}) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function recordTrip({ timeSavedMin = 0, moneySavedRupees = 0, hotspotAvoided = 0 } = {}) {
  try {
    const s = getLifetimeStats();
    localStorage.setItem(KEYS.stats, JSON.stringify({
      timeSavedMin:     s.timeSavedMin     + Math.max(0, Math.round(timeSavedMin)),
      moneySavedRupees: s.moneySavedRupees + Math.max(0, Math.round(moneySavedRupees)),
      hotspotAvoided:   s.hotspotAvoided   + Math.max(0, hotspotAvoided),
      tripsCount:       s.tripsCount       + 1,
    }));
  } catch { /* storage full or blocked — silently ignore */ }
}

// ── Offline route cache ───────────────────────────────────────────────────────
export function cacheRoute(payload) {
  try {
    localStorage.setItem(KEYS.cache, JSON.stringify({ ...payload, cachedAt: Date.now() }));
  } catch { /* ignore */ }
}

export function getCachedRoute() {
  try {
    const raw = localStorage.getItem(KEYS.cache);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.cachedAt > ROUTE_CACHE_TTL_MS) return null; // stale
    return data;
  } catch {
    return null;
  }
}

// ── Smart departure learning ──────────────────────────────────────────────────
export function makeRouteKey(originAddress, destinationAddress) {
  const clean = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14);
  return `${clean(originAddress)}_${clean(destinationAddress)}`;
}

export function recordDeparture(routeKey) {
  try {
    const history = JSON.parse(localStorage.getItem(KEYS.history)) ?? [];
    history.push({ key: routeKey, hour: new Date().getHours(), ts: Date.now() });
    localStorage.setItem(KEYS.history, JSON.stringify(history.slice(-100)));
  } catch { /* ignore */ }
}

/**
 * Returns the most-used departure hour for a route, or null if < 3 data points.
 */
export function getSmartDeparture(routeKey) {
  try {
    const history = JSON.parse(localStorage.getItem(KEYS.history)) ?? [];
    const relevant = history.filter((h) => h.key === routeKey);
    if (relevant.length < 3) return null;

    const freq = {};
    relevant.forEach(({ hour }) => { freq[hour] = (freq[hour] ?? 0) + 1; });
    const [bestHourStr, count] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    const bestHour = parseInt(bestHourStr, 10);

    return {
      hour:    bestHour,
      label:   `${bestHour % 12 || 12}:00 ${bestHour < 12 ? 'AM' : 'PM'}`,
      count,
      total:   relevant.length,
    };
  } catch {
    return null;
  }
}
