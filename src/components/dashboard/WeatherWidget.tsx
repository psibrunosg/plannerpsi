import { useState, useEffect } from 'react'
import { Cloud, CloudRain, Sun, CloudLightning, Loader2, MapPin, AlertCircle } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

interface WeatherData {
  temp: number
  condition: string
  max: number
  min: number
  isDay: boolean
  cityName: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const weatherCity = useUIStore(s => s.weatherCity)

  useEffect(() => {
    let isMounted = true
    
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(false)
        
        let lat = -23.5505
        let lon = -46.6333
        let displayCity = 'São Paulo'

        if (weatherCity && weatherCity.trim() !== '') {
          // Geocoding to get lat/lon
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity)}&count=1&language=pt&format=json`)
          const geoData = await geoRes.json()
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude
            lon = geoData.results[0].longitude
            displayCity = geoData.results[0].name
          }
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`)
        const data = await res.json()
        
        if (isMounted) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            condition: getWeatherCondition(data.current_weather.weathercode),
            max: Math.round(data.daily.temperature_2m_max[0]),
            min: Math.round(data.daily.temperature_2m_min[0]),
            isDay: data.current_weather.is_day === 1,
            cityName: displayCity
          })
        }
      } catch (err) {
        console.error('Weather error:', err)
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchWeather()
    
    return () => { isMounted = false }
  }, [weatherCity])

  // WMO Weather interpretation codes
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

  if (error || !weather) return (
    <div className="glass rounded-[var(--radius-lg)] p-4 flex flex-col items-center justify-center h-[90px] text-text-muted">
      <AlertCircle className="h-5 w-5 mb-1 opacity-50" />
      <span className="text-[10px]">Erro ao buscar clima</span>
    </div>
  )

  return (
    <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center justify-between h-[90px]">
      <div className="flex items-center gap-4">
        {renderIcon()}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">{weather.temp}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted max-w-[120px]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{weather.cityName}</span>
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
