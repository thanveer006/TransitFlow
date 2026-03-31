import { useState, useCallback, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Bot } from 'lucide-react';

import MapView from './MapView';
import LeftPanel from './LeftPanel';
import WeatherWidget from './WeatherWidget';
import TrafficAlert from './TrafficAlert';
import TransportDrawer from './TransportDrawer';
import ChatDrawer from './ChatDrawer';

import { fetchWeather } from '../services/weatherService';
import { getTrafficLevel, getHotspotsInArea } from '../services/trafficService';
import { makeDecision, buildRouteComparison, buildTransparencyReport, getEnrichedTransportOptions } from '../services/aiDecisionService';
import { speak, buildVoiceScript } from '../services/voiceService';
import { cacheRoute, getCachedRoute, recordTrip, recordDeparture, getSmartDeparture, makeRouteKey, getLifetimeStats } from '../services/storageService';
import { DEFAULT_CENTER, KERALA_DISTRICTS, DISTRICT_WEATHER_ALERTS } from '../data/mobilityData';

// ── Stable library reference (outside component) ─────────────────────────────
const MAPS_LIBRARIES = ['geometry', 'places'];
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// ── Routes API fetch ──────────────────────────────────────────────────────────
async function fetchRoutes(origin, destination) {
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': MAPS_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: true,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? res.statusText;
    throw new Error(`Routes API ${res.status}: ${msg}`);
  }
  return res.json();
}

