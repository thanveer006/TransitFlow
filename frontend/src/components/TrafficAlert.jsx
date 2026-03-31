import { useEffect, useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

const LEVEL_STYLES = {
  critical: {
    bg: 'from-red-600/20 to-red-900/10',
    border: 'border-red-500/50',
    dot: 'bg-red-500',
    text: 'text-red-400',
    label: 'CRITICAL TRAFFIC',
    icon: '🚨',
  },
  high: {
    bg: 'from-orange-600/20 to-orange-900/10',
    border: 'border-orange-500/50',
    dot: 'bg-orange-500',
    text: 'text-orange-400',
    label: 'HEAVY TRAFFIC',
    icon: '⚠️',
  },
  medium: {
    bg: 'from-yellow-600/15 to-yellow-900/8',
    border: 'border-yellow-500/40',
    dot: 'bg-yellow-500',
    text: 'text-yellow-400',
    label: 'MODERATE TRAFFIC',
    icon: '🟡',
  },
};

export default function TrafficAlert({ trafficLevel, hotspots = [], decision, onViewOptions }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ((trafficLevel === 'critical' || trafficLevel === 'high') && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [trafficLevel, dismissed]);

  if (!visible || !LEVEL_STYLES[trafficLevel]) return null;

  const style = LEVEL_STYLES[trafficLevel];

  return (
    <div className={`absolute top-5 left-[390px] right-[240px] z-30 pointer-events-auto transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className={`relative bg-gradient-to-r ${style.bg} border ${style.border} rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden`}>

        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />

        <div className="flex items-center gap-4 px-5 py-3.5">
          {/* Pulsing indicator */}
          <div className="relative shrink-0">
            <div className={`w-3 h-3 rounded-full ${style.dot} animate-pulse-dot`} />
            <div className={`absolute inset-0 rounded-full ${style.dot} animate-pulse-ring opacity-50`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${style.text}`}>
                {style.label}
              </span>
            </div>
            <p className="text-sm text-white font-medium mt-0.5">
              {decision?.headline ?? 'Heavy traffic detected ahead on your route'}
            </p>
            {hotspots.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Congestion at: {hotspots.slice(0, 2).map((h) => h.name).join(' · ')}
              </p>
            )}
          </div>

          {/* CTA */}
          {onViewOptions && (
            <button
              onClick={onViewOptions}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${style.border} ${style.text} hover:bg-white/5 transition-all`}
            >
              Options <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => { setDismissed(true); setVisible(false); }}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
