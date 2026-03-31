import { Train, Car, ChevronDown, Zap, Fuel, ParkingCircle, Loader2 } from 'lucide-react';
import { HUB_COLORS } from '../data/kochiData';

// ── Route selector pill ───────────────────────────────────────────────────────
function RouteSelector({ routes, selectedRoute, onSelect, disabled }) {
  return (
    <div className="relative">
      <select
        value={selectedRoute.id}
        onChange={(e) => onSelect(routes.find((r) => r.id === e.target.value))}
        disabled={disabled}
        className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 pr-10 text-sm font-semibold text-white cursor-pointer hover:border-[#b026ff]/40 focus:outline-none focus:border-[#b026ff]/60 transition-all disabled:opacity-50"
      >
        {routes.map((r) => (
          <option key={r.id} value={r.id} className="bg-[#0e0e0e]">
            {r.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ icon, label, value, highlight }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
        highlight
          ? 'bg-gradient-to-r from-[#b026ff]/15 to-transparent border border-[#b026ff]/40'
          : 'bg-white/5 border border-white/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${highlight ? 'bg-[#b026ff] shadow-[0_0_16px_rgba(176,38,255,0.5)]' : 'bg-white/8'}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>
      <span className={`text-base font-bold ${highlight ? 'text-[#b026ff]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SidebarCalculator({
  routes,
  selectedRoute,
  onRouteSelect,
  onAnalyze,
  analysis,
  isAnalyzing,
}) {
  const { switchPoint, drivingCost, transitCost, moneySavings } = analysis || {};
  const hubColor = switchPoint?.hub ? HUB_COLORS[switchPoint.hub.type] : null;

  return (
    <div className="relative z-10 w-full sm:w-[420px] h-full bg-[#050505]/85 backdrop-blur-2xl border-r border-[#b026ff]/15 flex flex-col shadow-[10px_0_60px_rgba(0,0,0,0.6)] overflow-y-auto pointer-events-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#b026ff]/25 to-[#b026ff]/5 flex items-center justify-center border border-[#b026ff]/40 shadow-[0_0_20px_rgba(176,38,255,0.2)]">
            <Train className="text-[#b026ff] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">
              Transit<span className="text-[#b026ff]">Flow</span> <span className="text-sm font-medium text-gray-500 tracking-normal">AI</span>
            </h1>
            <p className="text-[11px] text-gray-600 tracking-widest uppercase mt-0.5">Kerala Mobility Orchestrator</p>
          </div>
        </div>
      </div>

      {/* ── Route selector ───────────────────────────────────────────────────── */}
      <div className="px-8 pt-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-3">Select Commute</p>
        <RouteSelector
          routes={routes}
          selectedRoute={selectedRoute}
          onSelect={onRouteSelect}
          disabled={isAnalyzing}
        />
        {selectedRoute && (
          <p className="text-xs text-gray-600 mt-2 px-1">{selectedRoute.description} · {selectedRoute.distanceKm} km</p>
        )}
      </div>

      {/* ── Analyse button ───────────────────────────────────────────────────── */}
      <div className="px-8 mt-5">
        <button
          onClick={() => onAnalyze(selectedRoute)}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-[#b026ff] hover:shadow-[0_0_40px_rgba(176,38,255,0.45)] hover:-translate-y-0.5 active:translate-y-0 text-white"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Detect Switch Point
            </>
          )}
        </button>
      </div>

      {/* ── Analysis results ─────────────────────────────────────────────────── */}
      {analysis && (
        <div className="px-8 mt-8 flex-1 flex flex-col gap-4">

          {/* Switch point alert banner */}
          {switchPoint?.triggered ? (
            <div className="relative overflow-hidden rounded-2xl p-4 border border-[#b026ff]/50 bg-[#b026ff]/10 animate-fade-up">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#b026ff] to-transparent" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#b026ff] flex items-center justify-center shadow-[0_0_16px_rgba(176,38,255,0.5)] animate-pulse-dot shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#b026ff] uppercase tracking-wider">Switch Point Active</p>
                  <p className="text-sm text-white font-medium mt-0.5">
                    Exit at{' '}
                    <span className="font-bold" style={{ color: hubColor?.fill }}>
                      {switchPoint.hub.name}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-400">You save</span>
                <span className="text-white font-black text-lg">
                  {Math.round(switchPoint.timeSavingsMin)}{' '}
                  <span className="text-sm text-[#b026ff] font-medium">min</span>
                </span>
              </div>
            </div>
          ) : switchPoint && (
            <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30 animate-fade-up">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Drive Recommended</p>
              <p className="text-sm text-gray-300 mt-1">Traffic is acceptable — no escape hatch needed right now.</p>
            </div>
          )}

          {/* Time comparison */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-3">Time Analysis</p>
            <div className="space-y-2">
              <StatRow
                icon={<Car className="w-4 h-4 text-gray-300" />}
                label="Driving (live traffic)"
                value={`${switchPoint?.drivingTimeMin ?? '–'} min`}
                highlight={false}
              />
              <StatRow
                icon={<Train className="w-4 h-4 text-white" />}
                label={`Via ${switchPoint?.hub?.shortName ?? 'transit'}`}
                value={`${switchPoint?.transitTimeMin ?? '–'} min`}
                highlight={switchPoint?.triggered}
              />
            </div>
          </div>

          {/* Fare-Link cost comparison */}
          {drivingCost && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-3">Fare-Link Analysis</p>
              <div className="space-y-2">
                <StatRow
                  icon={<Fuel className="w-4 h-4 text-gray-300" />}
                  label="Fuel cost"
                  value={`₹${drivingCost.fuel}`}
                  highlight={false}
                />
                <StatRow
                  icon={<ParkingCircle className="w-4 h-4 text-gray-300" />}
                  label="Parking (8 hrs)"
                  value={`₹${drivingCost.parking}`}
                  highlight={false}
                />
                <StatRow
                  icon={<Train className="w-4 h-4 text-white" />}
                  label="Transit (return)"
                  value={`₹${transitCost}`}
                  highlight={true}
                />
              </div>
            </div>
          )}

          {/* Savings card */}
          {moneySavings !== undefined && (
            <div className="relative overflow-hidden rounded-3xl p-[1px] mt-2 shadow-[0_8px_40px_rgba(176,38,255,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b026ff] to-transparent bg-[length:200%_auto] animate-shimmer opacity-60" />
              <div className="relative bg-[#080808] rounded-3xl p-6 flex flex-col items-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold">Daily Savings</p>
                <p className="text-5xl font-black tracking-tight bg-gradient-to-b from-white to-[#b026ff]/60 text-transparent bg-clip-text mt-1">
                  ₹{Math.max(0, moneySavings)}
                </p>
                <p className="text-xs text-[#b026ff] mt-2 font-medium tracking-wide opacity-90">
                  {moneySavings > 0 ? 'Choosing transit over driving' : 'Driving is cost-effective today'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-8 py-6 mt-auto">
        <p className="text-[10px] text-gray-700 text-center tracking-wider">
          Powered by Google Maps · Gemini 1.5 Flash
        </p>
      </div>
    </div>
  );
}
