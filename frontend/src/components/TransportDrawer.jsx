import { X, Clock, Wallet, ArrowUpRight, Star } from 'lucide-react';

const TYPE_BG = {
  metro: 'bg-purple-50',
  bus:   'bg-orange-50',
  water: 'bg-cyan-50',
  auto:  'bg-yellow-50',
};

function TransportCard({ option, primaryDurationMin }) {
  const timeDiff = primaryDurationMin ? primaryDurationMin - option.totalMin : null;
  const isFaster = timeDiff > 0;

  return (
    <div
      className={`relative shrink-0 w-[200px] rounded-xl ${TYPE_BG[option.type] ?? 'bg-white'} border ${option.recommended ? 'border-blue-300 shadow-sm' : 'border-gray-200'} p-4 flex flex-col gap-3 overflow-hidden transition-all hover:scale-[1.02] hover:border-blue-400`}
    >
      {/* Recommended badge */}
      {option.recommended && (
        <div className="absolute top-3 right-3">
          <Star className="w-3.5 h-3.5 fill-current" style={{ color: option.color }} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">{option.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{option.name}</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">{option.type}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{option.totalMin} min total</span>
          </div>
          {timeDiff !== null && (
            <span className={`text-xs font-bold ${isFaster ? 'text-emerald-600' : 'text-gray-500'}`}>
              {isFaster ? `${timeDiff}m faster` : `${Math.abs(timeDiff)}m slower`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-gray-600">
          <Wallet className="w-3 h-3" />
          <span className="text-xs">₹{option.fare}</span>
          {option.walkToStopMin > 0 && (
            <span className="text-[10px] text-gray-500 ml-auto">{option.walkToStopMin}m walk</span>
          )}
        </div>
      </div>

      {/* Next departure */}
      <div
        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl text-center"
        style={{ background: `${option.color}18`, color: option.color }}
      >
        {option.nextDeparturMin === 0
          ? 'Available now'
          : `Next in ${option.nextDeparturMin} min`}
      </div>

      {/* Pros */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {option.pros.slice(0, 2).map((p) => (
          <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TransportDrawer({ options, primaryDurationMin, onClose }) {
  if (!options?.length) return null;

  return (
    <div className="absolute bottom-0 left-[380px] right-0 z-20 pointer-events-auto animate-fade-up">
      <div className="relative bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Public Transport Options</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {(() => {
                const faster = options.filter((o) => o.fasterThanDriving).length;
                const recommended = options.filter((o) => o.recommended).length;
                if (faster > 0) return `${faster} option${faster > 1 ? 's' : ''} faster than driving`;
                if (recommended > 0) return `${recommended} option${recommended > 1 ? 's' : ''} recommended`;
                return 'All options available';
              })()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto px-6 pb-6 no-scrollbar">
          {options.map((opt) => (
            <TransportCard
              key={opt.id}
              option={opt}
              primaryDurationMin={primaryDurationMin}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
