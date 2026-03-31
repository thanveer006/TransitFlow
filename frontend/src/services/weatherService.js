const OW_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// Weather condition → alert mapping
const ALERT_CONDITIONS = {
  Thunderstorm: { level: 'danger',  message: 'Thunderstorm alert! Avoid outdoor travel if possible.' },
  Drizzle:      { level: 'warning', message: 'Light rain ahead. Roads may be slippery.' },
  Rain:         { level: 'warning', message: 'Rain detected. Consider covered public transport.' },
  Snow:         { level: 'danger',  message: 'Unusual snow conditions. Expect severe delays.' },
  Mist:         { level: 'info',    message: 'Low visibility. Drive carefully.' },
  Fog:          { level: 'warning', message: 'Heavy fog. Reduce speed significantly.' },
  Haze:         { level: 'info',    message: 'Hazy conditions. Visibility slightly reduced.' },
  Squall:       { level: 'danger',  message: 'Squall warning! Stay indoors if possible.' },
  Clear:        null,
  Clouds:       null,
};

// Mock weather used when no API key is set or request fails
function getMockWeather(lat) {
  // Simulate Kerala weather based on time of day
  const hour = new Date().getHours();
  const isMorning = hour >= 6 && hour < 12;
  const isEvening = hour >= 17 && hour < 20;

  if (lat < 9) {
    // Southern Kerala (Trivandrum) — more coastal rain
    return {
      condition: 'Rain',
      description: 'moderate rain',
      temp: 29,
      feelsLike: 34,
      humidity: 85,
      windSpeed: 14,
      icon: '10d',
      cityName: 'Trivandrum',
      isMock: true,
    };
  }

  return {
    condition: isEvening ? 'Clouds' : isMorning ? 'Clear' : 'Haze',
    description: isEvening ? 'overcast clouds' : isMorning ? 'clear sky' : 'haze',
    temp: 32,
    feelsLike: 37,
    humidity: 78,
    windSpeed: 10,
    icon: isEvening ? '04d' : isMorning ? '01d' : '50d',
    cityName: 'Kochi',
    isMock: true,
  };
}

export async function fetchWeather(lat, lng) {
  if (!OW_KEY) return getMockWeather(lat);

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=metric`
    );
    if (!res.ok) throw new Error(`OpenWeather ${res.status}`);
    const d = await res.json();
    return {
      condition:   d.weather[0].main,
      description: d.weather[0].description,
      temp:        Math.round(d.main.temp),
      feelsLike:   Math.round(d.main.feels_like),
      humidity:    d.main.humidity,
      windSpeed:   Math.round(d.wind?.speed ?? 0),
      icon:        d.weather[0].icon,
      cityName:    d.name,
      isMock:      false,
    };
  } catch {
    return getMockWeather(lat);
  }
}

export function getWeatherAlert(weather) {
  if (!weather) return null;
  return ALERT_CONDITIONS[weather.condition] ?? null;
}

export function getWeatherSuggestion(weather) {
  if (!weather) return null;
  const alert = getWeatherAlert(weather);
  if (!alert) return null;
  if (alert.level === 'danger' || alert.level === 'warning') {
    return 'Consider metro or bus — covered and unaffected by weather.';
  }
  return null;
}

export function weatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
