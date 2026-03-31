import { useEffect, useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

const LEVEL_STYLES = {
  critical: {
    bg: 'bg-red-50 border-red-200',
    border: 'border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700',
    label: 'CRITICAL TRAFFIC',
    icon: '🚨',
  },
  high: {
    bg: 'bg-orange-50 border-orange-200',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    text: 'text-orange-700',
    label: 'HEAVY TRAFFIC',
    icon: '⚠️',
  },
  medium: {
    bg: 'bg-yellow-50 border-yellow-200',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700',
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
      <div className={`relative ${style.bg} border-l-4 ${style.border} rounded-xl shadow-md overflow-hidden bg-white`}>

        <div className="flex items-center gap-4 px-5 py-3.5">
          {/* Indicator */}
          <div className="relative shrink-0">
            <div className={`w-3 h-3 rounded-full ${style.dot} animate-pulse-dot`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${style.text}`}>
                {style.label}
              </span>
            </div>
            <p className="text-sm text-gray-900 font-medium mt-0.5">
              {decision?.headline ?? 'Heavy traffic detected ahead on your route'}
            </p>
            {hotspots.length > 0 && (
              <p className="text-[11px] text-gray-600 mt-0.5">
                Congestion at: {hotspots.slice(0, 2).map((h) => h.name).join(' · ')}
              </p>
            )}
          </div>

          {/* CTA */}
          {onViewOptions && (
            <button
              onClick={onViewOptions}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${style.border} ${style.text} hover:bg-white/50 transition-all shadow-sm`}
            >
              Options <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => { setDismissed(true); setVisible(false); }}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
