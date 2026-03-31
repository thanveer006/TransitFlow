import { useState, useCallback, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Bot } from 'lucide-react';

import MapView        from './MapView';
import LeftPanel      from './LeftPanel';
import WeatherWidget  from './WeatherWidget';
import TrafficAlert   from './TrafficAlert';
import TransportDrawer from './TransportDrawer';
import ChatDrawer     from './ChatDrawer';

import { fetchWeather }                          from '../services/weatherService';
import { getTrafficLevel, getHotspotsInArea }    from '../services/trafficService';
import { makeDecision, getEnrichedTransportOptions } from '../services/aiDecisionService';
import { DEFAULT_CENTER, KERALA_DISTRICTS, DISTRICT_WEATHER_ALERTS } from '../data/mobilityData';

// ── Stable library reference (outside component) ─────────────────────────────
const MAPS_LIBRARIES = ['geometry', 'places'];
const MAPS_KEY       = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// ── Routes API fetch ──────────────────────────────────────────────────────────
async function fetchRoutes(origin, destination) {
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': MAPS_KEY,
      'X-Goog-FieldMask': [
        'routes.duration',
        'routes.distanceMeters',
        'routes.polyline.encodedPolyline',
      ].join(','),
    },
    body: JSON.stringify({
      origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      departureTime: new Date().toISOString(),
      computeAlternativeRoutes: true,
    }),
  });
  if (!res.ok) throw new Error(`Routes API ${res.status}`);
  return res.json();
}

