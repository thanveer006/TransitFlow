import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  GoogleMap, TrafficLayer, CircleF, OverlayViewF, PolylineF,
} from '@react-google-maps/api';
import {
  KEY_LOCATIONS, HIGHWAY_HOTSPOTS, KERALA_DISTRICTS,
  LOCATION_TYPE_CONFIG, KERALA_CENTER, KERALA_MAP_ZOOM,
} from '../data/mobilityData';
import { TRAFFIC_METADATA } from '../services/trafficService';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const DARK_MAP_STYLE = [
  { elementType: 'geometry',                                                 stylers: [{ color: '#07070f' }] },
  { elementType: 'labels.icon',                                              stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill',                                         stylers: [{ color: '#5a5a6e' }] },
  { elementType: 'labels.text.stroke',                                        stylers: [{ color: '#07070f' }] },
  { featureType: 'administrative',        elementType: 'geometry',            stylers: [{ color: '#18181e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill',  stylers: [{ color: '#8a8aa0' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke',  stylers: [{ color: '#b026ff', weight: 1.5 }] },
  { featureType: 'poi',                   elementType: 'labels.text.fill',    stylers: [{ color: '#404050' }] },
  { featureType: 'poi.park',              elementType: 'geometry',            stylers: [{ color: '#0c0c14' }] },
  { featureType: 'road',                  elementType: 'geometry.fill',       stylers: [{ color: '#14141e' }] },
  { featureType: 'road',                  elementType: 'labels.text.fill',    stylers: [{ color: '#32323f' }] },
  { featureType: 'road.arterial',         elementType: 'geometry',            stylers: [{ color: '#1a1a28' }] },
  { featureType: 'road.highway',          elementType: 'geometry',            stylers: [{ color: '#1e1e2e' }] },
  { featureType: 'road.highway',          elementType: 'geometry.stroke',     stylers: [{ color: '#2a1540' }] },
  { featureType: 'transit',               elementType: 'geometry',            stylers: [{ color: '#180c28' }] },
  { featureType: 'water',                 elementType: 'geometry',            stylers: [{ color: '#03050f' }] },
  { featureType: 'water',                 elementType: 'labels.text.fill',    stylers: [{ color: '#1a2040' }] },
];

const MAP_OPTIONS = {
  disableDefaultUI: true,
  gestureHandling: 'greedy',
  styles: DARK_MAP_STYLE,
  restriction: {
    latLngBounds: { north: 13.0, south: 7.9, east: 77.7, west: 74.6 },
    strictBounds: false,
  },
};

const SEVERITY_COLORS = {
  critical: '#ff1744',
  high:     '#ff6d00',
  medium:   '#ffd600',
  low:      '#00e676',
};

// ── Filter toggle bar ─────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'highways',   label: '🛣️ Highways',  title: 'Traffic zones' },
  { key: 'hubs',       label: '🏙️ Hubs',       title: 'Transport hubs' },
  { key: 'districts',  label: '🗺️ Districts',  title: 'District labels' },
  { key: 'traffic',    label: '🚦 Traffic',    title: 'Live traffic layer' },
];

function FilterBar({ filters, onToggle }) {
  return (
    <div className="absolute top-5 left-[400px] z-10 flex gap-2 pointer-events-auto">
      {FILTERS.map(({ key, label, title }) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          title={title}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-xl transition-all ${
            filters[key]
              ? 'bg-[#b026ff]/20 border-[#b026ff]/50 text-[#b026ff]'
              : 'bg-[#050505]/70 border-white/10 text-gray-500 hover:text-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── District label overlay ────────────────────────────────────────────────────
function DistrictLabel({ district }) {
  return (
    <OverlayViewF position={{ lat: district.lat, lng: district.lng }} mapPaneName="overlayLayer">
      <div
        style={{ transform: 'translate(-50%, -50%)' }}
        className="whitespace-nowrap px-2 py-0.5 rounded-lg bg-[#050505]/60 backdrop-blur border border-white/5 text-[9px] text-gray-500 font-semibold tracking-wide pointer-events-none"
      >
        {district.name}
      </div>
    </OverlayViewF>
  );
}

// ── Location marker rendered as DOM overlay ───────────────────────────────────
function LocationMarker({ loc }) {
  const cfg = LOCATION_TYPE_CONFIG[loc.type] ?? {};
  return (
    <OverlayViewF position={{ lat: loc.lat, lng: loc.lng }} mapPaneName="overlayMouseTarget">
      <div
        style={{ width: 26, height: 26, transform: 'translate(-50%, -50%)' }}
        title={loc.name}
        className="flex items-center justify-center"
      >
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-[11px] border border-white/10 shadow-lg backdrop-blur-sm cursor-pointer hover:scale-125 transition-transform"
          style={{ background: `${cfg.color}28` }}
        >
          {cfg.icon ?? '📍'}
        </div>
      </div>
    </OverlayViewF>
  );
}

// ── Route origin/destination pin ──────────────────────────────────────────────
function RoutePin({ position, label, color }) {
  return (
    <OverlayViewF position={position} mapPaneName="overlayMouseTarget">
      <div className="flex flex-col items-center" style={{ transform: 'translate(-50%, -100%)' }}>
        <div
          className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white shadow-lg mb-1"
          style={{ background: color, boxShadow: `0 4px 15px ${color}60` }}
        >
          {label}
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </OverlayViewF>
  );
}

// ── Main Map Component ────────────────────────────────────────────────────────
export default function MapView({
  origin, destination,
  primaryPolyline, altPolyline,
  trafficLevel, activeHotspots,
}) {
  const mapRef = useRef(null);
  const [filters, setFilters] = useState({
    highways: true,
    hubs:     true,
    districts: true,
    traffic:  true,
  });

  const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Decode polylines
  const primaryPath = useMemo(() => {
    if (!primaryPolyline || !window.google?.maps?.geometry) return null;
    return window.google.maps.geometry.encoding.decodePath(primaryPolyline);
  }, [primaryPolyline]);

  const altPath = useMemo(() => {
    if (!altPolyline || !window.google?.maps?.geometry) return null;
    return window.google.maps.geometry.encoding.decodePath(altPolyline);
  }, [altPolyline]);

  // Fit to route or reset to full Kerala view
  useEffect(() => {
    if (!mapRef.current) return;
    if (primaryPath?.length) {
      const bounds = new window.google.maps.LatLngBounds();
      primaryPath.forEach((pt) => bounds.extend(pt));
      if (altPath) altPath.forEach((pt) => bounds.extend(pt));
      mapRef.current.fitBounds(bounds, { top: 80, right: 60, bottom: 80, left: 420 });
    } else if (!origin) {
      // Reset to Kerala state view
      mapRef.current.setCenter(KERALA_CENTER);
      mapRef.current.setZoom(KERALA_MAP_ZOOM);
    }
  }, [primaryPath, altPath, origin]);

  // Pan to origin on selection
  useEffect(() => {
    if (!mapRef.current || !origin || primaryPath) return;
    mapRef.current.panTo({ lat: origin.lat, lng: origin.lng });
    mapRef.current.setZoom(13);
  }, [origin, primaryPath]);

  const trafficColor = trafficLevel ? (TRAFFIC_METADATA[trafficLevel]?.color ?? '#ff1744') : '#ff6d00';

  return (
    <div className="absolute inset-0 z-0">
      {/* Filter toggle bar */}
      <FilterBar filters={filters} onToggle={toggleFilter} />

      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        zoom={KERALA_MAP_ZOOM}
        center={KERALA_CENTER}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {/* Live traffic layer */}
        {filters.traffic && <TrafficLayer />}

        {/* District labels */}
        {filters.districts && KERALA_DISTRICTS.map((d) => (
          <DistrictLabel key={d.id} district={d} />
        ))}

        {/* Transport hub markers */}
        {filters.hubs && KEY_LOCATIONS.map((loc) => (
          <LocationMarker key={loc.id} loc={loc} />
        ))}

        {/* Highway hotspot circles — use route-specific set when a route is active */}
        {filters.highways && (activeHotspots ?? HIGHWAY_HOTSPOTS).map((h) => (
          <CircleF
            key={h.id}
            center={{ lat: h.lat, lng: h.lng }}
            radius={3500}
            options={{
              strokeColor: SEVERITY_COLORS[h.severity] ?? trafficColor,
              strokeOpacity: 0.55,
              strokeWeight: 1.5,
              fillColor: SEVERITY_COLORS[h.severity] ?? trafficColor,
              fillOpacity: 0.10,
              zIndex: 1,
            }}
          />
        ))}

        {/* Alternative route (behind primary) */}
        {altPath && (
          <PolylineF
            path={altPath}
            options={{ strokeColor: '#4a90d9', strokeWeight: 4, strokeOpacity: 0.5, zIndex: 2 }}
          />
        )}

        {/* Primary route */}
        {primaryPath && (
          <PolylineF
            path={primaryPath}
            options={{ strokeColor: '#b026ff', strokeWeight: 5, strokeOpacity: 0.9, zIndex: 3 }}
          />
        )}

        {/* Origin pin */}
        {origin && (
          <RoutePin position={{ lat: origin.lat, lng: origin.lng }} label="FROM" color="#00e676" />
        )}

        {/* Destination pin */}
        {destination && (
          <RoutePin position={{ lat: destination.lat, lng: destination.lng }} label="TO" color="#b026ff" />
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5 pointer-events-none">
        {primaryPath && (
          <div className="flex items-center gap-2 bg-[#050505]/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/8">
            <div className="w-5 h-1 rounded-full bg-[#b026ff]" />
            <span className="text-[10px] text-gray-400">Primary route</span>
          </div>
        )}
        {altPath && (
          <div className="flex items-center gap-2 bg-[#050505]/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/8">
            <div className="w-5 h-1 rounded-full bg-[#4a90d9] opacity-60" />
            <span className="text-[10px] text-gray-400">Alternate route</span>
          </div>
        )}
        <div className="flex flex-col gap-1 bg-[#050505]/80 backdrop-blur px-3 py-2 rounded-xl border border-white/8">
          {Object.entries(SEVERITY_COLORS).map(([sev, col]) => (
            <div key={sev} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: col }} />
              <span className="text-[9px] text-gray-500 capitalize">{sev} traffic</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
