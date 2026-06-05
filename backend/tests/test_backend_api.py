"""DBS Factory - Backend API tests (pytest).

Covers auth, visitors, contractors, labours, attendance, dashboard.
Base URL is taken from EXPO_PUBLIC_BACKEND_URL (frontend env) with /api prefix.
"""
import os
import uuid
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

FRONTEND_ENV = dotenv_values(Path("/app/frontend/.env"))
BASE_URL = (FRONTEND_ENV.get("EXPO_PUBLIC_BACKEND_URL")
            or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
            or os.environ.get("EXPO_BACKEND_URL"))
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set"
BASE = BASE_URL.rstrip("/") + "/api"

# tiny placeholder base64 (1x1 transparent png)
PHOTO_B64 = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def guard_token():
    r = requests.post(f"{BASE}/auth/login", json={"username": "guard", "password": "guard123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def contractor_id(admin_token):
    r = requests.get(f"{BASE}/contractors", headers=h(admin_token))
    assert r.status_code == 200
    items = r.json()
    assert items, "no contractors seeded"
    return items[0]["id"]


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

class TestAuth:
    def test_login_admin_returns_token_and_user(self):
        r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and data["token_type"] == "bearer"
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "admin"

    def test_login_guard_returns_token_and_user(self):
        r = requests.post(f"{BASE}/auth/login", json={"username": "guard", "password": "guard123"})
        assert r.status_code == 200, r.text
        assert r.json()["user"]["role"] == "guard"

    def test_login_wrong_password_401(self):
        r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "nope"})
        assert r.status_code == 401

    def test_me_admin(self, admin_token):
        r = requests.get(f"{BASE}/auth/me", headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_me_guard(self, guard_token):
        r = requests.get(f"{BASE}/auth/me", headers=h(guard_token))
        assert r.status_code == 200
        assert r.json()["role"] == "guard"

    def test_me_without_token_401(self):
        r = requests.get(f"{BASE}/auth/me")
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# VISITORS
# ---------------------------------------------------------------------------

class TestVisitors:
    def test_create_and_list_visitor(self, guard_token):
        unique = f"TEST_Visitor_{uuid.uuid4().hex[:6]}"
        payload = {
            "visitor_name": unique,
            "mobile_number": "9999911111",
            "purpose": "Delivery Inspection",
            "photo_base64": PHOTO_B64,
            "gate_name": "Gate-1",
        }
        r = requests.post(f"{BASE}/visitors", json=payload, headers=h(guard_token))
        assert r.status_code == 200, r.text
        v = r.json()
        assert v["visitor_name"] == unique
        assert v["entry_datetime"]
        assert v["created_by"]
        assert v["created_by_name"]

        # list & filter by name
        r2 = requests.get(f"{BASE}/visitors", params={"visitor_name": unique}, headers=h(guard_token))
        assert r2.status_code == 200
        names = [x["visitor_name"] for x in r2.json()]
        assert unique in names

    def test_visitor_filter_mobile_and_purpose(self, guard_token):
        unique_mobile = f"800000{int(time.time()) % 10000:04d}"
        payload = {
            "visitor_name": "TEST_Filter",
            "mobile_number": unique_mobile,
            "purpose": "AuditXYZ",
            "photo_base64": PHOTO_B64,
            "gate_name": "Gate-2",
        }
        requests.post(f"{BASE}/visitors", json=payload, headers=h(guard_token)).raise_for_status()
        r = requests.get(f"{BASE}/visitors", params={"mobile_number": unique_mobile}, headers=h(guard_token))
        assert r.status_code == 200
        assert any(x["mobile_number"] == unique_mobile for x in r.json())
        r = requests.get(f"{BASE}/visitors", params={"purpose": "AuditXYZ"}, headers=h(guard_token))
        assert r.status_code == 200
        assert any("AuditXYZ" in x["purpose"] for x in r.json())


# ---------------------------------------------------------------------------
# CONTRACTORS
# ---------------------------------------------------------------------------

class TestContractors:
    def test_list_with_admin_and_guard(self, admin_token, guard_token):
        for tok in [admin_token, guard_token]:
            r = requests.get(f"{BASE}/contractors", headers=h(tok))
            assert r.status_code == 200, r.text
            assert isinstance(r.json(), list)
            assert len(r.json()) >= 2
            names = {c["contractor_name"] for c in r.json()}
            assert "Apex Engineering" in names
            assert "Sunrise Constructions" in names

    def test_create_contractor_admin_only(self, admin_token, guard_token):
        body = {
            "contractor_name": f"TEST_Contractor_{uuid.uuid4().hex[:6]}",
            "contact_person": "John",
            "mobile_number": "9000000000",
            "address": "Test",
        }
        # guard forbidden
        r = requests.post(f"{BASE}/contractors", json=body, headers=h(guard_token))
        assert r.status_code == 403

        # admin allowed
        r = requests.post(f"{BASE}/contractors", json=body, headers=h(admin_token))
        assert r.status_code == 200, r.text
        cid = r.json()["id"]

        # update
        body2 = {**body, "contact_person": "Updated"}
        r = requests.put(f"{BASE}/contractors/{cid}", json=body2, headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["contact_person"] == "Updated"

        # delete
        r = requests.delete(f"{BASE}/contractors/{cid}", headers=h(admin_token))
        assert r.status_code == 200
        # verify gone
        r = requests.put(f"{BASE}/contractors/{cid}", json=body, headers=h(admin_token))
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# LABOURS
# ---------------------------------------------------------------------------

class TestLabours:
    def test_create_labour_format_and_contractor_name(self, admin_token, contractor_id):
        aadhaar = f"9{int(time.time() * 1000) % 10**11:011d}"
        payload = {
            "labour_name": "TEST_Labour_A",
            "contractor_id": contractor_id,
            "category": "Mason",
            "photo_base64": PHOTO_B64,
            "aadhaar_number": aadhaar,
            "mobile_number": "7000000000",
        }
        r = requests.post(f"{BASE}/labours", json=payload, headers=h(admin_token))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["labour_id"].startswith("LAB-")
        assert len(d["labour_id"]) == 4 + 6  # "LAB-" + 6 digits
        assert d["labour_id"][4:].isdigit()
        assert d["contractor_name"] in ("Apex Engineering", "Sunrise Constructions") or d["contractor_name"]
        # store for later tests
        TestLabours.created = d

    def test_duplicate_aadhaar_rejected(self, admin_token, contractor_id):
        aadhaar = f"8{int(time.time() * 1000) % 10**11:011d}"
        payload = {
            "labour_name": "TEST_Dup",
            "contractor_id": contractor_id,
            "category": "Helper",
            "photo_base64": PHOTO_B64,
            "aadhaar_number": aadhaar,
        }
        r1 = requests.post(f"{BASE}/labours", json=payload, headers=h(admin_token))
        assert r1.status_code == 200
        r2 = requests.post(f"{BASE}/labours", json=payload, headers=h(admin_token))
        assert r2.status_code == 400

    def test_search_labour(self, admin_token):
        lid = TestLabours.created["labour_id"]
        for q in [lid, "TEST_Labour_A"]:
            r = requests.get(f"{BASE}/labours", params={"q": q}, headers=h(admin_token))
            assert r.status_code == 200
            assert any(x["labour_id"] == lid for x in r.json()), f"search {q} missing {lid}"

    def test_get_single_labour(self, admin_token):
        lid = TestLabours.created["labour_id"]
        r = requests.get(f"{BASE}/labours/{lid}", headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["labour_id"] == lid

    def test_get_labour_404(self, admin_token):
        r = requests.get(f"{BASE}/labours/LAB-999999", headers=h(admin_token))
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# ATTENDANCE
# ---------------------------------------------------------------------------

class TestAttendance:
    @pytest.fixture(scope="class")
    def labour_id(self, admin_token, contractor_id):
        payload = {
            "labour_name": f"TEST_Att_{uuid.uuid4().hex[:5]}",
            "contractor_id": contractor_id,
            "category": "Electrician",
            "photo_base64": PHOTO_B64,
            "aadhaar_number": f"7{int(time.time() * 1000) % 10**11:011d}",
        }
        r = requests.post(f"{BASE}/labours", json=payload, headers=h(admin_token))
        assert r.status_code == 200
        return r.json()["labour_id"]

    def test_checkout_without_checkin_400(self, admin_token, labour_id):
        r = requests.post(f"{BASE}/labours/{labour_id}/checkout", headers=h(admin_token))
        assert r.status_code == 400

    def test_checkin_then_inside_then_dup_then_checkout(self, guard_token, labour_id):
        r = requests.post(f"{BASE}/labours/{labour_id}/checkin?gate_name=Gate-1", headers=h(guard_token))
        assert r.status_code == 200, r.text
        rec = r.json()
        assert rec["status"] == "inside"
        assert rec["check_in_time"]

        # currently inside
        r = requests.get(f"{BASE}/attendance/inside", headers=h(guard_token))
        assert r.status_code == 200
        lids = [x["labour_id"] for x in r.json()]
        assert labour_id in lids
        # photo attached
        match = [x for x in r.json() if x["labour_id"] == labour_id][0]
        assert match.get("photo_base64")

        # duplicate checkin -> 400
        r = requests.post(f"{BASE}/labours/{labour_id}/checkin", headers=h(guard_token))
        assert r.status_code == 400

        # wait a moment so total_hours > 0
        time.sleep(1)
        r = requests.post(f"{BASE}/labours/{labour_id}/checkout?gate_name=Gate-1", headers=h(guard_token))
        assert r.status_code == 200
        rec = r.json()
        assert rec["status"] == "checked_out"
        assert rec["check_out_time"]
        assert rec["total_hours"] is not None

    def test_attendance_list_and_filters(self, admin_token, labour_id):
        r = requests.get(f"{BASE}/attendance", params={"labour_name": "TEST_Att"}, headers=h(admin_token))
        assert r.status_code == 200
        assert any(x["labour_id"] == labour_id for x in r.json())
        r = requests.get(f"{BASE}/attendance", params={"category": "Electrician"}, headers=h(admin_token))
        assert r.status_code == 200
        assert all(x.get("category") == "Electrician" for x in r.json())


# ---------------------------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------------------------

class TestDashboard:
    def test_admin_dashboard_stats(self, admin_token):
        r = requests.get(f"{BASE}/dashboard/stats", headers=h(admin_token))
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("visitors_today", "labour_inside", "checked_out_today",
                    "total_labour", "contractor_count", "contractors"):
            assert key in d, f"missing {key}"
        assert isinstance(d["contractors"], list)
        if d["contractors"]:
            c = d["contractors"][0]
            assert "labour_count" in c
            assert "attendance_today" in c

    def test_guard_dashboard_403(self, guard_token):
        r = requests.get(f"{BASE}/dashboard/stats", headers=h(guard_token))
        assert r.status_code == 403
