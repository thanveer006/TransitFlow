// Kochi, Kerala — Transit Network & Route Data

export const CITY_CENTER = { lat: 10.0159, lng: 76.3097 }; // Kochi civic centre

// ── Transit Hubs ──────────────────────────────────────────────────────────────
export const TRANSIT_HUBS = [
  {
    id: 'edappally_metro',
    name: 'Edappally Metro',
    shortName: 'Edappally',
    type: 'metro',
    lat: 10.0209,
    lng: 76.3097,
    parkingSlots: 150,
    ticketPrice: 25,          // INR – avg fare to city centre
    walkFromBottleneck: 5,    // minutes from nearest bottleneck
  },
  {
    id: 'palarivattom_metro',
    name: 'Palarivattom Metro',
    shortName: 'Palarivattom',
    type: 'metro',
    lat: 10.0017,
    lng: 76.3020,
    parkingSlots: 60,
    ticketPrice: 20,
    walkFromBottleneck: 3,
  },
  {
    id: 'kaloor_metro',
    name: 'Kaloor Metro',
    shortName: 'Kaloor',
    type: 'metro',
    lat: 9.9889,
    lng: 76.2974,
    parkingSlots: 80,
    ticketPrice: 15,
    walkFromBottleneck: 3,
  },
  {
    id: 'mg_road_metro',
    name: 'MG Road Metro',
    shortName: 'MG Road',
    type: 'metro',
    lat: 9.9782,
    lng: 76.2959,
    parkingSlots: 0,
    ticketPrice: 10,
    walkFromBottleneck: 2,
  },
  {
    id: 'ernakulam_south_metro',
    name: 'Ernakulam South Metro',
    shortName: 'Ernakulam South',
    type: 'metro',
    lat: 9.9601,
    lng: 76.2870,
    parkingSlots: 50,
    ticketPrice: 20,
    walkFromBottleneck: 4,
  },
  {
    id: 'vytilla_hub',
    name: 'Vyttila Mobility Hub',
    shortName: 'Vyttila Hub',
    type: 'bus',
    lat: 9.9589,
    lng: 76.3055,
    parkingSlots: 200,
    ticketPrice: 18,
    walkFromBottleneck: 2,
  },
  {
    id: 'fort_kochi_water_metro',
    name: 'Fort Kochi Water Metro',
    shortName: 'Fort Kochi',
    type: 'water_metro',
    lat: 9.9642,
    lng: 76.2378,
    parkingSlots: 30,
    ticketPrice: 20,
    walkFromBottleneck: 8,
  },
  {
    id: 'high_court_water_metro',
    name: 'High Court Water Metro',
    shortName: 'High Court Jetty',
    type: 'water_metro',
    lat: 9.9772,
    lng: 76.2875,
    parkingSlots: 0,
    ticketPrice: 20,
    walkFromBottleneck: 5,
  },
];

// ── Bottleneck Zones ──────────────────────────────────────────────────────────
export const BOTTLENECK_ZONES = [
  {
    id: 'edappally_jn',
    name: 'Edappally Junction',
    lat: 10.0192,
    lng: 76.3093,
    severity: 'critical',
    nearestHubId: 'edappally_metro',
    avgDelayMinutes: 22,
  },
  {
    id: 'palarivattom_jn',
    name: 'Palarivattom Junction',
    lat: 10.0017,
    lng: 76.3036,
    severity: 'high',
    nearestHubId: 'palarivattom_metro',
    avgDelayMinutes: 16,
  },
  {
    id: 'kaloor_jn',
    name: 'Kaloor Junction',
    lat: 9.9920,
    lng: 76.2985,
    severity: 'high',
    nearestHubId: 'kaloor_metro',
    avgDelayMinutes: 15,
  },
  {
    id: 'mg_road_stretch',
    name: 'MG Road Stretch',
    lat: 9.9810,
    lng: 76.2975,
    severity: 'high',
    nearestHubId: 'mg_road_metro',
    avgDelayMinutes: 18,
  },
  {
    id: 'vyttila_jn',
    name: 'Vyttila Junction',
    lat: 9.9561,
    lng: 76.3079,
    severity: 'medium',
    nearestHubId: 'vytilla_hub',
    avgDelayMinutes: 12,
  },
];

// ── Preset Routes for Demo ─────────────────────────────────────────────────────
export const PRESET_ROUTES = [
  {
    id: 'edappally_mg',
    label: 'Edappally → MG Road',
    description: 'Peak-hour nightmare',
    origin: { address: 'Edappally, Kochi, Kerala', lat: 10.0192, lng: 76.3093 },
    destination: { address: 'MG Road, Kochi, Kerala', lat: 9.9782, lng: 76.2959 },
    escapeHubId: 'edappally_metro',
    baseTransitTravelMin: 20,  // metro travel time only
    distanceKm: 8.5,
  },
  {
    id: 'vytilla_ernakulam',
    label: 'Vyttila → Ernakulam North',
    description: 'NH Bypass gridlock',
    origin: { address: 'Vyttila, Kochi, Kerala', lat: 9.9589, lng: 76.3055 },
    destination: { address: 'Ernakulam North, Kochi, Kerala', lat: 9.9841, lng: 76.2886 },
    escapeHubId: 'vytilla_hub',
    baseTransitTravelMin: 25,
    distanceKm: 6.2,
  },
  {
    id: 'kaloor_south',
    label: 'Kaloor → Ernakulam South',
    description: 'Office-hour crawl',
    origin: { address: 'Kaloor, Kochi, Kerala', lat: 9.9889, lng: 76.2974 },
    destination: { address: 'Ernakulam South, Kochi, Kerala', lat: 9.9601, lng: 76.2870 },
    escapeHubId: 'kaloor_metro',
    baseTransitTravelMin: 12,
    distanceKm: 4.5,
  },
];

// ── Cost Constants (INR) ───────────────────────────────────────────────────────
export const FUEL_COST_PER_KM = 7;       // Car @ 15 kmpl, petrol ₹105/L
export const PARKING_COST_PER_HOUR = 20; // transit hub parking
export const AVG_PARKING_HOURS = 8;      // typical workday

// ── Hub type colours for the UI ───────────────────────────────────────────────
export const HUB_COLORS = {
  metro:       { fill: '#b026ff', stroke: '#d580ff' },
  water_metro: { fill: '#00d4ff', stroke: '#80eaff' },
  bus:         { fill: '#ff6b35', stroke: '#ff9d72' },
};

export const SEVERITY_COLORS = {
  critical: { fill: '#ff1744', opacity: 0.20, radius: 600 },
  high:     { fill: '#ff6d00', opacity: 0.15, radius: 450 },
  medium:   { fill: '#ffd600', opacity: 0.12, radius: 350 },
};
