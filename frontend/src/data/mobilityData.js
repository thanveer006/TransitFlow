// Smart Mobility Assistant — Kerala State-Wide Dataset (all 14 districts)

// ── Map constants ────────────────────────────────────────────────────────────
export const KERALA_CENTER   = { lat: 10.5276, lng: 76.2144 }; // Geographic centre of Kerala
export const DEFAULT_CENTER  = KERALA_CENTER;
export const KERALA_BOUNDS   = { north: 12.80, south: 8.17, east: 77.42, west: 74.86 };
export const KERALA_MAP_ZOOM = 8; // State-level zoom

// ── All 14 Kerala Districts ──────────────────────────────────────────────────
export const KERALA_DISTRICTS = [
  { id: 'tvm',   name: 'Thiruvananthapuram', lat: 8.5241,  lng: 76.9366, zone: 'south' },
  { id: 'kol',   name: 'Kollam',             lat: 8.8932,  lng: 76.6141, zone: 'south' },
  { id: 'pta',   name: 'Pathanamthitta',     lat: 9.2648,  lng: 76.7870, zone: 'south' },
  { id: 'alp',   name: 'Alappuzha',          lat: 9.4981,  lng: 76.3388, zone: 'central' },
  { id: 'kot',   name: 'Kottayam',           lat: 9.5916,  lng: 76.5222, zone: 'central' },
  { id: 'idk',   name: 'Idukki',             lat: 9.9189,  lng: 77.1025, zone: 'central' },
  { id: 'ekm',   name: 'Ernakulam (Kochi)',  lat: 9.9312,  lng: 76.2673, zone: 'central' },
  { id: 'tsr',   name: 'Thrissur',           lat: 10.5276, lng: 76.2144, zone: 'central' },
  { id: 'pkd',   name: 'Palakkad',           lat: 10.7867, lng: 76.6548, zone: 'north' },
  { id: 'mlp',   name: 'Malappuram',         lat: 11.0510, lng: 76.0711, zone: 'north' },
  { id: 'kzd',   name: 'Kozhikode',          lat: 11.2588, lng: 75.7804, zone: 'north' },
  { id: 'wyd',   name: 'Wayanad',            lat: 11.6854, lng: 76.1320, zone: 'north' },
  { id: 'knr',   name: 'Kannur',             lat: 11.8745, lng: 75.3704, zone: 'north' },
  { id: 'ksd',   name: 'Kasaragod',          lat: 12.4996, lng: 74.9869, zone: 'north' },
];