function parseRoute(routeData) {
  if (!routeData) return null;
  const durationSec = parseInt(routeData.duration?.replace('s', '') ?? '0', 10);
  return {
    durationMin: Math.ceil(durationSec / 60),
    distanceKm: +(((routeData.distanceMeters ?? 0) / 1000).toFixed(1)),
    polyline: routeData.polyline?.encodedPolyline ?? null,
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [journey, setJourney] = useState(null);
  const [trafficLevel, setTrafficLevel] = useState(null);
  const [showTransport, setShowTransport] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [districtAlert, setDistrictAlert] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // ── Emergency mode ────────────────────────────────────────────────────────
  const [emergencyMode, setEmergencyMode] = useState(false);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // ── Gamification — loaded once, refreshed after each trip ────────────────
  const [lifetimeStats, setLifetimeStats] = useState(() => getLifetimeStats());

  // ── Smart learning ────────────────────────────────────────────────────────
  const [smartDeparture, setSmartDeparture] = useState(null);

  const transportTimerRef = useRef(null);
  useEffect(() => () => { if (transportTimerRef.current) clearTimeout(transportTimerRef.current); }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_KEY,
    libraries: MAPS_LIBRARIES,
    version: 'beta',
  });

  // ── Network status ────────────────────────────────────────────────────────
  useEffect(() => {
    const setOnline = () => setIsOffline(false);
    const setOffline = () => setIsOffline(true);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    setIsOffline(!navigator.onLine);
    return () => { window.removeEventListener('online', setOnline); window.removeEventListener('offline', setOffline); };
  }, []);

  // ── Geolocation ───────────────────────────────────────────────────────────
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setOrigin({ address: 'My Current Location', lat: coords.latitude, lng: coords.longitude }),
      () => setOrigin({ address: 'Ernakulam, Kochi', lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng })
    );
  }, []);

  // ── Main route analysis ───────────────────────────────────────────────────
  const handleGetRoute = useCallback(async () => {
    if (!isLoaded || !origin || !destination) return;

    setIsPlanning(true);
    setJourney(null);
    setShowTransport(false);
    setDistrictAlert(null);
    setRouteError(null);

    try {
      // 1. Weather
      const wx = await fetchWeather(origin.lat, origin.lng);
      setWeather(wx);

      // 2. Routes
      let primaryRoute, altRoute;
      try {
        const data = await fetchRoutes(origin, destination);
        const routes = data.routes ?? [];
        primaryRoute = parseRoute(routes[0]);
        altRoute = parseRoute(routes[1] ?? null);
        if (!primaryRoute) throw new Error('No route returned');
      } catch (routeErr) {
        // Offline fallback — serve cached route
        const cached = getCachedRoute();
        if (cached?.primaryRoute) {
          primaryRoute = cached.primaryRoute;
          altRoute = cached.altRoute ?? null;
          setRouteError('Offline — showing last cached route.');
          setIsOffline(true);
        } else {
          throw routeErr;
        }
      }

      // 3. Traffic
      const level = getTrafficLevel();
      setTrafficLevel(level);

      // 4. AI Decision (respects emergencyMode)
      const decision = makeDecision({ primaryRoute, altRoute, trafficLevel: level, weather: wx, emergencyMode });

      // 5. Route comparison + transparency
      const routeComparison = buildRouteComparison({ primaryRoute, altRoute, trafficLevel: level, weather: wx, emergencyMode });
      const transparencyPoints = buildTransparencyReport({ primaryRoute, altRoute, trafficLevel: level, weather: wx, decision });

      // 6. Transport options
      const transportOptions = getEnrichedTransportOptions(primaryRoute.durationMin, wx);

      // 7. Hotspots
      const bounds = {
        south: Math.min(origin.lat, destination.lat) - 0.15,
        north: Math.max(origin.lat, destination.lat) + 0.15,
        west: Math.min(origin.lng, destination.lng) - 0.15,
        east: Math.max(origin.lng, destination.lng) + 0.15,
      };
      const activeHotspots = getHotspotsInArea(bounds);

      // 8. District geo-risk
      const destDistrict = KERALA_DISTRICTS.reduce((closest, d) => {
        const dist = Math.hypot(d.lat - destination.lat, d.lng - destination.lng);
        return dist < Math.hypot(closest.lat - destination.lat, closest.lng - destination.lng) ? d : closest;
      }, KERALA_DISTRICTS[0]);
      setDistrictAlert(DISTRICT_WEATHER_ALERTS[destDistrict.id] ?? null);

      // 9. Persist to storage
      cacheRoute({ primaryRoute, altRoute, origin, destination, trafficLevel: level });
      const routeKey = makeRouteKey(origin.address, destination.address);
      recordDeparture(routeKey);
      const timeSaved = Math.max(0, decision?.savingsMin ?? 0);
      const moneySaved = altRoute ? Math.max(0, Math.round((primaryRoute.distanceKm - altRoute.distanceKm) * 10)) : 0;
      recordTrip({ timeSavedMin: timeSaved, moneySavedRupees: moneySaved, hotspotAvoided: activeHotspots.length });
      setLifetimeStats(getLifetimeStats());

      // 10. Smart departure hint
      const departure = getSmartDeparture(routeKey);
      setSmartDeparture(departure);

      // 11. Timestamp
      setLastUpdated(new Date());

      setJourney({ primaryRoute, altRoute, decision, weather: wx, transportOptions, activeHotspots, destDistrict, routeComparison, transparencyPoints });

      // Auto-open transport drawer
      if (decision?.type === 'public_transport') {
        if (transportTimerRef.current) clearTimeout(transportTimerRef.current);
        transportTimerRef.current = setTimeout(() => setShowTransport(true), 800);
      }

      // 12. Voice announcement
      if (voiceEnabled) {
        const script = buildVoiceScript({ decision, primaryRoute, altRoute, weather: wx, emergencyMode });
        setTimeout(() => speak(script), 600);
      }

    } catch (err) {
      console.error('Route planning failed:', err);
      setRouteError(
        err.message?.includes('Routes API')
          ? `Could not fetch route — ${err.message}. Ensure the Routes API is enabled for your key.`
          : 'Route planning failed. Check your internet connection and try again.'
      );
    } finally {
      setIsPlanning(false);
    }
  }, [isLoaded, origin, destination, emergencyMode, voiceEnabled]);

  // ── Loading / error screens ───────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50 text-center px-8">
        <div>
          <p className="text-xl font-bold text-red-600 mb-2">Map failed to load</p>
          <p className="text-sm text-gray-600">
            Check <code className="text-blue-600">VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code>
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50 gap-5">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#1a73e8] rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-bold tracking-wide">TransitFlow</p>
          <p className="text-gray-500 text-sm tracking-widest uppercase mt-1">Loading…</p>
        </div>
      </div>
    );
  }

  const journeyContext = journey ? { origin, destination, trafficLevel, weather: journey.weather, decision: journey.decision } : null;

  return (
    <div className={`w-screen h-screen overflow-hidden relative bg-white transition-all duration-500 ${emergencyMode ? 'ring-2 ring-inset ring-red-500' : ''}`}>

      {/* Emergency mode glow border */}
      {emergencyMode && (
        <div className="absolute inset-0 pointer-events-none z-50 ring-4 ring-inset ring-red-500/20" />
      )}

      {/* ── Full-screen map ───────────────────────────────────────────── */}
      <MapView
        origin={origin}
        destination={destination}
        primaryPolyline={journey?.primaryRoute?.polyline}
        altPolyline={journey?.altRoute?.polyline}
        trafficLevel={trafficLevel}
        activeHotspots={journey?.activeHotspots}
        emergencyMode={emergencyMode}
      />

      {/* ── Left sidebar ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 h-full z-10 pointer-events-none">
        <LeftPanel
          origin={origin}
          destination={destination}
          onOriginSelect={setOrigin}
          onDestinationSelect={setDestination}
          onUseMyLocation={handleUseMyLocation}
          onGetRoute={handleGetRoute}
          isPlanning={isPlanning}
          journey={journey}
          trafficLevel={trafficLevel}
          districtAlert={districtAlert}
          routeError={routeError}
          onShowTransport={() => setShowTransport(true)}
          emergencyMode={emergencyMode}
          onToggleEmergency={() => setEmergencyMode((v) => !v)}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled((v) => !v)}
          lastUpdated={lastUpdated}
          isOffline={isOffline}
          lifetimeStats={lifetimeStats}
          smartDeparture={smartDeparture}
        />
      </div>

      {/* ── Weather widget (top-right) ────────────────────────────────── */}
      {!chatOpen && <WeatherWidget weather={weather} />}

      {/* ── Traffic alert banner (top-centre) ────────────────────────── */}
      <TrafficAlert
        trafficLevel={trafficLevel}
        hotspots={journey?.activeHotspots}
        decision={journey?.decision}
        onViewOptions={() => setShowTransport(true)}
      />

      {/* ── Offline banner ────────────────────────────────────────────── */}
      {isOffline && !journey && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-yellow-50 border border-yellow-200 shadow-md pointer-events-none animate-fade-up">
          <p className="text-xs font-bold text-yellow-700 tracking-wider">📡 Offline — cached route shown</p>
        </div>
      )}

      {/* ── Transport drawer (bottom) ─────────────────────────────────── */}
      {showTransport && journey?.transportOptions && (
        <TransportDrawer
          options={journey.transportOptions}
          primaryDurationMin={journey.primaryRoute?.durationMin}
          onClose={() => setShowTransport(false)}
        />
      )}

      {/* ── Chat drawer (right) ───────────────────────────────────────── */}
      <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} journeyContext={journeyContext} />

      {/* ── Chat toggle ───────────────────────────────────────────────── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute bottom-6 right-6 z-20 w-14 h-14 rounded-full bg-[#1a73e8] shadow-lg flex items-center justify-center hover:bg-[#1557b0] hover:-translate-y-1 transition-all duration-300 pointer-events-auto"
          title="Chat with Mova AI"
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}
