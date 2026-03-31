const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_CONTEXT = `You are "Mova", an AI mobility assistant for all of Kerala, India.
You cover all 14 districts: Thiruvananthapuram, Kollam, Pathanamthitta, Alappuzha, Kottayam, Idukki, Ernakulam (Kochi), Thrissur, Palakkad, Malappuram, Kozhikode, Wayanad, Kannur, and Kasaragod.

Key transport knowledge:
- Kochi Metro: Aluva to Petta (17 stations), best for Ernakulam city travel
- KSRTC: State-wide bus network, super-fast and Swift AC services for inter-district travel
- Indian Railways: Main coastal line runs TVM to Kasaragod (Mangalore), with stops at all major cities. Intercity Express trains are fastest for long distance.
- Highways: NH 66 (coastal TVM–Kasaragod), MC Road (TVM–Kottayam–Ernakulam), NH 544 (Kochi–Palakkad–Coimbatore)
- Water transport: Kochi Water Metro, Alappuzha–Kollam boat service, Vembanad ferry
- Hazard zones: Idukki & Wayanad have landslide-prone ghat roads; Alappuzha is flood-prone in monsoon; Palakkad is extremely hot in summer
- Airports: CIAL (Kochi), TVM (Trivandrum), CCJ (Calicut/Kozhikode), Kannur International

Keep answers concise (2-4 sentences max). Be friendly, direct, and district-specific when relevant.
Always consider traffic level, weather, and the best mode of transport for the distance involved.
For inter-district journeys (>50 km), trains or KSRTC are usually better than driving.`;

export async function sendChatMessage(messages, journeyContext = null) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Build context prefix
  let contextText = SYSTEM_CONTEXT;
  if (journeyContext) {
    const { origin, destination, trafficLevel, weather, decision } = journeyContext;
    contextText += `\n\nCurrent journey context:
- From: ${origin?.address ?? 'Unknown'}
- To: ${destination?.address ?? 'Unknown'}
- Traffic: ${trafficLevel ?? 'unknown'}
- Weather: ${weather?.condition ?? 'unknown'}, ${weather?.temp ?? '?'}°C
- AI Decision: ${decision?.headline ?? 'No active recommendation'}`;
  }

  // Build contents array: system context as first user message, then conversation
  const contents = [
    { role: 'user',  parts: [{ text: contextText }] },
    { role: 'model', parts: [{ text: 'Got it! I\'m Mova, your Kochi mobility assistant. How can I help you navigate today?' }] },
    ...messages.map((m) => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  if (!apiKey) return getMockResponse(messages.at(-1)?.content ?? '');

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 256 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch {
    return getMockResponse(messages.at(-1)?.content ?? '');
  }
}

function getMockResponse(question) {
  const q = question.toLowerCase();
  if (q.includes('metro'))           return 'Kochi Metro runs from Aluva to Petta (17 stations). During peak hours it\'s the fastest way through Ernakulam — no traffic jams! Trains run every 8 minutes.';
  if (q.includes('traffic'))         return 'Peak hour congestion in Kerala is worst at Edappally (Kochi), Kozhikode city, Trivandrum NH 66 stretch, and Thrissur roundabout. Switch to train or KSRTC for inter-city trips.';
  if (q.includes('rain') || q.includes('monsoon')) return 'During Kerala monsoon, avoid Idukki/Wayanad ghat roads due to landslide risk, and Alappuzha low-lying areas due to flooding. Trains are the safest bet for inter-district travel.';
  if (q.includes('airport'))         return 'Kerala has 4 airports: Kochi (CIAL), Trivandrum, Kozhikode (CCJ), and Kannur. For CIAL, take NH 66 via Edappally or connect at Aluva Metro. Allow 60-90 min from Kochi centre during peak hours.';
  if (q.includes('train') || q.includes('rail')) return 'The coastal railway (TVM–Kasaragod) connects all major Kerala cities. Intercity Express and Jan Shatabdi trains are fastest. Book at IRCTC or check times at the station.';
  if (q.includes('ksrtc') || q.includes('bus'))  return 'KSRTC connects all 14 Kerala districts. Super Fast buses are economical, Swift AC buses are comfortable. Major stands: TVM, Ernakulam, Kozhikode, Kannur, Thrissur.';
  if (q.includes('wayanad'))         return 'Wayanad ghat roads are scenic but dangerous in rain. From Kozhikode take Thamarassery Churam (NH 766) or from Mysore side. No train — buses and private cabs are the only options.';
  if (q.includes('munnar'))          return 'Munnar is best reached from Kochi via Kothamangalam (NH 85). Allow 3-4 hours. Avoid Munnar road during monsoon or early morning fog. No train or bus express — road only.';
  if (q.includes('auto'))            return 'Autos are everywhere in Kerala cities. Meters start at ₹30/km. Rapido, InDrive and Ola also operate in Kochi, Trivandrum, and Kozhikode. Ideal for last-mile connectivity.';
  return 'I\'m Mova, your Kerala-wide mobility assistant! Ask me about routes between any of Kerala\'s 14 districts, traffic hotspots, KSRTC, trains, or the Kochi Metro.';
}