// ── Key transport hubs across Kerala ─────────────────────────────────────────
export const KEY_LOCATIONS = [
  // ── Airports ───────────────────────────────────────────────────────────────
  { id: 'cial',        name: 'Cochin Intl Airport (CIAL)',      district: 'ekm', type: 'airport',  lat: 10.1520, lng: 76.4019, congestionRisk: 'high' },
  { id: 'tvm_apt',     name: 'Trivandrum Intl Airport',         district: 'tvm', type: 'airport',  lat: 8.4821,  lng: 76.9201, congestionRisk: 'high' },
  { id: 'clt_apt',     name: 'Calicut Intl Airport (CCJ)',      district: 'kzd', type: 'airport',  lat: 11.1368, lng: 75.9529, congestionRisk: 'medium' },
  { id: 'knr_apt',     name: 'Kannur International Airport',    district: 'knr', type: 'airport',  lat: 11.9186, lng: 75.5497, congestionRisk: 'medium' },

  // ── Railway Stations ────────────────────────────────────────────────────────
  { id: 'tvm_rail',    name: 'Trivandrum Central Railway',      district: 'tvm', type: 'railway', lat: 8.4883,  lng: 76.9526, congestionRisk: 'high' },
  { id: 'kol_rail',    name: 'Kollam Junction Railway',         district: 'kol', type: 'railway', lat: 8.8870,  lng: 76.5962, congestionRisk: 'medium' },
  { id: 'alp_rail',    name: 'Alappuzha Railway Station',       district: 'alp', type: 'railway', lat: 9.4976,  lng: 76.3288, congestionRisk: 'medium' },
  { id: 'kot_rail',    name: 'Kottayam Railway Station',        district: 'kot', type: 'railway', lat: 9.5845,  lng: 76.5188, congestionRisk: 'medium' },
  { id: 'ern_north',   name: 'Ernakulam North Railway',         district: 'ekm', type: 'railway', lat: 9.9841,  lng: 76.2886, congestionRisk: 'high' },
  { id: 'ern_south',   name: 'Ernakulam South Railway',         district: 'ekm', type: 'railway', lat: 9.9601,  lng: 76.2870, congestionRisk: 'high' },
  { id: 'aluva_rail',  name: 'Aluva Railway Station',           district: 'ekm', type: 'railway', lat: 10.1004, lng: 76.3573, congestionRisk: 'medium' },
  { id: 'tsr_rail',    name: 'Thrissur Railway Station',        district: 'tsr', type: 'railway', lat: 10.5156, lng: 76.2215, congestionRisk: 'medium' },
  { id: 'pkd_rail',    name: 'Palakkad Junction Railway',       district: 'pkd', type: 'railway', lat: 10.7756, lng: 76.6528, congestionRisk: 'medium' },
  { id: 'shornur',     name: 'Shoranur Junction Railway',       district: 'pkd', type: 'railway', lat: 10.7662, lng: 76.2715, congestionRisk: 'medium' },
  { id: 'kzd_rail',    name: 'Kozhikode Railway Station',       district: 'kzd', type: 'railway', lat: 11.2471, lng: 75.7741, congestionRisk: 'high' },
  { id: 'knr_rail',    name: 'Kannur Railway Station',          district: 'knr', type: 'railway', lat: 11.8716, lng: 75.3700, congestionRisk: 'medium' },
  { id: 'ksd_rail',    name: 'Kasaragod Railway Station',       district: 'ksd', type: 'railway', lat: 12.4966, lng: 74.9880, congestionRisk: 'low' },

  // ── Metro Stations (Kochi Metro) ───────────────────────────────────────────
  { id: 'edap_m',      name: 'Edappally Metro',                 district: 'ekm', type: 'metro',   lat: 10.0209, lng: 76.3097, congestionRisk: 'low' },
  { id: 'palri_m',     name: 'Palarivattom Metro',              district: 'ekm', type: 'metro',   lat: 10.0017, lng: 76.3020, congestionRisk: 'low' },
  { id: 'kaloor_m',    name: 'Kaloor Metro',                    district: 'ekm', type: 'metro',   lat: 9.9889,  lng: 76.2974, congestionRisk: 'low' },
  { id: 'mgrd_m',      name: 'MG Road Metro',                   district: 'ekm', type: 'metro',   lat: 9.9782,  lng: 76.2959, congestionRisk: 'low' },
  { id: 'erns_m',      name: 'Ernakulam South Metro',           district: 'ekm', type: 'metro',   lat: 9.9601,  lng: 76.2870, congestionRisk: 'low' },

  // ── KSRTC Bus Stands ────────────────────────────────────────────────────────
  { id: 'ksrtc_tvm',   name: 'KSRTC Bus Stand Trivandrum',      district: 'tvm', type: 'bus',     lat: 8.4965,  lng: 76.9518, congestionRisk: 'high' },
  { id: 'ksrtc_kol',   name: 'KSRTC Bus Stand Kollam',          district: 'kol', type: 'bus',     lat: 8.8927,  lng: 76.5970, congestionRisk: 'medium' },
  { id: 'ksrtc_ekm',   name: 'KSRTC Bus Stand Ernakulam',       district: 'ekm', type: 'bus',     lat: 9.9659,  lng: 76.2866, congestionRisk: 'high' },
  { id: 'vytilla',     name: 'Vyttila Mobility Hub',             district: 'ekm', type: 'bus',     lat: 9.9589,  lng: 76.3055, congestionRisk: 'medium' },
  { id: 'ksrtc_tsr',   name: 'KSRTC Bus Stand Thrissur',        district: 'tsr', type: 'bus',     lat: 10.5225, lng: 76.2143, congestionRisk: 'medium' },
  { id: 'ksrtc_pkd',   name: 'KSRTC Bus Stand Palakkad',        district: 'pkd', type: 'bus',     lat: 10.7776, lng: 76.6540, congestionRisk: 'medium' },
  { id: 'ksrtc_kzd',   name: 'KSRTC Bus Stand Kozhikode',       district: 'kzd', type: 'bus',     lat: 11.2503, lng: 75.7735, congestionRisk: 'high' },
  { id: 'ksrtc_knr',   name: 'KSRTC Bus Stand Kannur',          district: 'knr', type: 'bus',     lat: 11.8760, lng: 75.3720, congestionRisk: 'medium' },

  // ── Water Transport ─────────────────────────────────────────────────────────
  { id: 'fort_kochi_w',name: 'Fort Kochi Water Metro',           district: 'ekm', type: 'water',   lat: 9.9642,  lng: 76.2378, congestionRisk: 'low' },
  { id: 'alp_boat',    name: 'Alappuzha Boat Terminal',          district: 'alp', type: 'water',   lat: 9.4910,  lng: 76.3230, congestionRisk: 'low' },
  { id: 'kol_boat',    name: 'Kollam Boat Terminal',             district: 'kol', type: 'water',   lat: 8.8889,  lng: 76.5895, congestionRisk: 'low' },

  // ── Tourist Hotspots (high traffic seasonally) ────────────────────────────
  { id: 'munnar',      name: 'Munnar (Tourist Hub)',             district: 'idk', type: 'tourist', lat: 10.0889, lng: 77.0595, congestionRisk: 'high' },
  { id: 'wayanad_wld', name: 'Wayanad Wildlife Sanctuary',       district: 'wyd', type: 'tourist', lat: 11.6030, lng: 76.1335, congestionRisk: 'medium' },
  { id: 'thekkady',    name: 'Thekkady / Periyar',               district: 'idk', type: 'tourist', lat: 9.5967,  lng: 77.1630, congestionRisk: 'medium' },
  { id: 'varkala',     name: 'Varkala Beach',                    district: 'tvm', type: 'tourist', lat: 8.7379,  lng: 76.7163, congestionRisk: 'low' },
  { id: 'kovalam',     name: 'Kovalam Beach',                    district: 'tvm', type: 'tourist', lat: 8.3988,  lng: 76.9783, congestionRisk: 'medium' },
  { id: 'thrissur_pooram', name: 'Thrissur Pooram Grounds',      district: 'tsr', type: 'tourist', lat: 10.5230, lng: 76.2090, congestionRisk: 'high' },
];

