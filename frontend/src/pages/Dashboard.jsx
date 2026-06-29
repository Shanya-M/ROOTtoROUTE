import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Beaker, Sprout, FlaskConical, TrendingUp, Repeat, MessageCircle, Send, Bot, User as UserIcon, Loader2, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line, Legend,
} from "recharts";

const SOIL_TYPES = ["loam", "clay", "sandy", "silt"];

function SoilForm({ soil, setSoil, onSave, saving }) {
  return (
    <div className="rtr-card p-6" data-testid="soil-form-card">
      <div className="rtr-label flex items-center gap-2 mb-3">
        <Beaker className="w-3 h-3" /> Soil Reading
      </div>
      <div className="font-serif text-2xl text-[#E8E4DB] mb-5">Log your current soil</div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ["nitrogen", "Nitrogen (ppm)"],
          ["phosphorus", "Phosphorus (ppm)"],
          ["potassium", "Potassium (ppm)"],
          ["ph", "pH"],
          ["moisture", "Moisture %"],
          ["temperature", "Temp °C"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="text-[10px] uppercase tracking-widest text-[#A69A92] mb-1 block">{label}</label>
            <input
              data-testid={`soil-${key}-input`}
              type="number" step="0.1"
              value={soil[key] ?? ""}
              onChange={(e) => setSoil({ ...soil, [key]: e.target.value === "" ? "" : parseFloat(e.target.value) })}
              className="rtr-input"
            />
          </div>
        ))}
        <div className="col-span-2">
          <label className="text-[10px] uppercase tracking-widest text-[#A69A92] mb-1 block">Soil type</label>
          <select
            data-testid="soil-type-select"
            value={soil.soil_type || "loam"}
            onChange={(e) => setSoil({ ...soil, soil_type: e.target.value })}
            className="rtr-input"
          >
            {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <button onClick={onSave} disabled={saving} className="rtr-btn-primary w-full mt-5" data-testid="save-soil-btn">
        {saving ? "Saving…" : "Save reading"}
      </button>
    </div>
  );
}

