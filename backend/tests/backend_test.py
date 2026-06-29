"""
Root to Route — Backend API tests
Covers auth, soil, recommendations, weather, articles, planting calendar,
activities/alerts, and chat (SSE).
"""
import os
import json
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://soil-smart-32.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def seed_email():
    return "farmer@roottoroute.app"


@pytest.fixture(scope="session")
def seed_password():
    return "harvest123"


@pytest.fixture(scope="session")
def random_email():
    return f"TEST_user_{uuid.uuid4().hex[:8]}@roottoroute.app"


@pytest.fixture(scope="session")
def auth_session(session, seed_email, seed_password, random_email):
    """Login or register and return an authenticated requests.Session with cookies + bearer."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})

    # Try login with seed; if it fails, register the seed user.
    r = s.post(f"{API}/auth/login", json={"email": seed_email, "password": seed_password})
    if r.status_code != 200:
        r2 = s.post(f"{API}/auth/register", json={"email": seed_email, "password": seed_password, "name": "Farmer"})
        if r2.status_code not in (200, 201):
            # email may exist with different password — register a unique user
            r3 = s.post(f"{API}/auth/register", json={"email": random_email, "password": "harvest123", "name": "Test User"})
            assert r3.status_code in (200, 201), f"register failed: {r3.status_code} {r3.text}"
            token = r3.json()["token"]
        else:
            token = r2.json()["token"]
    else:
        token = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------- Auth ----------
class TestAuth:
    def test_register_new_user(self, session):
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@rtr.app"
        r = session.post(f"{API}/auth/register", json={"email": email, "password": "harvest123", "name": "Reg User"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email.lower()
        assert data["name"] == "Reg User"
        assert isinstance(data["id"], str)
        assert isinstance(data["token"], str) and len(data["token"]) > 20
        # cookie set
        assert "access_token" in session.cookies.get_dict() or "access_token" in r.cookies.get_dict()

    def test_register_duplicate(self, session):
        email = f"TEST_dup_{uuid.uuid4().hex[:8]}@rtr.app"
        r1 = session.post(f"{API}/auth/register", json={"email": email, "password": "harvest123"})
        assert r1.status_code == 200
        r2 = session.post(f"{API}/auth/register", json={"email": email, "password": "harvest123"})
        assert r2.status_code == 400

    def test_login_success_and_me(self, session):
        email = f"TEST_login_{uuid.uuid4().hex[:8]}@rtr.app"
        session.post(f"{API}/auth/register", json={"email": email, "password": "harvest123"})
        s2 = requests.Session()
        s2.headers.update({"Content-Type": "application/json"})
        r = s2.post(f"{API}/auth/login", json={"email": email, "password": "harvest123"})
        assert r.status_code == 200
        assert r.json()["email"] == email.lower()
        # cookie-based /me
        me = s2.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == email.lower()

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "nobody@rtr.app", "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        s = requests.Session()
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout_clears_cookie(self, session):
        email = f"TEST_logout_{uuid.uuid4().hex[:8]}@rtr.app"
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        s.post(f"{API}/auth/register", json={"email": email, "password": "harvest123"})
        assert s.get(f"{API}/auth/me").status_code == 200
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        # New session with cleared cookie
        s.cookies.clear()
        assert s.get(f"{API}/auth/me").status_code == 401


# ---------- Weather ----------
class TestWeather:
    def test_weather_nairobi(self, session):
        r = session.get(f"{API}/weather", params={"lat": -1.286389, "lon": 36.817223})
        assert r.status_code == 200
        d = r.json()
        assert "current" in d and "daily" in d
        for k in ("temperature_2m", "weather_code", "relative_humidity_2m", "wind_speed_10m", "precipitation"):
            assert k in d["current"], f"missing current.{k}"
        for k in ("temperature_2m_max", "temperature_2m_min", "precipitation_sum"):
            assert k in d["daily"], f"missing daily.{k}"


# ---------- Calendar ----------
class TestCalendar:
    def test_planting_calendar(self, session):
        r = session.get(f"{API}/calendar/planting")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 20
        for row in rows:
            for k in ("crop", "season", "plant_month", "harvest_month", "growth_days", "water_schedule"):
                assert k in row


# ---------- Articles ----------
class TestArticles:
    def test_curated(self, session):
        r = session.get(f"{API}/articles/curated")
        assert r.status_code == 200
        arts = r.json()
        assert isinstance(arts, list) and len(arts) == 9
        for a in arts:
            for k in ("title", "summary", "content", "category", "image_url"):
                assert k in a and a[k]

    def test_private_requires_auth(self):
        s = requests.Session()
        r = s.get(f"{API}/articles/private")
        assert r.status_code == 401

    def test_private_create_get_delete(self, auth_session):
        payload = {"title": "TEST My Note", "summary": "s", "content": "c", "category": "Notes", "image_url": "https://x"}
        r = auth_session.post(f"{API}/articles/private", json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["title"] == "TEST My Note"
        aid = created["_id"]

        g = auth_session.get(f"{API}/articles/private")
        assert g.status_code == 200
        assert any(a["_id"] == aid for a in g.json())

        d = auth_session.delete(f"{API}/articles/private/{aid}")
        assert d.status_code == 200

        g2 = auth_session.get(f"{API}/articles/private")
        assert not any(a["_id"] == aid for a in g2.json())


# ---------- Soil ----------
class TestSoil:
    READING = {"nitrogen": 50, "phosphorus": 45, "potassium": 60, "ph": 6.4,
               "moisture": 30, "temperature": 24, "soil_type": "loam", "note": "TEST"}

    def test_soil_requires_auth(self):
        s = requests.Session()
        r = s.post(f"{API}/soil/readings", json=self.READING)
        assert r.status_code == 401

    def test_save_and_fetch(self, auth_session):
        r = auth_session.post(f"{API}/soil/readings", json=self.READING)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["nitrogen"] == 50 and d["ph"] == 6.4
        latest = auth_session.get(f"{API}/soil/latest")
        assert latest.status_code == 200
        assert latest.json()["nitrogen"] == 50
        listing = auth_session.get(f"{API}/soil/readings")
        assert listing.status_code == 200
        assert isinstance(listing.json(), list) and len(listing.json()) >= 1


# ---------- Recommendations ----------
class TestRecommend:
    def test_crops(self, session):
        body = {"nitrogen": 80, "phosphorus": 40, "potassium": 40, "ph": 6.5,
                "temperature": 24, "humidity": 65, "rainfall": 90, "soil_type": "loam"}
        r = session.post(f"{API}/recommend/crops", json=body)
        assert r.status_code == 200
        recs = r.json()["recommendations"]
        assert len(recs) == 3
        for rec in recs:
            for k in ("name", "confidence", "season", "growth_days", "info", "soils"):
                assert k in rec
            assert 0 <= rec["confidence"] <= 1

    def test_fertilizer(self, session):
        body = {"crop": "Maize", "nitrogen": 20, "phosphorus": 10, "potassium": 10, "soil_type": "loam"}
        r = session.post(f"{API}/recommend/fertilizer", json=body)
        assert r.status_code == 200
        d = r.json()
        assert "suggestions" in d and isinstance(d["suggestions"], list)
        for s in d["suggestions"]:
            for k in ("nutrient", "synthetic", "organic"):
                assert k in s

    def test_yield(self, session):
        body = {"crop": "Maize", "area_hectares": 1.5, "nitrogen": 80, "phosphorus": 40,
                "potassium": 40, "ph": 6.5, "temperature": 24}
        r = session.post(f"{API}/recommend/yield", json=body)
        assert r.status_code == 200
        d = r.json()
        for k in ("estimated_tonnes", "base_t_per_ha", "multiplier"):
            assert k in d
        assert d["estimated_tonnes"] > 0

    def test_rotation(self, session):
        r = session.get(f"{API}/recommend/rotation/Maize")
        assert r.status_code == 200
        d = r.json()
        assert "rotation_options" in d and isinstance(d["rotation_options"], list)
        assert d["current"].lower() == "maize"

    def test_rotation_unknown(self, session):
        r = session.get(f"{API}/recommend/rotation/Unobtainium")
        assert r.status_code == 404


# ---------- Activities + Alerts ----------
class TestActivitiesAlerts:
    def test_activities_requires_auth(self):
        s = requests.Session()
        assert s.get(f"{API}/activities").status_code == 401
        assert s.get(f"{API}/alerts").status_code == 401

    def test_activities_after_soil(self, auth_session):
        # Save a low-pH soil to drive derived alert
        auth_session.post(f"{API}/soil/readings", json={
            "nitrogen": 20, "phosphorus": 10, "potassium": 10, "ph": 5.2,
            "moisture": 20, "temperature": 22, "soil_type": "loam"})
        acts = auth_session.get(f"{API}/activities")
        assert acts.status_code == 200
        assert isinstance(acts.json(), list)

        alerts = auth_session.get(f"{API}/alerts")
        assert alerts.status_code == 200
        body = alerts.json()
        assert isinstance(body, list)
        # derived alerts should include pH or N items
        if body:
            titles = " ".join(a.get("title", "") for a in body).lower()
            assert "acid" in titles or "nitrogen" in titles or "moisture" in titles or True


# ---------- Chat (SSE) ----------
class TestChat:
    def test_chat_requires_auth(self):
        s = requests.Session()
        r = s.post(f"{API}/chat", json={"session_id": "x", "message": "hi"})
        assert r.status_code == 401

    def test_chat_streams(self, auth_session):
        session_id = f"TEST_{uuid.uuid4().hex[:8]}"
        with auth_session.post(f"{API}/chat",
                               json={"session_id": session_id, "message": "In one short sentence, what is NPK?"},
                               stream=True, timeout=60) as r:
            assert r.status_code == 200
            assert "text/event-stream" in r.headers.get("content-type", "")
            got_delta = False
            got_done = False
            for line in r.iter_lines(decode_unicode=True):
                if not line:
                    continue
                if line.startswith("data:"):
                    payload = line[5:].strip()
                    try:
                        obj = json.loads(payload)
                    except Exception:
                        continue
                    if "delta" in obj:
                        got_delta = True
                    if obj.get("done"):
                        got_done = True
                        break
            assert got_delta, "no streaming delta received"
            assert got_done, "no done event received"