// ── State highway / national highway reference points ────────────────────────
// Used to draw approximate hotspot rings along major corridors
export const HIGHWAY_HOTSPOTS = [
  // NH 66 (Coastal Highway — Thiruvananthapuram to Kasaragod)
  { id: 'nh66_tvm',  name: 'NH 66 — Trivandrum City Stretch',    lat: 8.5241,  lng: 76.9366, severity: 'high',   highway: 'NH 66' },
  { id: 'nh66_kol',  name: 'NH 66 — Kollam Bypass',              lat: 8.8932,  lng: 76.6141, severity: 'medium', highway: 'NH 66' },
  { id: 'nh66_alp',  name: 'NH 66 — Alappuzha Junction',         lat: 9.4981,  lng: 76.3388, severity: 'medium', highway: 'NH 66' },
  { id: 'nh66_ekm',  name: 'NH 66 — Edappally (Kochi)',          lat: 10.0192, lng: 76.3093, severity: 'critical', highway: 'NH 66' },
  { id: 'nh66_tsr',  name: 'NH 66 — Thrissur Roundabout',        lat: 10.5156, lng: 76.2215, severity: 'high',   highway: 'NH 66' },
  { id: 'nh66_kzd',  name: 'NH 66 — Kozhikode City',             lat: 11.2588, lng: 75.7804, severity: 'high',   highway: 'NH 66' },
  { id: 'nh66_knr',  name: 'NH 66 — Kannur Town',                lat: 11.8745, lng: 75.3704, severity: 'medium', highway: 'NH 66' },
  // MC Road (Kottayam–Trivandrum)
  { id: 'mc_kot',    name: 'MC Road — Kottayam',                  lat: 9.5916,  lng: 76.5222, severity: 'medium', highway: 'MC Road' },
  { id: 'mc_pta',    name: 'MC Road — Pathanamthitta',            lat: 9.2648,  lng: 76.7870, severity: 'medium', highway: 'MC Road' },
  // NH 544 (Coimbatore–Kochi)
  { id: 'nh544_pkd', name: 'NH 544 — Palakkad Ghat',             lat: 10.7867, lng: 76.6548, severity: 'medium', highway: 'NH 544' },
  // Mountain / Tourist routes
  { id: 'munnar_rd', name: 'Munnar Road (Ghat)',                  lat: 10.0500, lng: 77.0000, severity: 'high',   highway: 'Munnar Ghat' },
  { id: 'wayanad_rd',name: 'Wayanad Ghat Road',                   lat: 11.5500, lng: 76.0800, severity: 'medium', highway: 'Wayanad Ghat' },
];

// Legacy alias for backward-compat
export const TRAFFIC_HOTSPOTS = HIGHWAY_HOTSPOTS;

// ── Location type icons & colours ─────────────────────────────────────────────
export const LOCATION_TYPE_CONFIG = {
  airport: { icon: '✈️', color: '#64b5f6', label: 'Airport' },
  railway: { icon: '🚂', color: '#ef9a9a', label: 'Railway Station' },
  metro:   { icon: '🚇', color: '#b026ff', label: 'Metro Station' },
  bus:     { icon: '🚌', color: '#ff6b35', label: 'Bus Stand' },
  water:   { icon: '⛴️', color: '#00d4ff', label: 'Water Transport' },
  auto:    { icon: '🛺', color: '#ffd600', label: 'Auto Stand' },
  tourist: { icon: '🏔️', color: '#66bb6a', label: 'Tourist Hub' },
};

