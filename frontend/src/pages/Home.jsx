import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Sun, CloudRain, CloudSnow, Cloud, Wind, Droplets, Thermometer, MapPin,
  Sprout, Bell, Activity, CalendarDays, Sunrise, Sunset, ArrowRight, AlertTriangle,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";

const WCODE = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: Sun },
  2: { label: "Partly cloudy", icon: Cloud },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: Cloud },
  48: { label: "Rime fog", icon: Cloud },
  51: { label: "Light drizzle", icon: CloudRain },
  53: { label: "Drizzle", icon: CloudRain },
  55: { label: "Heavy drizzle", icon: CloudRain },
  61: { label: "Light rain", icon: CloudRain },
  63: { label: "Rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  71: { label: "Light snow", icon: CloudSnow },
  73: { label: "Snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: CloudSnow },
  80: { label: "Rain showers", icon: CloudRain },
  81: { label: "Rain showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudRain },
};

function HeroSection({ user, location, weather }) {
  const t = weather?.current?.temperature_2m;
  return (
    <section className="relative overflow-hidden" data-testid="home-hero">
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/34961217/pexels-photo-34961217.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(2px) saturate(0.85)",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1C1614]/60 via-[#1C1614]/80 to-[#1C1614]" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16">
        <div className="rtr-label mb-4">{location ? `${location} · live` : "Welcome to your plot"}</div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#E8E4DB] tracking-tight leading-[1.05] max-w-3xl">
          From <span className="text-[#9EB27A] italic">root</span> to{" "}
          <span className="text-[#CBA279] italic">route</span> — your
          beginner's path to arable farming.
        </h1>
        <p className="mt-6 max-w-2xl text-[#A69A92] text-lg leading-relaxed">
          Plant smarter, water wiser, harvest healthier. A friendly home for the solo farmer
          managing one plot, one patch, one season at a time.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="rtr-btn-primary inline-flex items-center gap-2"
            data-testid="hero-cta-primary"
          >
            {user ? "Open Dashboard" : "Start Free"} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/guide" className="rtr-btn-ghost inline-flex items-center gap-2" data-testid="hero-cta-guide">
            Read the Guide
          </Link>
        </div>
        {t != null && (
          <div className="mt-10 inline-flex items-center gap-4 text-sm text-[#A69A92]">
            <Thermometer className="w-4 h-4 text-[#CBA279]" />
            <span>{Math.round(t)}°C right now</span>
            <span className="text-[#433530]">·</span>
            <span>Humidity {weather?.current?.relative_humidity_2m}%</span>
            <span className="text-[#433530]">·</span>
            <span>Wind {weather?.current?.wind_speed_10m} km/h</span>
          </div>
        )}
      </div>
    </section>
  );
}

function WeatherCard({ weather, locationName }) {
  if (!weather) {
    return (
      <div className="rtr-card p-6" data-testid="weather-card-loading">
        <div className="rtr-label mb-2">Weather</div>
        <div className="text-[#A69A92]">Locating you…</div>
      </div>
    );
  }
  const code = weather.current.weather_code;
  const meta = WCODE[code] || { label: "—", icon: Cloud };
  const Icon = meta.icon;
  const daily = (weather.daily?.time || []).map((d, i) => ({
    day: new Date(d).toLocaleDateString(undefined, { weekday: "short" }),
    high: weather.daily.temperature_2m_max[i],
    low: weather.daily.temperature_2m_min[i],
    rain: weather.daily.precipitation_sum[i],
  }));
  return (
    <div className="rtr-card rtr-card-lift p-6" data-testid="weather-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="rtr-label mb-2 flex items-center gap-2">
            <MapPin className="w-3 h-3" /> {locationName || "Your location"}
          </div>
          <div className="font-serif text-5xl text-[#E8E4DB] leading-none">
            {Math.round(weather.current.temperature_2m)}°
          </div>
          <div className="text-sm text-[#A69A92] mt-1">{meta.label}</div>
        </div>
        <div className="w-14 h-14 rounded-full bg-[#9EB27A]/15 border border-[#9EB27A]/40 grid place-items-center">
          <Icon className="w-6 h-6 text-[#9EB27A]" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-5 text-xs">
        <div className="flex items-center gap-2 text-[#A69A92]">
          <Droplets className="w-3 h-3 text-[#CBA279]" />
          {weather.current.relative_humidity_2m}% humidity
        </div>
        <div className="flex items-center gap-2 text-[#A69A92]">
          <Wind className="w-3 h-3 text-[#CBA279]" />
          {weather.current.wind_speed_10m} km/h
        </div>
        <div className="flex items-center gap-2 text-[#A69A92]">
          <CloudRain className="w-3 h-3 text-[#CBA279]" />
          {weather.current.precipitation} mm
        </div>
      </div>
      <div className="mt-6 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily} margin={{ top: 5, right: 6, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9EB27A" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#9EB27A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#433530" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#A69A92" tick={{ fontSize: 11 }} />
            <YAxis stroke="#A69A92" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#1C1614", border: "1px solid #433530", color: "#E8E4DB" }} />
            <Area type="monotone" dataKey="high" stroke="#9EB27A" strokeWidth={2} fill="url(#hg)" />
            <Line type="monotone" dataKey="low" stroke="#CBA279" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-[#A69A92] mt-2">7-day high / low trend</div>
    </div>
  );
}

function CalendarCard({ rows }) {
  return (
    <div className="rtr-card p-6 col-span-full lg:col-span-2" data-testid="planting-calendar-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="rtr-label mb-1 flex items-center gap-2">
            <CalendarDays className="w-3 h-3" /> Seasonal Planting Calendar
          </div>
          <div className="font-serif text-2xl text-[#E8E4DB]">What to plant, when to harvest</div>
        </div>
      </div>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead className="text-[#CBA279] text-xs uppercase tracking-widest">
            <tr>
              <th className="text-left px-2 py-2 font-medium">Crop</th>
              <th className="text-left px-2 py-2 font-medium">Season</th>
              <th className="text-left px-2 py-2 font-medium">Plant</th>
              <th className="text-left px-2 py-2 font-medium">Harvest</th>
              <th className="text-left px-2 py-2 font-medium">Water</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((r) => (
              <tr key={r.crop} className="border-t border-[#433530]/60" data-testid={`calendar-row-${r.crop.toLowerCase()}`}>
                <td className="px-2 py-3 text-[#E8E4DB]">{r.crop}</td>
                <td className="px-2 py-3 text-[#A69A92]">{r.season}</td>
                <td className="px-2 py-3 text-[#9EB27A]">{r.plant_month}</td>
                <td className="px-2 py-3 text-[#CBA279]">{r.harvest_month}</td>
                <td className="px-2 py-3 text-[#A69A92] flex items-center gap-1">
                  {r.water_schedule === "Morning" ? <Sunrise className="w-3 h-3 text-[#CBA279]" /> : <Sunset className="w-3 h-3 text-[#D47C5E]" />}
                  {r.water_schedule}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SoilStatusCard({ soil }) {
  const status = useMemo(() => {
    if (!soil) return { label: "No reading yet", tone: "muted" };
    const ph = soil.ph;
    if (ph < 5.5 || ph > 7.8) return { label: "Attention needed", tone: "warn" };
    if (soil.nitrogen < 30) return { label: "Low Nitrogen", tone: "warn" };
    return { label: "Healthy", tone: "good" };
  }, [soil]);
  const tones = {
    good: "text-[#7A9B61]",
    warn: "text-[#D47C5E]",
    muted: "text-[#A69A92]",
  };
  return (
    <div className="rtr-card p-6" data-testid="soil-status-card">
      <div className="rtr-label mb-2 flex items-center gap-2">
        <Sprout className="w-3 h-3" /> Overall Soil Status
      </div>
      <div className={`font-serif text-3xl ${tones[status.tone]}`}>{status.label}</div>
      {soil ? (
        <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
          <div className="bg-[#1C1614] border border-[#433530] rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-[#A69A92]">Nitrogen</div>
            <div className="text-[#9EB27A]">{soil.nitrogen} ppm</div>
          </div>
          <div className="bg-[#1C1614] border border-[#433530] rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-[#A69A92]">Phosphorus</div>
            <div className="text-[#CBA279]">{soil.phosphorus} ppm</div>
          </div>
          <div className="bg-[#1C1614] border border-[#433530] rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-[#A69A92]">Potassium</div>
            <div className="text-[#D47C5E]">{soil.potassium} ppm</div>
          </div>
          <div className="bg-[#1C1614] border border-[#433530] rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-[#A69A92]">pH</div>
            <div className="text-[#7A9B61]">{soil.ph}</div>
          </div>
        </div>
      ) : (
        <div className="text-[#A69A92] text-sm mt-3">
          Log your first soil reading on the{" "}
          <Link to="/dashboard" className="text-[#9EB27A] hover:underline">Dashboard</Link>.
        </div>
      )}
    </div>
  );
}

function AlertsCard({ alerts }) {
  return (
    <div className="rtr-card p-6" data-testid="alerts-card">
      <div className="rtr-label mb-3 flex items-center gap-2">
        <Bell className="w-3 h-3" /> Alerts
      </div>
      {alerts.length === 0 ? (
        <div className="text-[#A69A92] text-sm">All quiet. Your plot looks calm.</div>
      ) : (
        <ul className="space-y-3">
          {alerts.slice(0, 4).map((a, i) => (
            <li key={i} className="flex items-start gap-3" data-testid={`alert-item-${i}`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${a.severity === "warning" ? "text-[#D47C5E]" : "text-[#CBA279]"}`} />
              <div>
                <div className="text-[#E8E4DB] text-sm">{a.title}</div>
                <div className="text-xs text-[#A69A92]">{a.description}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivitiesCard({ activities }) {
  return (
    <div className="rtr-card p-6" data-testid="activities-card">
      <div className="rtr-label mb-3 flex items-center gap-2">
        <Activity className="w-3 h-3" /> Recent Activities
      </div>
      {activities.length === 0 ? (
        <div className="text-[#A69A92] text-sm">No activity logged yet.</div>
      ) : (
        <ul className="space-y-3">
          {activities.slice(0, 5).map((a, i) => (
            <li key={a._id || i} className="flex items-start gap-3" data-testid={`activity-item-${i}`}>
              <span className="w-2 h-2 rounded-full bg-[#9EB27A] mt-2" />
              <div>
                <div className="text-[#E8E4DB] text-sm">{a.description}</div>
                <div className="text-[10px] text-[#A69A92] uppercase tracking-widest">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [weather, setWeather] = useState(null);
  const [locName, setLocName] = useState("");
  const [calendar, setCalendar] = useState([]);
  const [soil, setSoil] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api.get("/calendar/planting").then((r) => setCalendar(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const loadWeather = async (lat, lon, label) => {
      try {
        const { data } = await api.get("/weather", { params: { lat, lon } });
        setWeather(data);
        setLocName(label || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
      } catch (e) {
        // fallback
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude, "Your location"),
        () => loadWeather(-1.2921, 36.8219, "Nairobi (default)"),
        { timeout: 5000 }
      );
    } else {
      loadWeather(-1.2921, 36.8219, "Nairobi (default)");
    }
  }, []);

  useEffect(() => {
    if (!user || user === false) return;
    api.get("/soil/latest").then((r) => setSoil(r.data)).catch(() => {});
    api.get("/alerts").then((r) => setAlerts(r.data || [])).catch(() => {});
    api.get("/activities").then((r) => setActivities(r.data || [])).catch(() => {});
  }, [user]);

  return (
    <div className="rtr-anim-in">
      <HeroSection user={user && user.email ? user : null} location={locName} weather={weather} />
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WeatherCard weather={weather} locationName={locName} />
          <SoilStatusCard soil={soil} />
          <AlertsCard alerts={alerts} />
          <CalendarCard rows={calendar} />
          <ActivitiesCard activities={activities} />
        </div>
      </section>
    </div>
  );
}
