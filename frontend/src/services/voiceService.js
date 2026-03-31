// ── Voice AI — Web Speech API narrator ───────────────────────────────────────
// Speaks route decisions in Indian English with a graceful fallback.

let voiceReady = false;

// Pre-load voice list (browsers load voices async on first call)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => { voiceReady = true; };
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'en-IN') ||
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => v.lang.startsWith('en')) ||
    null
  );
}

export function speak(text, { rate = 0.92, pitch = 1.05, volume = 1 } = {}) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.rate   = rate;
  utt.pitch  = pitch;
  utt.volume = volume;

  const doSpeak = () => {
    const voice = pickVoice();
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  };

  // Voices may not be loaded on first call — retry after a tick
  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    setTimeout(doSpeak, 200);
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// ── Build the voice script from journey data ──────────────────────────────────
export function buildVoiceScript({ decision, primaryRoute, altRoute, weather, emergencyMode }) {
  if (emergencyMode) {
    return `Emergency mode active. Fastest route locked in. Estimated drive time: ${primaryRoute?.durationMin} minutes. Stay alert and drive safe.`;
  }

  const dur  = primaryRoute?.durationMin ?? '?';
  const dist = primaryRoute?.distanceKm  ?? '?';

  switch (decision?.type) {
    case 'public_transport': {
      const transit = decision.transportSuggestion?.name ?? 'public transport';
      const saving  = Math.abs(decision.savingsMin ?? 0);
      return `Traffic alert on your route. TransitFlow recommends switching to ${transit}. You can save approximately ${saving} minutes and avoid congestion entirely.`;
    }
    case 'alternate_route': {
      const saving = decision.savingsMin ?? 0;
      return `Heavy traffic detected. An alternate route saves you ${saving} minutes. The AI Smart route is highlighted on your map in green.`;
    }
    case 'weather_advisory': {
      return `Weather advisory in effect. ${decision.reason?.split('.')[0] ?? 'Conditions are difficult'}. Consider public transport for a safer, faster journey.`;
    }
    case 'drive_recommended':
      return `Roads are clear. Your route is ${dist} kilometres, approximately ${dur} minutes. Have a safe journey.`;
    default:
      return `Route calculated. ${dist} kilometres, estimated ${dur} minutes to your destination.`;
  }
}
