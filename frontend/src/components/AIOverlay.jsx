import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Zap, Car, Train, Droplets, Bus, ParkingCircle, X } from 'lucide-react';
import { HUB_COLORS } from '../data/kochiData';

// ── Helpers ───────────────────────────────────────────────────────────────────
function hubIcon(type) {
  if (type === 'metro')       return <Train className="w-4 h-4" />;
  if (type === 'water_metro') return <Droplets className="w-4 h-4" />;
  return                             <Bus className="w-4 h-4" />;
}

function hubLabel(type) {
  if (type === 'metro')       return 'Metro';
  if (type === 'water_metro') return 'Water Metro';
  return 'Bus';
}

function availabilityColor(avail) {
  if (avail === 'High')   return 'text-emerald-400';
  if (avail === 'Medium') return 'text-yellow-400';
  if (avail === 'Low')    return 'text-orange-400';
  return 'text-red-500';
}

// ── Web Speech API voice ───────────────────────────────────────────────────────
function speakText(text, onEnd) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const best =
    voices.find((v) => v.lang === 'en-IN') ||
    voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0];
  if (best) utterance.voice = best;
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIOverlay({ analysis, geminiData, isAnalyzing, onDismiss }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpokenAuto, setHasSpokenAuto] = useState(false);
  const prevTrigger = useRef(null);

  // Auto-speak once when a new switch-point fires
  useEffect(() => {
    const triggered = analysis?.switchPoint?.triggered;
    const script = geminiData?.voiceScript;
    if (triggered && script && script !== prevTrigger.current) {
      prevTrigger.current = script;
      setHasSpokenAuto(false);
    }
  }, [analysis, geminiData]);

  useEffect(() => {
    if (!hasSpokenAuto && analysis?.switchPoint?.triggered && geminiData?.voiceScript) {
      setHasSpokenAuto(true);
      setIsSpeaking(true);
      speakText(geminiData.voiceScript, () => setIsSpeaking(false));
    }
  }, [hasSpokenAuto, analysis, geminiData]);

  const handleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (geminiData?.voiceScript) {
      setIsSpeaking(true);
      speakText(geminiData.voiceScript, () => setIsSpeaking(false));
    }
  };

  // Nothing to show yet
  if (!analysis && !isAnalyzing) return null;

  const { switchPoint, parking } = analysis || {};
  const triggered = switchPoint?.triggered;
  const hubColor = switchPoint?.hub ? HUB_COLORS[switchPoint.hub.type] : null;

  return (
    <div className="animate-fade-up absolute bottom-6 left-[440px] right-6 z-20 pointer-events-auto">
      <div
        className={`relative rounded-3xl overflow-hidden border backdrop-blur-2xl shadow-2xl ${
          triggered
            ? 'border-[#b026ff]/50 bg-[#b026ff]/10 shadow-[0_8px_60px_rgba(176,38,255,0.25)]'
            : 'border-white/10 bg-black/60'
        }`}
      >
        {/* Top shimmer line when triggered */}
        {triggered && (
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#b026ff] to-transparent bg-[length:200%_auto] animate-shimmer" />
        )}

        <div className="p-5 flex flex-col gap-4">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                  triggered
                    ? 'bg-[#b026ff] shadow-[0_0_20px_rgba(176,38,255,0.6)] animate-pulse-dot'
                    : 'bg-white/10'
                }`}
              >
                <Zap className={`w-5 h-5 ${triggered ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-[0.18em] ${triggered ? 'text-[#b026ff]' : 'text-gray-500'}`}>
                  {isAnalyzing ? 'Analysing route…' : triggered ? 'Switch Point Detected' : 'Route Analysis'}
                </p>
                {!isAnalyzing && geminiData?.insight && (
                  <p className="text-sm text-gray-200 leading-snug mt-1 line-clamp-2">
                    {geminiData.insight}
                  </p>
                )}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 border-2 border-[#b026ff] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Calculating with live traffic…</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Voice button */}
              {geminiData?.voiceScript && !isAnalyzing && (
                <button
                  onClick={handleVoice}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isSpeaking
                      ? 'bg-[#b026ff] shadow-[0_0_15px_rgba(176,38,255,0.5)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={isSpeaking ? 'Stop voice' : 'Play AI voice alert'}
                >
                  {isSpeaking
                    ? <MicOff className="w-4 h-4 text-white" />
                    : <Mic className="w-4 h-4 text-gray-300" />}
                </button>
              )}
              {/* Dismiss */}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* ── Detail cards (only when analysis is ready) ─────────────────── */}
          {!isAnalyzing && switchPoint && (
            <div className="grid grid-cols-3 gap-3">

              {/* Drive vs Transit times */}
              <div className="col-span-1 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2.5">
                  <Car className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Drive</p>
                    <p className="text-sm font-bold text-white">{switchPoint.drivingTimeMin} <span className="text-xs text-gray-400 font-normal">min</span></p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
                  style={{
                    background: hubColor ? `${hubColor.fill}18` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${hubColor ? hubColor.fill + '50' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <span style={{ color: hubColor?.fill || '#aaa' }}>
                    {hubIcon(switchPoint.hub.type)}
                  </span>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{hubLabel(switchPoint.hub.type)}</p>
                    <p className="text-sm font-bold text-white">{switchPoint.transitTimeMin} <span className="text-xs text-gray-400 font-normal">min</span></p>
                  </div>
                </div>
              </div>

              {/* Escape Hatch hub info */}
              <div className="col-span-1 bg-white/5 rounded-2xl p-3 flex flex-col justify-between">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Escape Hatch</p>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{switchPoint.hub.name}</p>
                  <p
                    className="text-xs font-medium mt-0.5 uppercase tracking-wider"
                    style={{ color: hubColor?.fill || '#aaa' }}
                  >
                    {hubLabel(switchPoint.hub.type)}
                  </p>
                </div>
              </div>

              {/* Parking */}
              <div className="col-span-1 bg-white/5 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <ParkingCircle className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Parking</p>
                </div>
                {parking ? (
                  <div>
                    <p className={`text-sm font-bold ${availabilityColor(parking.availability)}`}>
                      {parking.availability}
                    </p>
                    <p className="text-xs text-gray-400">{parking.slotsAvailable} slots</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Checking…</p>
                )}
              </div>
            </div>
          )}

          {/* ── Time savings banner ────────────────────────────────────────── */}
          {!isAnalyzing && triggered && switchPoint && (
            <div className="flex items-center justify-between bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-2xl px-4 py-2.5">
              <span className="text-xs text-[#b026ff] font-bold uppercase tracking-wider">Time saved by switching</span>
              <span className="text-xl font-black text-white">
                {Math.round(switchPoint.timeSavingsMin)}{' '}
                <span className="text-sm font-normal text-[#b026ff]">min</span>
              </span>
            </div>
          )}

          {/* Parking tip */}
          {!isAnalyzing && parking?.tip && (
            <p className="text-xs text-gray-500 leading-relaxed px-1">{parking.tip}</p>
          )}
        </div>
      </div>
    </div>
  );
}
