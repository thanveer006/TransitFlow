import { useRef, useState, useEffect, useCallback } from 'react';
import {
  MapPin, Navigation, Zap, Loader2, ChevronRight,
  Clock, Ruler, Car, AlertTriangle, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { TRAFFIC_METADATA } from '../services/trafficService';

// ── Severity colour map ────────────────────────────────────────────────────────
const SEVERITY = {
  danger:  { bg: 'bg-red-500/10',     border: 'border-red-500/40',     text: 'text-red-400',     icon: <AlertTriangle className="w-4 h-4" /> },
  warning: { bg: 'bg-orange-500/10',  border: 'border-orange-500/40',  text: 'text-orange-400',  icon: <AlertTriangle className="w-4 h-4" /> },
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4" /> },
  info:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/40',    text: 'text-blue-400',    icon: <Zap className="w-4 h-4" /> },
};

// ── Location input — uses AutocompleteService (not deprecated) + Geocoder ─────
function LocationInput({ icon, placeholder, onPlaceSelect, value, onUseMyLocation }) {
  const [inputVal,    setInputVal]    = useState(value?.address ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen,      setIsOpen]      = useState(false);
  const wrapperRef   = useRef(null);
  const serviceRef   = useRef(null);
  const geocoderRef  = useRef(null);
  const debounceRef  = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lazy-init AutocompleteService + Geocoder (only after Maps SDK is loaded)
  const initServices = useCallback(() => {
    if (!serviceRef.current && window.google?.maps?.places) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
    }
    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);

  const fetchSuggestions = useCallback((input) => {
    if (!input || input.length < 2) { setSuggestions([]); setIsOpen(false); return; }
    initServices();
    if (!serviceRef.current) return;

    serviceRef.current.getPlacePredictions(
      { input, componentRestrictions: { country: 'in' } },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5));
          setIsOpen(true);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      }
    );
  }, [initServices]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = useCallback((prediction) => {
    setInputVal(prediction.description);
    setIsOpen(false);
    setSuggestions([]);
    initServices();
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        onPlaceSelect({ address: prediction.description, lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [initServices, onPlaceSelect]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        {icon}
      </div>
      <input
        type="text"
        value={inputVal}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 transition-all"
      />
      {onUseMyLocation && (
        <button
          onClick={onUseMyLocation}
          title="Use my location"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#b026ff] transition-colors"
        >
          <Navigation className="w-4 h-4" />
        </button>
      )}

      {/* ── Suggestions dropdown ─────────────────────────────────────────── */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onMouseDown={() => handleSelect(s)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">
                  {s.structured_formatting?.main_text ?? s.description}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {s.structured_formatting?.secondary_text ?? ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Route stat pill ───────────────────────────────────────────────────────────
function StatPill({ icon, value, label, highlight }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl flex-1 ${highlight ? 'bg-[#b026ff]/15 border border-[#b026ff]/40' : 'bg-white/5 border border-white/5'}`}>
      <span className={`${highlight ? 'text-[#b026ff]' : 'text-gray-500'} mb-1`}>{icon}</span>
      <span className={`text-base font-black ${highlight ? 'text-white' : 'text-white'}`}>{value}</span>
      <span className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeftPanel({
  origin, destination,
  onOriginSelect, onDestinationSelect, onUseMyLocation,
  onGetRoute, isPlanning,
  journey, trafficLevel, districtAlert, routeError,
  onShowTransport,
}) {
  const traffic = trafficLevel ? TRAFFIC_METADATA[trafficLevel] : null;
  const { decision, primaryRoute, altRoute } = journey ?? {};
  const sev = decision ? (SEVERITY[decision.severity] ?? SEVERITY.info) : null;

  return (
    <div className="relative z-10 w-full sm:w-[380px] h-full bg-[#050505]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-2xl overflow-y-auto pointer-events-auto">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-7 pb-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b026ff]/30 to-[#b026ff]/5 border border-[#b026ff]/40 flex items-center justify-center shadow-[0_0_20px_rgba(176,38,255,0.2)]">
            <Zap className="w-5 h-5 text-[#b026ff]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">
              Smart Mobility <span className="text-[#b026ff]">AI</span>
            </h1>
            <p className="text-[10px] text-gray-600 tracking-[0.18em] uppercase mt-0.5">Kerala Traffic Assistant</p>
          </div>
        </div>
      </div>

      {/* ── Route Input ───────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 space-y-2.5 shrink-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold px-1">Your Journey</p>

        <LocationInput
          label="From"
          icon={<div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
          placeholder="Current location or starting point…"
          value={origin}
          onPlaceSelect={onOriginSelect}
          onUseMyLocation={onUseMyLocation}
        />

        {/* Connector line */}
        <div className="flex items-center gap-3 px-3">
          <div className="w-px h-5 bg-white/10 ml-1" />
        </div>

        <LocationInput
          label="To"
          icon={<MapPin className="w-3.5 h-3.5 text-[#b026ff]" />}
          placeholder="Where are you going?"
          value={destination}
          onPlaceSelect={onDestinationSelect}
        />

        <button
          onClick={onGetRoute}
          disabled={isPlanning || !origin || !destination}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 mt-1 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all duration-300 bg-[#b026ff] text-white hover:shadow-[0_0_35px_rgba(176,38,255,0.45)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
        >
          {isPlanning ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
          ) : (
            <><Zap className="w-4 h-4" /> Get Smart Route</>
          )}
        </button>

        {/* Route error */}
        {routeError && (
          <div className="mt-2 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 animate-fade-up">
            <p className="text-xs text-red-400 font-medium leading-relaxed">{routeError}</p>
          </div>
        )}
      </div>

      {/* ── Live traffic badge ─────────────────────────────────────────────── */}
      {traffic && (
        <div className="px-5 mt-4 shrink-0">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border"
            style={{ background: `${traffic.color}12`, borderColor: `${traffic.color}40` }}
          >
            <div className="w-2.5 h-2.5 rounded-full animate-pulse-dot" style={{ background: traffic.color }} />
            <span className="text-xs font-semibold" style={{ color: traffic.color }}>{traffic.label} Traffic</span>
            <span className="text-xs text-gray-600 ml-auto">{traffic.description}</span>
          </div>
        </div>
      )}

      {/* ── AI Decision Card ──────────────────────────────────────────────── */}
      {decision && sev && (
        <div className={`mx-5 mt-4 p-4 rounded-2xl border animate-fade-up shrink-0 ${sev.bg} ${sev.border}`}>
          <div className="flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 ${sev.text}`}>{sev.icon}</div>
            <div className="min-w-0">
              <p className={`text-sm font-bold leading-snug ${sev.text}`}>{decision.headline}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{decision.reason}</p>
            </div>
          </div>
          {decision.savingsMin != null && decision.savingsMin > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Time saved</span>
              <span className={`text-lg font-black ${sev.text}`}>
                {Math.abs(decision.savingsMin)} <span className="text-xs font-normal">min</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Route stats ────────────────────────────────────────────────────── */}
      {primaryRoute && (
        <div className="px-5 mt-4 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-3 px-1">Route Analysis</p>
          <div className="flex gap-2">
            <StatPill icon={<Clock className="w-3.5 h-3.5" />} value={`${primaryRoute.durationMin}m`} label="Drive time" highlight={false} />
            <StatPill icon={<Ruler className="w-3.5 h-3.5" />} value={`${primaryRoute.distanceKm}km`} label="Distance" highlight={false} />
            {altRoute && (
              <StatPill icon={<Car className="w-3.5 h-3.5" />} value={`${altRoute.durationMin}m`} label="Alt route" highlight={altRoute.durationMin < primaryRoute.durationMin} />
            )}
          </div>
        </div>
      )}

      {/* ── Inter-district / geo-risk alert ─────────────────────────────── */}
      {districtAlert && (
        <div className="mx-5 mt-3 px-4 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 animate-fade-up shrink-0">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">District Alert</p>
          <p className="text-xs text-gray-300 leading-relaxed">{districtAlert.message}</p>
        </div>
      )}

      {/* ── Destination district badge ────────────────────────────────────── */}
      {journey?.destDistrict && (
        <div className="mx-5 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/4 border border-white/8 shrink-0">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Destination district</span>
          <span className="ml-auto text-xs font-bold text-[#b026ff]">{journey.destDistrict.name}</span>
        </div>
      )}

      {/* ── Transport alternatives button ─────────────────────────────────── */}
      {journey && (
        <div className="px-5 mt-4 shrink-0">
          <button
            onClick={onShowTransport}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/8 hover:border-[#b026ff]/30 hover:bg-[#b026ff]/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🚌</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Public Transport Options</p>
                <p className="text-xs text-gray-600">Metro · Bus · Auto · Water Metro</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#b026ff] transition-colors" />
          </button>
        </div>
      )}

      {/* ── Reset ─────────────────────────────────────────────────────────── */}
      {journey && (
        <div className="px-5 mt-3 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New Journey
          </button>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="mt-auto px-5 py-5 border-t border-white/5 shrink-0">
        <p className="text-[10px] text-gray-700 text-center tracking-wider">
          Google Maps · OpenWeather · Gemini 2.0 Flash
        </p>
      </div>
    </div>
  );
}
