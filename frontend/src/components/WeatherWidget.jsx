import { weatherIconUrl, getWeatherAlert } from '../services/weatherService';
import { Wind, Droplets, Thermometer } from 'lucide-react';

const ALERT_STYLES = {
  danger:  'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-orange-50 border-orange-200 text-orange-700',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
};

export default function WeatherWidget({ weather }) {
  if (!weather) return null;

  const alert = getWeatherAlert(weather);

  return (
    <div className="absolute top-5 right-5 z-20 pointer-events-auto animate-fade-up">
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden w-[220px]">

        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {weather.icon && (
            <img
              src={weatherIconUrl(weather.icon)}
              alt={weather.description}
              className="w-12 h-12 -ml-2"
            />
          )}
          <div className="min-w-0">
            <p className="text-2xl font-black text-gray-900 leading-none">{weather.temp}°C</p>
            <p className="text-xs text-gray-600 capitalize mt-0.5 truncate">{weather.description}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{weather.cityName}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 px-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1 text-gray-600">
            <Droplets className="w-3 h-3" />
            <span className="text-[11px]">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Wind className="w-3 h-3" />
            <span className="text-[11px]">{weather.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Thermometer className="w-3 h-3" />
            <span className="text-[11px]">Feels {weather.feelsLike}°</span>
          </div>
        </div>

        {/* Alert banner */}
        {alert && (
          <div className={`px-3 py-2 border-t text-[11px] font-medium leading-snug ${ALERT_STYLES[alert.level] ?? ALERT_STYLES.info}`}>
            {alert.message}
          </div>
        )}

        {weather.isMock && (
          <div className="px-3 py-1 bg-gray-50 text-[9px] text-gray-500 text-center tracking-wider uppercase">
            Simulated data
          </div>
        )}
      </div>
    </div>
  );
}