function NpkChart({ soil }) {
  const data = [
    { name: "N", value: soil?.nitrogen ?? 0, ideal: 80 },
    { name: "P", value: soil?.phosphorus ?? 0, ideal: 60 },
    { name: "K", value: soil?.potassium ?? 0, ideal: 60 },
  ];
  return (
    <div className="rtr-card p-6" data-testid="npk-chart-card">
      <div className="rtr-label mb-3">NPK Levels</div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#433530" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#A69A92" />
            <YAxis stroke="#A69A92" />
            <Tooltip contentStyle={{ background: "#1C1614", border: "1px solid #433530", color: "#E8E4DB" }} />
            <Legend wrapperStyle={{ color: "#A69A92", fontSize: 12 }} />
            <Bar dataKey="ideal" fill="#433530" radius={[6, 6, 0, 0]} name="Ideal (avg)" />
            <Bar dataKey="value" fill="#9EB27A" radius={[6, 6, 0, 0]} name="Yours" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PhGauge({ soil }) {
  const ph = soil?.ph ?? 7;
  const data = [{ name: "pH", value: ph, fill: ph < 6 ? "#D47C5E" : ph > 7.5 ? "#CBA279" : "#9EB27A" }];
  return (
    <div className="rtr-card p-6" data-testid="ph-gauge-card">
      <div className="rtr-label mb-3">pH Balance</div>
      <div className="h-56 grid place-items-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="65%" outerRadius="100%" data={data} startAngle={180} endAngle={0} barSize={18}>
            <PolarAngleAxis type="number" domain={[0, 14]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "#433530" }} dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute font-serif text-4xl text-[#E8E4DB]">{ph}</div>
        <div className="absolute mt-20 text-xs text-[#A69A92]">
          {ph < 6 ? "Acidic" : ph > 7.5 ? "Alkaline" : "Balanced"}
        </div>
      </div>
    </div>
  );
}

function HistoryChart({ history }) {
  const data = history.map((r) => ({
    t: new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    N: r.nitrogen, P: r.phosphorus, K: r.potassium, pH: r.ph,
  }));
  return (
    <div className="rtr-card p-6 col-span-full" data-testid="history-chart-card">
      <div className="rtr-label mb-3">NPK & pH History</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#433530" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#A69A92" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" stroke="#A69A92" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#A69A92" tick={{ fontSize: 11 }} domain={[3, 9]} />
            <Tooltip contentStyle={{ background: "#1C1614", border: "1px solid #433530", color: "#E8E4DB" }} />
            <Legend wrapperStyle={{ color: "#A69A92", fontSize: 12 }} />
            <Line yAxisId="left"  type="monotone" dataKey="N"  stroke="#9EB27A" strokeWidth={2} dot={false} />
            <Line yAxisId="left"  type="monotone" dataKey="P"  stroke="#CBA279" strokeWidth={2} dot={false} />
            <Line yAxisId="left"  type="monotone" dataKey="K"  stroke="#D47C5E" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="pH" stroke="#7A9B61" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CropRecommendation({ soil, onPick }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!soil?.nitrogen) { toast.error("Save a soil reading first"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/recommend/crops", {
        nitrogen: soil.nitrogen, phosphorus: soil.phosphorus, potassium: soil.potassium,
        ph: soil.ph, temperature: soil.temperature ?? 22,
        humidity: 60, rainfall: 90, soil_type: soil.soil_type ?? "loam",
      });
      setRecs(data.recommendations);
    } catch (e) {
      toast.error("Could not load recommendations");
    } finally { setLoading(false); }
  };

  return (
    <div className="rtr-card p-6 col-span-full" data-testid="crop-rec-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="rtr-label flex items-center gap-2"><Sprout className="w-3 h-3" /> Crop Recommendation</div>
          <div className="font-serif text-2xl text-[#E8E4DB]">Top 3 crops for your soil</div>
        </div>
        <button onClick={run} disabled={loading} className="rtr-btn-primary text-sm" data-testid="run-crop-rec-btn">
          {loading ? "Calculating…" : "Recommend"}
        </button>
      </div>
      {recs.length === 0 ? (
        <div className="text-[#A69A92] text-sm">Click <span className="text-[#9EB27A]">Recommend</span> to see your top three crops.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recs.map((r, idx) => (
            <button
              key={r.name}
              onClick={() => onPick(r.name)}
              className="rtr-card rtr-card-lift p-5 text-left"
              data-testid={`crop-rec-${idx}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-serif text-2xl text-[#E8E4DB]">{r.name}</div>
                <div className="text-xs px-2 py-1 rounded-full bg-[#9EB27A]/15 text-[#9EB27A] border border-[#9EB27A]/40">
                  {Math.round(r.confidence * 100)}%
                </div>
              </div>
              <div className="text-xs uppercase tracking-widest text-[#CBA279] mt-2">
                {r.season} · {r.growth_days}d
              </div>
              <div className="text-sm text-[#A69A92] mt-3 leading-relaxed">{r.info}</div>
              <div className="mt-3 text-[10px] text-[#A69A92]">Soils: {r.soils.join(", ")}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FertilizerCard({ soil, crop }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setResult(null); }, [crop]);

  const run = async () => {
    if (!crop) { toast.error("Pick a crop above first"); return; }
    if (!soil?.nitrogen) { toast.error("Save a soil reading first"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/recommend/fertilizer", {
        crop, nitrogen: soil.nitrogen, phosphorus: soil.phosphorus, potassium: soil.potassium,
        soil_type: soil.soil_type ?? "loam",
      });
      setResult(data);
    } catch (e) {
      toast.error("Fertilizer recommendation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="rtr-card p-6" data-testid="fertilizer-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="rtr-label flex items-center gap-2"><FlaskConical className="w-3 h-3" /> Fertilizer</div>
          <div className="font-serif text-xl text-[#E8E4DB] mt-1">
            {crop ? `For ${crop}` : "Pick a crop first"}
          </div>
        </div>
        <button onClick={run} disabled={loading || !crop} className="rtr-btn-ghost text-xs" data-testid="run-fertilizer-btn">
          {loading ? "…" : "Suggest"}
        </button>
      </div>
      {result ? (
        <ul className="space-y-3">
          {result.suggestions.map((s, i) => (
            <li key={i} className="bg-[#1C1614] border border-[#433530] rounded-lg p-3" data-testid={`fertilizer-item-${i}`}>
              <div className="text-[#CBA279] text-xs uppercase tracking-widest">{s.nutrient} {s.delta_ppm !== 0 ? `(Δ ${s.delta_ppm} ppm)` : ""}</div>
              <div className="text-sm text-[#E8E4DB] mt-1">{s.synthetic}</div>
              <div className="text-xs text-[#A69A92] mt-1">Organic: {s.organic}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-[#A69A92] text-sm">Choose a crop from the Top 3 to get a tailored fertilizer plan.</div>
      )}
    </div>
  );
}

function YieldCard({ soil, crop }) {
  const [yieldRes, setYieldRes] = useState(null);
  const [rotation, setRotation] = useState(null);
  const [area, setArea] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setYieldRes(null); setRotation(null); }, [crop]);

  const run = async () => {
    if (!crop || !soil?.nitrogen) return;
    setLoading(true);
    try {
      const [y, r] = await Promise.all([
        api.post("/recommend/yield", {
          crop, area_hectares: area, nitrogen: soil.nitrogen, phosphorus: soil.phosphorus,
          potassium: soil.potassium, ph: soil.ph, temperature: soil.temperature ?? 22,
        }),
        api.get(`/recommend/rotation/${encodeURIComponent(crop)}`),
      ]);
      setYieldRes(y.data); setRotation(r.data);
    } catch (e) {
      toast.error("Yield/rotation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="rtr-card p-6" data-testid="yield-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="rtr-label flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Yield & Rotation</div>
          <div className="font-serif text-xl text-[#E8E4DB] mt-1">{crop ? `For ${crop}` : "Pick a crop"}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" step="0.1" value={area}
            onChange={(e) => setArea(parseFloat(e.target.value || "1"))}
            className="rtr-input w-20 text-sm py-1"
            data-testid="yield-area-input"
          />
          <span className="text-[10px] text-[#A69A92] uppercase tracking-widest">ha</span>
          <button onClick={run} disabled={loading || !crop} className="rtr-btn-ghost text-xs" data-testid="run-yield-btn">
            {loading ? "…" : "Estimate"}
          </button>
        </div>
      </div>
      {yieldRes ? (
        <>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="font-serif text-4xl text-[#9EB27A]">{yieldRes.estimated_tonnes}</div>
            <div className="text-xs text-[#A69A92] uppercase tracking-widest">tonnes estimated</div>
          </div>
          <div className="text-xs text-[#A69A92] mt-1">
            Base {yieldRes.base_t_per_ha} t/ha × multiplier {yieldRes.multiplier}
          </div>
          {rotation && (
            <div className="mt-4 pt-4 border-t border-[#433530]">
              <div className="rtr-label flex items-center gap-2 mb-2"><Repeat className="w-3 h-3" /> Next-season rotation</div>
              <div className="text-xs text-[#A69A92] mb-2">Rotate from {rotation.current_family} → {rotation.next_families.join(", ")}</div>
              <div className="flex flex-wrap gap-2">
                {rotation.rotation_options.map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded-full bg-[#CBA279]/10 text-[#CBA279] border border-[#CBA279]/40">{c}</span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-[#A69A92] text-sm">Estimate harvest tonnage and a rotation plan for the next season.</div>
      )}
    </div>
  );
}

function AiAssistant({ soil, selectedCrop }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Sprout, your farming assistant. Ask me anything — from pH balancing to homemade fertilizers. I'll use your soil readings if you've saved them." },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const sessionId = useRef(`rtr_${Math.random().toString(36).slice(2, 10)}`);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId.current,
          message: text,
          context: {
            soil: soil || null,
            crops: selectedCrop ? [selectedCrop] : [],
          },
        }),
      });
      if (!res.ok || !res.body) throw new Error("Chat request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const p of parts) {
          if (!p.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(p.slice(5).trim());
            if (ev.delta) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + ev.delta };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Sorry — I couldn't reach the assistant. Please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="rtr-card col-span-full" data-testid="ai-assistant-card">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#433530]">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-[#9EB27A]/15 border border-[#9EB27A]/40 grid place-items-center">
            <Bot className="w-5 h-5 text-[#9EB27A]" />
          </span>
          <div>
            <div className="rtr-label flex items-center gap-2"><Sparkles className="w-3 h-3" /> AI Assistant · Sprout</div>
            <div className="font-serif text-xl text-[#E8E4DB]">Powered by Claude Sonnet 4.5</div>
          </div>
        </div>
        <MessageCircle className="w-5 h-5 text-[#CBA279]" />
      </div>
      <div ref={scrollRef} className="h-[420px] overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <span className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-[#CBA279]/15 border border-[#CBA279]/40" : "bg-[#9EB27A]/15 border border-[#9EB27A]/40"}`}>
              {m.role === "user" ? <UserIcon className="w-4 h-4 text-[#CBA279]" /> : <Bot className="w-4 h-4 text-[#9EB27A]" />}
            </span>
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed text-sm ${m.role === "user" ? "bg-[#CBA279]/10 text-[#E8E4DB] rounded-tr-sm" : "bg-[#1C1614] border border-[#433530] text-[#E8E4DB] rounded-tl-sm"}`}>
              {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="w-4 h-4 animate-spin text-[#9EB27A]" /> : null)}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[#433530] flex items-center gap-3">
        <input
          data-testid="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask: 'My tomatoes are wilting at noon — what should I do?'"
          className="rtr-input"
          disabled={streaming}
        />
        <button
          data-testid="chat-send-btn"
          onClick={send} disabled={streaming || !input.trim()}
          className="rtr-btn-primary inline-flex items-center gap-2"
        >
          {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [soil, setSoil] = useState({ nitrogen: 50, phosphorus: 45, potassium: 50, ph: 6.5, moisture: 35, temperature: 22, soil_type: "loam" });
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);

  const reload = async () => {
    try {
      const [l, h] = await Promise.all([api.get("/soil/latest"), api.get("/soil/readings")]);
      if (l.data) { setLatest(l.data); setSoil({ ...soil, ...l.data }); }
      setHistory(h.data || []);
    } catch {}
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        nitrogen: Number(soil.nitrogen), phosphorus: Number(soil.phosphorus),
        potassium: Number(soil.potassium), ph: Number(soil.ph),
        moisture: soil.moisture != null ? Number(soil.moisture) : null,
        temperature: soil.temperature != null ? Number(soil.temperature) : null,
        soil_type: soil.soil_type || "loam",
      };
      const { data } = await api.post("/soil/readings", payload);
      setLatest(data);
      toast.success("Soil reading saved");
      reload();
    } catch (e) {
      toast.error("Save failed — are you signed in?");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 rtr-anim-in" data-testid="dashboard-page">
      <div className="mb-10">
        <div className="rtr-label">Your plot at a glance</div>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#E8E4DB] mt-2">Soil Lab & Recommendations</h1>
        <p className="text-[#A69A92] mt-3 max-w-2xl">
          Log a soil reading, then let Root to Route suggest the best crops, fertilizer mix, expected yield
          and a smart rotation for the next season.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SoilForm soil={soil} setSoil={setSoil} onSave={save} saving={saving} />
        <NpkChart soil={latest || soil} />
        <PhGauge soil={latest || soil} />
        {history.length >= 2 && <HistoryChart history={history} />}
        <CropRecommendation soil={latest || soil} onPick={setSelectedCrop} />
        <FertilizerCard soil={latest || soil} crop={selectedCrop} />
        <YieldCard soil={latest || soil} crop={selectedCrop} />
        <AiAssistant soil={latest || soil} selectedCrop={selectedCrop} />
      </div>
    </div>
  );
}
