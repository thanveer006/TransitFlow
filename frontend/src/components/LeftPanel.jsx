import { useRef, useState, useEffect, useCallback } from 'react';
import {
  MapPin, Navigation, Zap, Loader2, ChevronRight, ChevronDown,
  Clock, Ruler, Car, AlertTriangle, CheckCircle2, RefreshCw,
  Siren, Volume2, VolumeX, Wifi, WifiOff, Brain,
} from 'lucide-react';
import { TRAFFIC_METADATA } from '../services/trafficService';

// ── Severity colour map ───────────────────────────────────────────────────────
const SEVERITY = {
  danger:   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     icon: <AlertTriangle className="w-4 h-4" /> },
  warning:  { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  icon: <AlertTriangle className="w-4 h-4" /> },
  success:  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  info:     { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    icon: <Zap className="w-4 h-4" /> },
};

const IMPACT_STYLES = {
  positive: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  negative: { dot: 'bg-red-500',     text: 'text-red-700'     },
  warning:  { dot: 'bg-orange-500',  text: 'text-orange-700'  },
  neutral:  { dot: 'bg-gray-400',    text: 'text-gray-600'    },
};

// ── Location Input — AutocompleteSuggestion (Places API New) ─────────────────
function LocationInput({ icon, placeholder, onPlaceSelect, value, onUseMyLocation }) {
  const [inputVal,    setInputVal]    = useState(value?.address ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen,      setIsOpen]      = useState(false);
  const wrapperRef  = useRef(null);
  const debounceRef = useRef(null);
  const sessionRef  = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) { setSuggestions([]); setIsOpen(false); return; }
    const AutocompleteSuggestion = window.google?.maps?.places?.AutocompleteSuggestion;
    if (!AutocompleteSuggestion) return;

    if (!sessionRef.current) {
      sessionRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }

    try {
      const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedRegionCodes: ['in'],
        sessionToken: sessionRef.current,
      });
      setSuggestions(results.slice(0, 5));
      setIsOpen(results.length > 0);
    } catch (err) {
      console.error('Autocomplete fetch failed:', err);
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = useCallback(async (suggestion) => {
    const prediction = suggestion.placePrediction;
    const address    = prediction.text.text;
    setInputVal(address);
    setIsOpen(false);
    setSuggestions([]);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['location'] });
      const loc = place.location;
      onPlaceSelect({ address, lat: loc.lat(), lng: loc.lng() });
    } catch (err) {
      console.error('Place fields fetch failed:', err);
    } finally {
      sessionRef.current = null;
    }
  }, [onPlaceSelect]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">{icon}</div>
      <input
        type="text"
        value={inputVal}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-gray-100 border border-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
      />
      {onUseMyLocation && (
        <button
          onClick={onUseMyLocation}
          title="Use my location"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
        >
          <Navigation className="w-4 h-4" />
        </button>
      )}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.placePrediction.placeId}
              onMouseDown={() => handleSelect(s)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {s.placePrediction.mainText?.text ?? s.placePrediction.text.text}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {s.placePrediction.secondaryText?.text ?? ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Route Comparison Card ─────────────────────────────────────────────────────
function RouteCard({ route }) {
  const isAI = route.id === 'ai_smart';

  const TAG_STYLES = {
    ai:       'bg-blue-50 text-blue-700 border-blue-200',
    fastest:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    cheapest: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <div className={`relative p-3.5 rounded-xl border transition-all ${
      isAI
        ? 'bg-blue-50 border-blue-200 shadow-sm'
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{route.emoji}</span>
          <span className={`text-xs font-bold ${isAI ? 'text-blue-700' : 'text-gray-900'}`}>
            {route.label}
          </span>
          {isAI && (
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
              AI
            </span>
          )}
        </div>
        {route.tag && TAG_STYLES[route.tag] && (
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${TAG_STYLES[route.tag]}`}>
            {route.tag}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1">
          <Clock className="w-3 h-3 text-gray-500 shrink-0" />
          <span className="text-sm font-black text-gray-900">{route.durationMin ?? '—'}<span className="text-xs font-normal text-gray-500"> min</span></span>
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-xs font-bold text-gray-900">₹{route.costRupees}</span>
          {route.mode === 'transit' && (
            <span className="text-[9px] text-gray-500">transit fare</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
            style={{ background: TRAFFIC_METADATA[route.trafficLevel]?.color ?? '#888' }}
          />
          <span className="text-[10px] text-gray-500">
            {TRAFFIC_METADATA[route.trafficLevel]?.label ?? '—'}
          </span>
        </div>
      </div>

      {/* Transit mode badge */}
      {route.mode === 'transit' && route.transitName && (
        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-[10px]">🚇</span>
          <span className="text-[10px] text-gray-600 font-medium">{route.transitName}</span>
        </div>
      )}

      {/* AI glow indicator */}
      {isAI && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-t-xl" />
      )}
    </div>
  );
}

// ── AI Transparency Panel ─────────────────────────────────────────────────────
function TransparencyPanel({ points }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Brain className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-gray-900">Why this route?</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="divide-y divide-gray-100 animate-fade-up">
          {points.map((p, i) => {
            const st = IMPACT_STYLES[p.impact] ?? IMPACT_STYLES.neutral;
            return (
              <div key={i} className="px-4 py-3 bg-white">
                <div className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${st.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
                        {p.icon} {p.factor}
                      </span>
                      <span className={`text-[10px] font-bold ${st.text} shrink-0`}>{p.value}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{p.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Gamification Stats Strip ──────────────────────────────────────────────────
function GamificationStrip({ stats }) {
  if (!stats || stats.tripsCount === 0) return null;

  const items = [
    { icon: '⏱️', value: `${stats.timeSavedMin}m`,  label: 'Saved' },
    { icon: '💰', value: `₹${stats.moneySavedRupees}`, label: 'Money' },
    { icon: '🛣️', value: stats.tripsCount,           label: 'Trips' },
  ];

  return (
    <div className="mx-5 mt-4 shrink-0">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2 px-1">Your impact</p>
      <div className="flex gap-2">
        {items.map(({ icon, value, label }) => (
          <div
            key={label}
            className="flex-1 flex flex-col items-center py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm"
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-sm font-black text-gray-900 mt-1 leading-none">{value}</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Smart Departure Hint ──────────────────────────────────────────────────────
function SmartDepartureHint({ data }) {
  if (!data) return null;
  return (
    <div className="mx-5 mt-3 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 shrink-0 animate-fade-up shadow-sm">
      <span className="text-base">🧠</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-blue-700 font-bold">Smart Learning</p>
        <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
          You typically travel this route at <span className="text-gray-900 font-semibold">{data.label}</span>
          {' '}({data.count} of {data.total} trips)
        </p>
      </div>
    </div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, highlight }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl flex-1 shadow-sm ${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}>
      <span className={`${highlight ? 'text-blue-600' : 'text-gray-500'} mb-1`}>{icon}</span>
      <span className="text-base font-black text-gray-900">{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</span>
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
  emergencyMode, onToggleEmergency,
  voiceEnabled, onToggleVoice,
  lastUpdated, isOffline,
  lifetimeStats, smartDeparture,
}) {
  const traffic = trafficLevel ? TRAFFIC_METADATA[trafficLevel] : null;
  const { decision, primaryRoute, altRoute, routeComparison, transparencyPoints } = journey ?? {};
  const sev = decision ? (SEVERITY[decision.severity] ?? SEVERITY.info) : null;

  // Format last-updated label
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`relative z-10 w-full sm:w-[390px] h-full bg-white border-r border-gray-200 flex flex-col shadow-2xl overflow-y-auto pointer-events-auto transition-all duration-500 ${
      emergencyMode
        ? 'ring-4 ring-red-500/20 bg-red-50/50'
        : ''
    }`}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={`px-6 pt-7 pb-4 border-b shrink-0 ${emergencyMode ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
              emergencyMode
                ? 'bg-red-100 border-red-200'
                : 'bg-blue-50 border-blue-100'
            }`}>
              {emergencyMode
                ? <Siren className="w-5 h-5 text-red-600 animate-pulse" />
                : <Navigation className="w-5 h-5 text-blue-600" />
              }
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900 leading-none">
                Transit<span className={emergencyMode ? 'text-red-500' : 'text-blue-600'}>Flow</span>
              </h1>
              <p className="text-[10px] text-gray-500 tracking-[0.18em] uppercase mt-0.5">
                {emergencyMode ? '⚠ Emergency Mode Active' : 'Kerala Traffic Assistant'}
              </p>
            </div>
          </div>

          {/* Icon controls */}
          <div className="flex items-center gap-1.5">
            {/* Offline indicator */}
            {isOffline
              ? <WifiOff className="w-3.5 h-3.5 text-yellow-500" title="Offline" />
              : <Wifi    className="w-3.5 h-3.5 text-gray-400"   title="Online"  />
            }

            {/* Voice toggle */}
            <button
              onClick={onToggleVoice}
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              {voiceEnabled
                ? <Volume2  className="w-3.5 h-3.5 text-blue-600" />
                : <VolumeX  className="w-3.5 h-3.5 text-gray-400"  />
              }
            </button>

            {/* Emergency toggle */}
            <button
              onClick={onToggleEmergency}
              title={emergencyMode ? 'Exit emergency mode' : 'Emergency mode'}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                emergencyMode
                  ? 'bg-red-50 border border-red-200 text-red-600'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
              }`}
            >
              <Siren className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Emergency banner */}
        {emergencyMode && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-red-50 border border-red-200 animate-fade-up">
            <p className="text-[11px] text-red-700 font-medium leading-snug">
              🚨 Emergency mode: AI always selects the absolute fastest route. Transit suggestions are disabled.
            </p>
          </div>
        )}
      </div>

      {/* ── Route Input ────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 space-y-2.5 shrink-0">
        <LocationInput
          icon={<div className="w-2.5 h-2.5 rounded-full border-[3px] border-gray-500" />}
          placeholder="Choose starting point"
          value={origin}
          onPlaceSelect={onOriginSelect}
          onUseMyLocation={onUseMyLocation}
        />

        <div className="flex items-center gap-3 px-3">
          <div className="w-px h-3 bg-gray-300 ml-1.5" />
        </div>

        <LocationInput
          icon={<MapPin className="w-4 h-4 text-red-500" />}
          placeholder="Choose destination"
          value={destination}
          onPlaceSelect={onDestinationSelect}
        />

        <button
          onClick={onGetRoute}
          disabled={isPlanning || !origin || !destination}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 mt-2 rounded-xl font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            emergencyMode
              ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
              : 'bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm'
          }`}
        >
          {isPlanning ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Directions…</>
          ) : emergencyMode ? (
            <><Siren className="w-4 h-4" /> Fastest Route Now</>
          ) : (
            <>Directions</>
          )}
        </button>

        {/* Route error */}
        {routeError && (
          <div className="mt-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-fade-up">
            <p className="text-xs text-red-600 font-medium leading-relaxed">{routeError}</p>
          </div>
        )}
      </div>

      {traffic && (
        <div className="px-5 mt-4 shrink-0 space-y-2">
          {/* Live traffic badge */}
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-white shadow-sm"
            style={{ borderColor: `${traffic.color}40` }}
          >
            <div className="w-2.5 h-2.5 rounded-full animate-pulse-dot" style={{ background: traffic.color }} />
            <span className="text-xs font-semibold text-gray-900">{traffic.label} Traffic</span>
            <span className="text-xs text-gray-500 ml-auto">{traffic.description}</span>
          </div>

          {/* Confidence + timestamp row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((bar) => {
                  const filled = trafficLevel === 'low' ? bar <= 2 : trafficLevel === 'medium' ? bar <= 3 : trafficLevel === 'high' ? bar <= 4 : bar <= 5;
                  return (
                    <div
                      key={bar}
                      className={`w-1 rounded-full transition-all ${filled ? 'h-3' : 'h-1.5 opacity-20'}`}
                      style={{ background: filled ? traffic.color : '#bdc1c6' }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] text-gray-500">Traffic confidence</span>
            </div>
            {updatedLabel && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Updated {updatedLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Multi-Route Comparison ─────────────────────────────────────── */}
      {routeComparison && (
        <div className="px-5 mt-4 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-2.5 px-1">Route Comparison</p>
          <div className="space-y-2">
            {routeComparison.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      )}

      {/* ── AI Decision Card ────────────────────────────────────────────── */}
      {decision && sev && (
        <div className={`mx-5 mt-4 p-4 rounded-xl border animate-fade-up shrink-0 shadow-sm ${sev.bg} ${sev.border}`}>
          <div className="flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 ${sev.text}`}>{sev.icon}</div>
            <div className="min-w-0">
              <p className={`text-sm font-bold leading-snug ${sev.text}`}>{decision.headline}</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{decision.reason}</p>
            </div>
          </div>
          {decision.savingsMin != null && decision.savingsMin > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-600">Time saved</span>
              <span className={`text-lg font-black ${sev.text}`}>
                {Math.abs(decision.savingsMin)} <span className="text-xs font-normal">min</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── AI Transparency Panel ───────────────────────────────────────── */}
      {transparencyPoints?.length > 0 && (
        <div className="px-5 mt-3 shrink-0">
          <TransparencyPanel points={transparencyPoints} />
        </div>
      )}

      {/* ── Route stats ─────────────────────────────────────────────────── */}
      {primaryRoute && (
        <div className="px-5 mt-4 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-3 px-1">Route Analysis</p>
          <div className="flex gap-2">
            <StatPill icon={<Clock className="w-3.5 h-3.5" />} value={`${primaryRoute.durationMin}m`} label="Drive time" highlight={false} />
            <StatPill icon={<Ruler className="w-3.5 h-3.5" />} value={`${primaryRoute.distanceKm}km`} label="Distance"   highlight={false} />
            {altRoute && (
              <StatPill icon={<Car className="w-3.5 h-3.5" />} value={`${altRoute.durationMin}m`} label="Alt route" highlight={altRoute.durationMin < primaryRoute.durationMin} />
            )}
          </div>
        </div>
      )}

      {/* ── Smart Departure Hint ────────────────────────────────────────── */}
      <SmartDepartureHint data={smartDeparture} />

      {/* ── Inter-district / geo-risk alert ──────────────────────────────── */}
      {districtAlert && (
        <div className="mx-5 mt-3 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 animate-fade-up shrink-0 shadow-sm">
          <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">District Alert</p>
          <p className="text-xs text-gray-700 leading-relaxed">{districtAlert.message}</p>
        </div>
      )}

      {/* ── Destination district badge ─────────────────────────────────── */}
      {journey?.destDistrict && (
        <div className="mx-5 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shrink-0 shadow-sm">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Destination district</span>
          <span className="ml-auto text-xs font-bold text-blue-600">{journey.destDistrict.name}</span>
        </div>
      )}

      {/* ── Transport alternatives button ─────────────────────────────── */}
      {journey && (
        <div className="px-5 mt-4 shrink-0">
          <button
            onClick={onShowTransport}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🚌</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Public Transport Options</p>
                <p className="text-xs text-gray-500">Metro · Bus · Auto · Water Metro</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
      )}

      {/* ── Gamification strip ────────────────────────────────────────── */}
      <GamificationStrip stats={lifetimeStats} />

      {/* ── Reset ────────────────────────────────────────────────────────── */}
      {journey && (
        <div className="px-5 mt-3 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New Journey
          </button>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="mt-auto px-5 py-5 border-t border-gray-100 shrink-0">
        <p className="text-[10px] text-gray-400 text-center tracking-wider">
          Google Maps · Routes API · Gemini 2.0 Flash
        </p>
      </div>
    </div>
  );
}