// ── District zone weather profiles ───────────────────────────────────────────
export const DISTRICT_WEATHER_ALERTS = {
  idk: { risk: 'landslide', message: '⚠️ Landslide-prone area — check advisories before traveling during monsoon.' },
  wyd: { risk: 'landslide', message: '⚠️ Wayanad ghat roads are dangerous in heavy rain — exercise caution.' },
  alp: { risk: 'flood',     message: '🌊 Low-lying area — flooding possible during monsoon season.' },
  kol: { risk: 'flood',     message: '🌊 Coastal flooding risk in Kollam during high tides.' },
  pkd: { risk: 'heat',      message: '🌡️ High temperature zone — stay hydrated and avoid peak hour outdoor travel.' },
};

// ── Public Transport Options (Kerala-wide) ────────────────────────────────────
export const TRANSPORT_OPTIONS = [
  {
    id: 'kochi_metro',
    name: 'Kochi Metro',
    type: 'metro',
    icon: '🚇',
    color: '#b026ff',
    routes: ['Aluva ↔ Petta (17 stations)'],
    avgDurationMin: 22,
    fare: 25,
    frequencyMin: 8,
    nextDeparturMin: 4,
    walkToStopMin: 6,
    pros: ['AC', 'No traffic', 'Punctual'],
    availability: 'High',
    coverage: 'ekm',
  },
  {
    id: 'ksrtc_superfast',
    name: 'KSRTC Super Fast',
    type: 'bus',
    icon: '🚌',
    color: '#ff6b35',
    routes: ['Inter-district express routes'],
    avgDurationMin: 90,
    fare: 120,
    frequencyMin: 30,
    nextDeparturMin: 12,
    walkToStopMin: 8,
    pros: ['State-wide', 'Frequent', 'AC options'],
    availability: 'High',
    coverage: 'all',
  },
  {
    id: 'ksrtc_swift',
    name: 'KSRTC Swift (AC)',
    type: 'bus',
    icon: '🚌',
    color: '#ff9d72',
    routes: ['City-to-city AC service'],
    avgDurationMin: 75,
    fare: 200,
    frequencyMin: 60,
    nextDeparturMin: 20,
    walkToStopMin: 5,
    pros: ['AC', 'Comfortable', 'Timely'],
    availability: 'Medium',
    coverage: 'all',
  },
  {
    id: 'indian_rail',
    name: 'Indian Railways',
    type: 'train',
    icon: '🚆',
    color: '#ef9a9a',
    routes: ['TVM ↔ Kasaragod (Coastal Line)'],
    avgDurationMin: 180,
    fare: 85,
    frequencyMin: 45,
    nextDeparturMin: 25,
    walkToStopMin: 10,
    pros: ['Fastest long distance', 'Scenic', 'Reliable'],
    availability: 'High',
    coverage: 'all',
  },
  {
    id: 'water_metro',
    name: 'Water Metro (Kochi)',
    type: 'water',
    icon: '⛴️',
    color: '#00d4ff',
    routes: ['High Court ↔ Fort Kochi & backwaters'],
    avgDurationMin: 20,
    fare: 20,
    frequencyMin: 30,
    nextDeparturMin: 10,
    walkToStopMin: 8,
    pros: ['Scenic', 'AC', 'Beat traffic'],
    availability: 'Medium',
    coverage: 'ekm',
  },
  {
    id: 'alp_houseboat',
    name: 'Alappuzha Ferry',
    type: 'water',
    icon: '🚢',
    color: '#4fc3f7',
    routes: ['Alappuzha ↔ Kollam Backwaters'],
    avgDurationMin: 480,
    fare: 400,
    frequencyMin: 240,
    nextDeparturMin: 60,
    walkToStopMin: 5,
    pros: ['Scenic', 'Unique', 'Avoid highways'],
    availability: 'Low',
    coverage: 'alp',
  },
  {
    id: 'auto',
    name: 'Auto Rickshaw',
    type: 'auto',
    icon: '🛺',
    color: '#ffd600',
    routes: ['Local — door to door'],
    avgDurationMin: 25,
    fare: 90,
    frequencyMin: 0,
    nextDeparturMin: 2,
    walkToStopMin: 0,
    pros: ['Door-to-door', 'Fast', 'Metered'],
    availability: 'High',
    coverage: 'all',
  },
  {
    id: 'taxi_app',
    name: 'Rapido / Uber / Ola',
    type: 'taxi',
    icon: '🚕',
    color: '#ffca28',
    routes: ['App-based city & outstation'],
    avgDurationMin: 30,
    fare: 150,
    frequencyMin: 0,
    nextDeparturMin: 5,
    walkToStopMin: 0,
    pros: ['AC', 'Tracked', 'Outstation available'],
    availability: 'High',
    coverage: 'all',
  },
];
