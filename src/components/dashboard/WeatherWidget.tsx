import { useState, useEffect } from 'react'
import { Cloud, CloudRain, Sun, CloudLightning, Loader2, MapPin } from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  max: number
  min: number
  isDay: boolean
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`)
        const data = await res.json()
        
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          condition: getWeatherCondition(data.current_weather.weathercode),
          max: Math.round(data.daily.temperature_2m_max[0]),
          min: Math.round(data.daily.temperature_2m_min[0]),
          isDay: data.current_weather.is_day === 1
        })
      } catch (err) {
        console.error('Weather error:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    // Try geolocation first, fallback to Sao Paulo
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(-23.5505, -46.6333), // SP fallback
        { timeout: 5000 }
      )
    } else {
      fetchWeather(-23.5505, -46.6333)
    }
  }, [])

  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  const getWeatherCondition = (code: number) => {
    if (code === 0) return 'clear'
    if (code >= 1 && code <= 3) return 'cloudy'
    if (code >= 51 && code <= 67) return 'rain'
    if (code >= 80 && code <= 82) return 'rain'
    if (code >= 95 && code <= 99) return 'storm'
    return 'cloudy'
  }

  const renderIcon = () => {
    if (!weather) return null
    if (weather.condition === 'clear') return <Sun className={`h-8 w-8 ${weather.isDay ? 'text-yellow-400' : 'text-blue-200'}`} />
    if (weather.condition === 'rain') return <CloudRain className="h-8 w-8 text-blue-400" />
    if (weather.condition === 'storm') return <CloudLightning className="h-8 w-8 text-purple-400" />
    return <Cloud className="h-8 w-8 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center justify-center h-[90px]">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  if (error || !weather) return null

  return (
    <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center justify-between h-[90px]">
      <div className="flex items-center gap-4">
        {renderIcon()}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">{weather.temp}°C</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin className="h-3 w-3" />
            <span>Local Atual</span>
          </div>
        </div>
      </div>
      
      <div className="text-right flex flex-col items-end justify-center">
        <span className="text-xs text-text-secondary font-medium">Máx: {weather.max}°C</span>
        <span className="text-xs text-text-muted">Mín: {weather.min}°C</span>
      </div>
    </div>
  )
}
