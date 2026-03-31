const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set');

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

function safeParseJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fall through */ }
  }
  return null;
}

// ── Route Insight + Voice Script ─────────────────────────────────────────────
export async function generateRouteInsight({
  routeLabel,
  drivingTimeMin,
  transitTimeMin,
  switchTriggered,
  hubName,
  timeSavingsMin,
  parkingAvailability,
}) {
  const prompt = `You are TransitFlow AI, an intelligent mobility assistant for Kochi, Kerala.
Analyse this commute situation and respond ONLY with valid JSON (no markdown fences):

Route: ${routeLabel}
Driving time (with live traffic): ${drivingTimeMin} minutes
Transit time via ${hubName}: ${transitTimeMin} minutes
Switch-point triggered: ${switchTriggered}
Time savings if switching: ${Math.round(timeSavingsMin)} minutes
Parking at ${hubName}: ${parkingAvailability}

Return exactly this JSON shape:
{
  "insight": "<two urgent, specific sentences about this commute — reference the route name and numbers>",
  "voiceScript": "<30-word max hands-free alert the driver hears, conversational and direct>"
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = safeParseJSON(text);
    if (parsed?.insight && parsed?.voiceScript) return parsed;
    throw new Error('bad shape');
  } catch {
    // Graceful fallback — no API key or quota hit
    const action = switchTriggered
      ? `Switch to metro at ${hubName} and save ${Math.round(timeSavingsMin)} minutes.`
      : `Traffic is manageable — driving is optimal for ${routeLabel} right now.`;
    return {
      insight: `Live traffic on ${routeLabel} is adding ${drivingTimeMin - transitTimeMin} extra minutes to your drive. ${action}`,
      voiceScript: switchTriggered
        ? `Traffic alert on ${routeLabel}! Take the metro from ${hubName}. You'll save ${Math.round(timeSavingsMin)} minutes. Parking is ${parkingAvailability}.`
        : `Route looks clear. Drive time is ${drivingTimeMin} minutes. You're on schedule.`,
    };
  }
}

// ── Parking Availability Simulation ──────────────────────────────────────────
export async function simulateParkingAvailability(hubName, currentHour) {
  const prompt = `You are a parking prediction model for ${hubName} transit station in Kochi, Kerala.
Current hour (24h): ${currentHour}

Based on typical Kerala commuter patterns, predict parking.
Return ONLY valid JSON (no markdown fences):
{
  "availability": "<High|Medium|Low|Full>",
  "slotsAvailable": <integer 0–200>,
  "tip": "<one actionable sentence for the commuter>"
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = safeParseJSON(text);
    if (parsed?.availability) return parsed;
    throw new Error('bad shape');
  } catch {
    // Time-of-day heuristic fallback
    const h = currentHour;
    if (h >= 8 && h <= 10)  return { availability: 'Low',    slotsAvailable: 12,  tip: 'Peak hour — arrive 20 mins early to secure a spot.' };
    if (h >= 17 && h <= 19) return { availability: 'Low',    slotsAvailable: 8,   tip: 'Evening rush — very limited slots. Consider carpooling.' };
    if (h >= 11 && h <= 16) return { availability: 'High',   slotsAvailable: 130, tip: 'Good availability — no rush to arrive early.' };
    return                         { availability: 'Medium', slotsAvailable: 65,  tip: 'Moderate availability — plan to arrive on time.' };
  }
}