function parseRoute(routeData) {
  if (!routeData) return null;
  const durationSec = parseInt(routeData.duration?.replace('s', '') ?? '0', 10);
  return {
    durationMin:  Math.ceil(durationSec / 60),
    distanceKm:   +(((routeData.distanceMeters ?? 0) / 1000).toFixed(1)),
    polyline:     routeData.polyline?.encodedPolyline ?? null,
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [origin,      setOrigin]      = useState(null);
  const [destination, setDestination] = useState(null);
  const [isPlanning,  setIsPlanning]  = useState(false);
  const [journey,       setJourney]       = useState(null);
  const [trafficLevel,  setTrafficLevel]  = useState(null);
  const [showTransport, setShowTransport] = useState(false);
  const [chatOpen,      setChatOpen]      = useState(false);
  const [weather,       setWeather]       = useState(null);
  const [districtAlert, setDistrictAlert] = useState(null);
  const [routeError,    setRouteError]    = useState(null);
  const transportTimerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => () => { if (transportTimerRef.current) clearTimeout(transportTimerRef.current); }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_KEY,
    libraries: MAPS_LIBRARIES,
  });

  // ── Geolocation ──────────────────────────────────────────────────────────
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({
          address: 'My Current Location',
          lat: coords.latitude,
          lng: coords.longitude,
        });
      },
      () => {
        // Fallback to Kochi city centre
        setOrigin({ address: 'Ernakulam, Kochi', lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng });
      }
    );
  }, []);

  // ── Main route analysis ──────────────────────────────────────────────────
  const handleGetRoute = useCallback(async () => {
    if (!isLoaded || !origin || !destination) return;

    setIsPlanning(true);
    setJourney(null);
    setShowTransport(false);
    setDistrictAlert(null);
    setRouteError(null);

    try {
      // 1. Fetch weather for origin
      const wx = await fetchWeather(origin.lat, origin.lng);
      setWeather(wx);

      // 2. Get driving routes (primary + alternative)
      const data = await fetchRoutes(origin, destination);
      const routes = data.routes ?? [];
      const primaryRoute = parseRoute(routes[0]);
      const altRoute     = parseRoute(routes[1] ?? null);

      if (!primaryRoute) throw new Error('No route returned');

      // 3. Determine traffic level
      const level = getTrafficLevel();
      setTrafficLevel(level);

      // 4. AI Decision
      const decision = makeDecision({ primaryRoute, altRoute, trafficLevel: level, weather: wx });

      // 5. Transport options
      const transportOptions = getEnrichedTransportOptions(primaryRoute.durationMin, wx);

      // 6. Active hotspots along the route bounding box
      const latMin = Math.min(origin.lat, destination.lat) - 0.15;
      const latMax = Math.max(origin.lat, destination.lat) + 0.15;
      const lngMin = Math.min(origin.lng, destination.lng) - 0.15;
      const lngMax = Math.max(origin.lng, destination.lng) + 0.15;
      const activeHotspots = getHotspotsInArea({ south: latMin, north: latMax, west: lngMin, east: lngMax });

      // 7. District geo-risk alert (landslide / flood zones)
      const destDistrict = KERALA_DISTRICTS.reduce((closest, d) => {
        const dist = Math.hypot(d.lat - destination.lat, d.lng - destination.lng);
        return dist < Math.hypot(closest.lat - destination.lat, closest.lng - destination.lng) ? d : closest;
      }, KERALA_DISTRICTS[0]);
      const geoAlert = DISTRICT_WEATHER_ALERTS[destDistrict.id] ?? null;
      setDistrictAlert(geoAlert);

      setJourney({ primaryRoute, altRoute, decision, weather: wx, transportOptions, activeHotspots, destDistrict });

      // Auto-open transport drawer if AI recommends transit
      if (decision?.type === 'public_transport') {
        if (transportTimerRef.current) clearTimeout(transportTimerRef.current);
        transportTimerRef.current = setTimeout(() => setShowTransport(true), 800);
      }
    } catch (err) {
      console.error('Route planning failed:', err);
      setRouteError(
        err.message?.includes('Routes API')
          ? 'Could not fetch route. Check your Google Maps API key has Routes API enabled.'
          : 'Route planning failed. Check your internet connection and try again.'
      );
    } finally {
      setIsPlanning(false);
    }
  }, [isLoaded, origin, destination]);

  // ── Loading / error screens ──────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#050505] text-center px-8">
        <div>
          <p className="text-xl font-bold text-red-400 mb-2">Map failed to load</p>
          <p className="text-sm text-gray-500">
            Check <code className="text-[#b026ff]">VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code>
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#050505] gap-5">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#b026ff]/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#b026ff] rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold tracking-wide">Smart Mobility AI</p>
          <p className="text-gray-600 text-sm tracking-widest uppercase mt-1">Loading…</p>
        </div>
      </div>
    );
  }

  // Journey context for AI chat
  const journeyContext = journey ? {
    origin,
    destination,
    trafficLevel,
    weather: journey.weather,
    decision: journey.decision,
  } : null;

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#050505]">

      {/* ── Full-screen map ───────────────────────────────────────────────── */}
      <MapView
        origin={origin}
        destination={destination}
        primaryPolyline={journey?.primaryRoute?.polyline}
        altPolyline={journey?.altRoute?.polyline}
        trafficLevel={trafficLevel}
        activeHotspots={journey?.activeHotspots}
      />

      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
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
        />
      </div>

      {/* ── Weather widget (top-right) ────────────────────────────────────── */}
      {!chatOpen && <WeatherWidget weather={weather} />}

      {/* ── Traffic alert banner (top-centre) ────────────────────────────── */}
      <TrafficAlert
        trafficLevel={trafficLevel}
        hotspots={journey?.activeHotspots}
        decision={journey?.decision}
        onViewOptions={() => setShowTransport(true)}
      />

      {/* ── Transport drawer (bottom) ─────────────────────────────────────── */}
      {showTransport && journey?.transportOptions && (
        <TransportDrawer
          options={journey.transportOptions}
          primaryDurationMin={journey.primaryRoute?.durationMin}
          onClose={() => setShowTransport(false)}
        />
      )}

      {/* ── Chat drawer (right) ───────────────────────────────────────────── */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        journeyContext={journeyContext}
      />

      {/* ── Chat toggle button ────────────────────────────────────────────── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute bottom-6 right-6 z-20 w-14 h-14 rounded-2xl bg-[#b026ff] shadow-[0_0_30px_rgba(176,38,255,0.5)] flex items-center justify-center hover:shadow-[0_0_45px_rgba(176,38,255,0.7)] hover:-translate-y-1 transition-all duration-300 pointer-events-auto"
          title="Chat with Mova AI"
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}
