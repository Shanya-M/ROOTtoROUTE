from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import json
import asyncio
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Annotated

import bcrypt
import httpx
import jwt as pyjwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, BeforeValidator, ConfigDict

from crop_data import CROPS, YIELDS, FAMILIES, ROTATE_TO
from articles_data import CURATED_ARTICLES

logger = logging.getLogger("rtr")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

# ---- Mongo ----
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---- Auth helpers ----
JWT_ALG = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(uid: str, email: str) -> str:
    payload = {"sub": uid, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---- Models ----
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(alias="_id")
    email: EmailStr
    name: Optional[str] = None

class SoilReadingIn(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    moisture: Optional[float] = None
    temperature: Optional[float] = None
    soil_type: Optional[str] = "loam"
    note: Optional[str] = None

class CropRecRequest(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    temperature: float
    humidity: Optional[float] = 60
    rainfall: Optional[float] = 80
    soil_type: Optional[str] = "loam"

class FertilizerRequest(BaseModel):
    crop: str
    nitrogen: float
    phosphorus: float
    potassium: float
    soil_type: Optional[str] = "loam"

class YieldRequest(BaseModel):
    crop: str
    area_hectares: float = 1.0
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    temperature: float

class ArticleIn(BaseModel):
    title: str
    summary: Optional[str] = ""
    content: str
    category: Optional[str] = "General"
    image_url: Optional[str] = None

class ActivityIn(BaseModel):
    type: str
    description: str

class AlertIn(BaseModel):
    severity: str
    title: str
    description: str

class ChatIn(BaseModel):
    session_id: str
    message: str
    context: Optional[dict] = None

# ---- App + router ----
app = FastAPI(title="Root to Route API")
api = APIRouter(prefix="/api")

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.soil_readings.create_index([("user_id", 1), ("created_at", -1)])
    await db.activities.create_index([("user_id", 1), ("created_at", -1)])
    await db.alerts.create_index([("user_id", 1), ("created_at", -1)])
    await db.articles.create_index([("user_id", 1), ("created_at", -1)])
    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])
    logger.info("Startup complete")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ---------- Auth ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {"email": email, "password_hash": hash_password(payload.password),
           "name": payload.name or email.split("@")[0], "role": "user",
           "created_at": datetime.now(timezone.utc).isoformat()}
    r = await db.users.insert_one(doc)
    token = create_access_token(str(r.inserted_id), email)
    response.set_cookie("access_token", token, httponly=True, secure=False,
                        samesite="lax", max_age=7 * 24 * 3600, path="/")
    return {"id": str(r.inserted_id), "email": email, "name": doc["name"], "token": token}

@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    response.set_cookie("access_token", token, httponly=True, secure=False,
                        samesite="lax", max_age=7 * 24 * 3600, path="/")
    return {"id": str(user["_id"]), "email": email, "name": user.get("name"), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["_id"], "email": user["email"], "name": user.get("name")}

# ---------- Soil readings ----------
@api.post("/soil/readings")
async def save_reading(payload: SoilReadingIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["user_id"] = user["_id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.soil_readings.insert_one(doc)
    await db.activities.insert_one({
        "user_id": user["_id"],
        "type": "soil_reading",
        "description": f"Logged soil reading: N={payload.nitrogen}, P={payload.phosphorus}, K={payload.potassium}, pH={payload.ph}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    doc["_id"] = str(r.inserted_id)
    return doc

@api.get("/soil/readings")
async def list_readings(user: dict = Depends(get_current_user), limit: int = 30):
    cur = db.soil_readings.find({"user_id": user["_id"]}).sort("created_at", -1).limit(limit)
    out = []
    async for d in cur:
        d["_id"] = str(d["_id"])
        out.append(d)
    return list(reversed(out))

@api.get("/soil/latest")
async def latest_reading(user: dict = Depends(get_current_user)):
    d = await db.soil_readings.find_one({"user_id": user["_id"]}, sort=[("created_at", -1)])
    if not d:
        return None
    d["_id"] = str(d["_id"])
    return d

# ---------- Recommendations ----------
def _score_crop(crop, n, p, k, ph, temp, humidity, rainfall, soil_type):
    # Inverse-distance scoring on normalised feature deltas (smaller = better).
    def norm(a, b, scale):
        return (a - b) / scale
    d = (
        norm(n, crop["N"], 60) ** 2 +
        norm(p, crop["P"], 60) ** 2 +
        norm(k, crop["K"], 80) ** 2 +
        norm(ph, crop["ph"], 1.5) ** 2 +
        norm(temp, crop["temp"], 10) ** 2 +
        norm(humidity, crop["humidity"], 40) ** 2 * 0.5 +
        norm(rainfall, crop["rainfall"], 120) ** 2 * 0.5
    )
    score = 1.0 / (1.0 + d)
    if soil_type and soil_type.lower() in [s.lower() for s in crop["soils"]]:
        score *= 1.15
    return score

@api.post("/recommend/crops")
async def recommend_crops(req: CropRecRequest):
    scored = []
    for c in CROPS:
        s = _score_crop(c, req.nitrogen, req.phosphorus, req.potassium,
                        req.ph, req.temperature, req.humidity or 60,
                        req.rainfall or 80, req.soil_type or "loam")
        scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    top3 = scored[:3]
    out = []
    for s, c in top3:
        out.append({
            "name": c["name"],
            "confidence": round(min(0.99, 0.55 + 0.45 * (s / scored[0][0])), 3),
            "season": c["season"],
            "growth_days": c["days"],
            "ideal": {"N": c["N"], "P": c["P"], "K": c["K"], "ph": c["ph"], "temp": c["temp"]},
            "soils": c["soils"],
            "info": f"{c['name']} grows best at ~{c['temp']}°C with NPK {c['N']}/{c['P']}/{c['K']} and pH ~{c['ph']}. Typical cycle: {c['days']} days."
        })
    return {"recommendations": out}

@api.post("/recommend/fertilizer")
async def recommend_fertilizer(req: FertilizerRequest):
    crop = next((c for c in CROPS if c["name"].lower() == req.crop.lower()), None)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not in database")
    deltas = {"N": crop["N"] - req.nitrogen, "P": crop["P"] - req.phosphorus, "K": crop["K"] - req.potassium}
    suggestions = []
    if deltas["N"] > 10:
        suggestions.append({"nutrient": "Nitrogen", "delta_ppm": round(deltas["N"], 1),
                            "synthetic": "Urea (46-0-0): ~50-100 kg/ha",
                            "organic": "Composted poultry manure, blood meal, alfalfa meal"})
    elif deltas["N"] < -10:
        suggestions.append({"nutrient": "Nitrogen", "delta_ppm": round(deltas["N"], 1),
                            "synthetic": "Reduce N inputs — plant cover crops to absorb excess",
                            "organic": "Sow rye / oats to mop up excess N"})
    if deltas["P"] > 10:
        suggestions.append({"nutrient": "Phosphorus", "delta_ppm": round(deltas["P"], 1),
                            "synthetic": "DAP (18-46-0) or SSP (0-16-0): ~40-80 kg/ha",
                            "organic": "Bone meal, rock phosphate, banana peel compost"})
    if deltas["K"] > 10:
        suggestions.append({"nutrient": "Potassium", "delta_ppm": round(deltas["K"], 1),
                            "synthetic": "MOP (0-0-60) or SOP (0-0-50): ~30-70 kg/ha",
                            "organic": "Wood ash, kelp meal, banana peels, comfrey tea"})
    if not suggestions:
        suggestions.append({"nutrient": "—", "delta_ppm": 0,
                            "synthetic": "Soil NPK is well balanced for this crop. Maintain with light top-dressing.",
                            "organic": "Light compost top-dressing every 4-6 weeks."})
    return {"crop": crop["name"], "ideal": {"N": crop["N"], "P": crop["P"], "K": crop["K"]},
            "current": {"N": req.nitrogen, "P": req.phosphorus, "K": req.potassium},
            "suggestions": suggestions}

@api.post("/recommend/yield")
async def yield_predict(req: YieldRequest):
    crop = next((c for c in CROPS if c["name"].lower() == req.crop.lower()), None)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    base = YIELDS.get(crop["name"], 3.0)
    # Score quality multiplier (0.6 - 1.15)
    score = _score_crop(crop, req.nitrogen, req.phosphorus, req.potassium,
                        req.ph, req.temperature, 65, 90, "loam")
    multiplier = 0.6 + min(0.55, score * 0.9)
    estimated = base * multiplier * req.area_hectares
    return {"crop": crop["name"], "area_hectares": req.area_hectares,
            "base_t_per_ha": base, "multiplier": round(multiplier, 2),
            "estimated_tonnes": round(estimated, 2)}

@api.get("/recommend/rotation/{crop}")
async def rotation(crop: str):
    target = next((c for c in CROPS if c["name"].lower() == crop.lower()), None)
    if not target:
        raise HTTPException(status_code=404, detail="Crop not found")
    fam = FAMILIES.get(target["name"], "leafy")
    next_fams = ROTATE_TO.get(fam, ["legume"])
    candidates = [c["name"] for c in CROPS if FAMILIES.get(c["name"]) in next_fams and c["name"] != target["name"]]
    return {"current": target["name"], "current_family": fam,
            "next_families": next_fams, "rotation_options": candidates[:6]}

# ---------- Weather (Open-Meteo) ----------
@api.get("/weather")
async def weather(lat: float = Query(...), lon: float = Query(...)):
    params = {
        "latitude": lat, "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
        "timezone": "auto", "forecast_days": 7,
    }
    async with httpx.AsyncClient(timeout=12) as ax:
        r = await ax.get("https://api.open-meteo.com/v1/forecast", params=params)
        r.raise_for_status()
        return r.json()

# ---------- Articles ----------
@api.get("/articles/curated")
async def curated():
    return CURATED_ARTICLES

@api.get("/articles/private")
async def my_articles(user: dict = Depends(get_current_user)):
    cur = db.articles.find({"user_id": user["_id"]}).sort("created_at", -1)
    out = []
    async for d in cur:
        d["_id"] = str(d["_id"])
        out.append(d)
    return out

@api.post("/articles/private")
async def create_article(payload: ArticleIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["user_id"] = user["_id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.articles.insert_one(doc)
    doc["_id"] = str(r.inserted_id)
    return doc

@api.delete("/articles/private/{aid}")
async def delete_article(aid: str, user: dict = Depends(get_current_user)):
    r = await db.articles.delete_one({"_id": ObjectId(aid), "user_id": user["_id"]})
    if not r.deleted_count:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

# ---------- Activities + Alerts ----------
@api.get("/activities")
async def activities(user: dict = Depends(get_current_user), limit: int = 10):
    cur = db.activities.find({"user_id": user["_id"]}).sort("created_at", -1).limit(limit)
    out = []
    async for d in cur:
        d["_id"] = str(d["_id"])
        out.append(d)
    return out

@api.post("/activities")
async def add_activity(payload: ActivityIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["user_id"] = user["_id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.activities.insert_one(doc)
    doc["_id"] = str(r.inserted_id)
    return doc

@api.get("/alerts")
async def alerts(user: dict = Depends(get_current_user)):
    cur = db.alerts.find({"user_id": user["_id"], "dismissed": {"$ne": True}}).sort("created_at", -1).limit(20)
    out = []
    async for d in cur:
        d["_id"] = str(d["_id"])
        out.append(d)
    # If no alerts yet, derive simple alerts from latest soil reading
    if not out:
        latest = await db.soil_readings.find_one({"user_id": user["_id"]}, sort=[("created_at", -1)])
        if latest:
            derived = []
            if latest["ph"] < 5.5:
                derived.append({"severity": "warning", "title": "Soil too acidic", "description": "pH below 5.5 — consider lime application."})
            elif latest["ph"] > 7.8:
                derived.append({"severity": "warning", "title": "Soil too alkaline", "description": "pH above 7.8 — add sulphur or organic matter."})
            if latest["nitrogen"] < 30:
                derived.append({"severity": "info", "title": "Low Nitrogen", "description": "N is below 30 ppm — top-dress with composted manure."})
            if latest.get("moisture") is not None and latest["moisture"] < 25:
                derived.append({"severity": "warning", "title": "Low Soil Moisture", "description": "Moisture under 25% — increase watering frequency."})
            return derived
    return out

@api.post("/alerts/{aid}/dismiss")
async def dismiss_alert(aid: str, user: dict = Depends(get_current_user)):
    await db.alerts.update_one({"_id": ObjectId(aid), "user_id": user["_id"]}, {"$set": {"dismissed": True}})
    return {"ok": True}

# ---------- Planting Calendar (deterministic) ----------
@api.get("/calendar/planting")
async def planting_calendar():
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    season_months = {
        "Spring": [2, 3, 4],
        "Summer": [5, 6, 7],
        "Fall":   [8, 9, 10],
        "Winter": [11, 0, 1],
    }
    rows = []
    for c in CROPS:
        plant_idx = season_months[c["season"]][0]
        harvest_idx = (plant_idx + max(1, c["days"] // 30)) % 12
        rows.append({
            "crop": c["name"], "season": c["season"],
            "plant_month": months[plant_idx], "harvest_month": months[harvest_idx],
            "growth_days": c["days"],
            "water_schedule": "Morning" if c["temp"] >= 22 else "Evening",
        })
    return rows

# ---------- AI Assistant (Claude Sonnet 4.5) ----------
SYSTEM_PROMPT = (
    "You are 'Sprout', the AI farming assistant for Root to Route. "
    "Help a solo beginner farmer with practical, beginner-friendly answers about arable farming: "
    "crops, soil health (NPK, pH), planting calendar, irrigation, organic vs synthetic fertilizers, "
    "pests & diseases, indigenous/traditional techniques, and weather adaptation. "
    "Be concise, encouraging, and avoid jargon. When the user provides soil readings, crops, weather, "
    "use those for personalised advice. Prefer simple, low-cost, organic options first."
)

async def _stream_chat(session_id: str, message: str, context_str: str):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT + ("\n\nContext:\n" + context_str if context_str else ""),
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        full = ""
        async for ev in chat.stream_message(UserMessage(text=message)):
            if isinstance(ev, TextDelta):
                full += ev.content
                yield f"data: {json.dumps({'delta': ev.content})}\n\n"
            elif isinstance(ev, StreamDone):
                break
        await db.chat_messages.insert_one({
            "session_id": session_id, "role": "assistant", "content": full,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        msg = str(e)
        if "Budget" in msg or "budget" in msg:
            fallback = ("I'm temporarily offline because the AI key has run out of credits. "
                        "Please top up the Emergent Universal Key from Profile → Universal Key → Add Balance, "
                        "and I'll be right back.")
        else:
            fallback = "Sorry, I had trouble responding just now. Please try again in a moment."
        logger.error("Chat stream failed: %s", msg)
        yield f"data: {json.dumps({'delta': fallback})}\n\n"
    yield f"data: {json.dumps({'done': True})}\n\n"

@api.post("/chat")
async def chat_stream(payload: ChatIn, user: dict = Depends(get_current_user)):
    # Store user message
    await db.chat_messages.insert_one({
        "session_id": payload.session_id, "user_id": user["_id"],
        "role": "user", "content": payload.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    ctx_lines = []
    if payload.context:
        if payload.context.get("soil"):
            s = payload.context["soil"]
            ctx_lines.append(f"User's latest soil: N={s.get('nitrogen')} P={s.get('phosphorus')} K={s.get('potassium')} pH={s.get('ph')} soil_type={s.get('soil_type')}")
        if payload.context.get("weather"):
            w = payload.context["weather"]
            ctx_lines.append(f"Current weather: {w.get('summary')}")
        if payload.context.get("crops"):
            ctx_lines.append("Crops of interest: " + ", ".join(payload.context["crops"]))
    return StreamingResponse(
        _stream_chat(payload.session_id, payload.message, "\n".join(ctx_lines)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@api.get("/chat/{session_id}")
async def chat_history(session_id: str, user: dict = Depends(get_current_user)):
    cur = db.chat_messages.find({"session_id": session_id, "user_id": user["_id"]}).sort("created_at", 1)
    out = []
    async for d in cur:
        d["_id"] = str(d["_id"])
        out.append(d)
    # also include assistant messages with no user_id but matching session
    cur2 = db.chat_messages.find({"session_id": session_id, "role": "assistant"}).sort("created_at", 1)
    async for d in cur2:
        if not any(o["_id"] == str(d["_id"]) for o in out):
            d["_id"] = str(d["_id"])
            out.append(d)
    out.sort(key=lambda x: x.get("created_at", ""))
    return out

# Mount
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
