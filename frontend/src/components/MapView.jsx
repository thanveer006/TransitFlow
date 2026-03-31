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

const MAP_OPTIONS = {
  disableDefaultUI: false,
  mapTypeControl: false,
  streetViewControl: false,
  gestureHandling: 'greedy',
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
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all bg-white ${
            filters[key]
              ? 'border-blue-500 text-blue-700 bg-blue-50'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
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
        className="whitespace-nowrap px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm text-[10px] text-gray-700 font-medium tracking-wide pointer-events-none"
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
          className="w-full h-full rounded-full flex items-center justify-center text-[11px] border border-gray-200 shadow-sm bg-white cursor-pointer hover:scale-110 transition-transform"
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
          className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-md mb-1 relative"
          style={{ background: color }}
        >
          {label}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent" style={{ borderTopColor: color }} />
        </div>
        <div className="w-2 h-2 rounded-full bg-white border-2" style={{ borderColor: color }} />
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
            options={{ strokeColor: '#70757a', strokeWeight: 6, strokeOpacity: 0.8, zIndex: 2 }}
          />
        )}

        {/* Primary route */}
        {primaryPath && (
          <PolylineF
            path={primaryPath}
            options={{ strokeColor: '#1a73e8', strokeWeight: 6, strokeOpacity: 1.0, zIndex: 3 }}
          />
        )}

        {/* Origin pin */}
        {origin && (
          <RoutePin position={{ lat: origin.lat, lng: origin.lng }} label="A" color="#202124" />
        )}

        {/* Destination pin */}
        {destination && (
          <RoutePin position={{ lat: destination.lat, lng: destination.lng }} label="B" color="#d93025" />
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5 pointer-events-none">
        {primaryPath && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-5 h-1.5 rounded-full bg-[#1a73e8]" />
            <span className="text-[10px] text-gray-700 font-medium">Primary</span>
          </div>
        )}
        {altPath && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-5 h-1.5 rounded-full bg-[#70757a]" />
            <span className="text-[10px] text-gray-700 font-medium">Alternative</span>
          </div>
        )}
        <div className="flex flex-col gap-1.5 bg-white px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm mt-1">
          {Object.entries(SEVERITY_COLORS).map(([sev, col]) => (
            <div key={sev} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: col }} />
              <span className="text-[10px] text-gray-600 capitalize font-medium">{sev} traffic</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
