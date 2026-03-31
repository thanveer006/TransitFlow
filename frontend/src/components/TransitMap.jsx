import { useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, TrafficLayer, CircleF, OverlayViewF, PolylineF } from '@react-google-maps/api';
import { TRANSIT_HUBS, BOTTLENECK_ZONES, CITY_CENTER, HUB_COLORS, SEVERITY_COLORS } from '../data/kochiData';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: 'greedy',
  styles: [
    { elementType: 'geometry',                                                stylers: [{ color: '#080808' }] },
    { elementType: 'labels.icon',                                             stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill',                                        stylers: [{ color: '#606060' }] },
    { elementType: 'labels.text.stroke',                                      stylers: [{ color: '#080808' }] },
    { featureType: 'administrative',       elementType: 'geometry',           stylers: [{ color: '#1e1e1e' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#909090' }] },
    { featureType: 'poi',                  elementType: 'labels.text.fill',   stylers: [{ color: '#505050' }] },
    { featureType: 'poi.park',             elementType: 'geometry',           stylers: [{ color: '#0d0d0d' }] },
    { featureType: 'road',                 elementType: 'geometry.fill',      stylers: [{ color: '#161616' }] },
    { featureType: 'road',                 elementType: 'labels.text.fill',   stylers: [{ color: '#3a3a3a' }] },
    { featureType: 'road.arterial',        elementType: 'geometry',           stylers: [{ color: '#1d1d1d' }] },
    { featureType: 'road.highway',         elementType: 'geometry',           stylers: [{ color: '#222' }] },
    { featureType: 'road.highway',         elementType: 'geometry.stroke',    stylers: [{ color: '#2c1d44' }] },
    { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#2a1e3a' }] },
    { featureType: 'transit',              elementType: 'geometry',           stylers: [{ color: '#1a0f2e' }] },
    { featureType: 'water',                elementType: 'geometry',           stylers: [{ color: '#030612' }] },
    { featureType: 'water',                elementType: 'labels.text.fill',   stylers: [{ color: '#1e2a4a' }] },
  ],
};

// ── Pulsing hub marker rendered as a DOM overlay ──────────────────────────────
function HubMarker({ hub }) {
  const colors = HUB_COLORS[hub.type] || HUB_COLORS.metro;
  return (
    <OverlayViewF
      position={{ lat: hub.lat, lng: hub.lng }}
      mapPaneName="overlayMouseTarget"
    >
      <div className="relative flex items-center justify-center" style={{ width: 32, height: 32, transform: 'translate(-50%, -50%)' }}>
        {/* Pulse ring */}
        <div
          className="absolute rounded-full animate-pulse-ring"
          style={{
            width: 32,
            height: 32,
            background: `${colors.fill}30`,
            border: `1.5px solid ${colors.fill}`,
          }}
        />
        {/* Core dot */}
        <div
          className="relative rounded-full animate-pulse-dot z-10 flex items-center justify-center shadow-lg"
          style={{
            width: 14,
            height: 14,
            background: colors.fill,
            boxShadow: `0 0 12px ${colors.fill}`,
          }}
        />
        {/* Label tooltip on hover — uses CSS title trick via title attr on wrapper */}
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: colors.fill }}
        >
          {hub.shortName}
        </div>
      </div>
    </OverlayViewF>
  );
}

// ── Switch-point escape hub highlight ────────────────────────────────────────
function EscapeHubMarker({ hub }) {
  const colors = HUB_COLORS[hub.type] || HUB_COLORS.metro;
  return (
    <OverlayViewF
      position={{ lat: hub.lat, lng: hub.lng }}
      mapPaneName="overlayMouseTarget"
    >
      <div
        className="relative flex flex-col items-center"
        style={{ transform: 'translate(-50%, -100%)', paddingBottom: 4 }}
      >
        {/* Label */}
        <div
          className="mb-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black tracking-wide whitespace-nowrap shadow-xl"
          style={{
            background: colors.fill,
            color: '#fff',
            boxShadow: `0 4px 20px ${colors.fill}80`,
          }}
        >
          ESCAPE HATCH
        </div>
        {/* Large pulsing dot */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <div
            className="absolute rounded-full animate-pulse-ring"
            style={{ width: 44, height: 44, border: `2px solid ${colors.fill}`, background: `${colors.fill}20` }}
          />
          <div
            className="rounded-full z-10"
            style={{ width: 20, height: 20, background: colors.fill, boxShadow: `0 0 20px ${colors.fill}` }}
          />
        </div>
      </div>
    </OverlayViewF>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TransitMap({ encodedPolyline, switchPoint, selectedRoute }) {
  const mapRef = useRef(null);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Decode encoded polyline → LatLng array for PolylineF
  const routePath = useMemo(() => {
    if (!encodedPolyline || !window.google?.maps?.geometry) return null;
    return window.google.maps.geometry.encoding.decodePath(encodedPolyline);
  }, [encodedPolyline]);

  // Fit map bounds to the decoded route path
  useEffect(() => {
    if (!mapRef.current || !routePath || routePath.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    routePath.forEach((pt) => bounds.extend(pt));
    mapRef.current.fitBounds(bounds, { top: 80, right: 60, bottom: 200, left: 460 });
  }, [routePath]);

  // Pan to selected route origin when route changes (before analysis)
  useEffect(() => {
    if (!mapRef.current || !selectedRoute || routePath) return;
    mapRef.current.panTo({ lat: selectedRoute.origin.lat, lng: selectedRoute.origin.lng });
    mapRef.current.setZoom(13);
  }, [selectedRoute, routePath]);

  return (
    <div className="absolute inset-0 z-0">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        zoom={13}
        center={CITY_CENTER}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {/* Live traffic overlay */}
        <TrafficLayer />

        {/* Bottleneck red-zone circles */}
        {BOTTLENECK_ZONES.map((zone) => {
          const cfg = SEVERITY_COLORS[zone.severity];
          return (
            <CircleF
              key={zone.id}
              center={{ lat: zone.lat, lng: zone.lng }}
              radius={cfg.radius}
              options={{
                strokeColor: cfg.fill,
                strokeOpacity: 0.5,
                strokeWeight: 1.5,
                fillColor: cfg.fill,
                fillOpacity: cfg.opacity,
              }}
            />
          );
        })}

        {/* All transit hub markers (pulsing dots) */}
        {TRANSIT_HUBS.map((hub) => (
          <HubMarker key={hub.id} hub={hub} />
        ))}

        {/* Switch-point escape hatch highlight */}
        {switchPoint?.triggered && switchPoint.hub && (
          <EscapeHubMarker hub={switchPoint.hub} />
        )}

        {/* Route polyline decoded from Routes API response */}
        {routePath && (
          <PolylineF
            path={routePath}
            options={{
              strokeColor: '#b026ff',
              strokeWeight: 5,
              strokeOpacity: 0.85,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
