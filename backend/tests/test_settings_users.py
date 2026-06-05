"""DBS Factory - Backend tests for Settings, Change Password, and Users management.

Targets the new admin Settings addon endpoints:
  - GET/PUT /api/settings
  - POST /api/auth/change-password
  - GET/POST/PUT/DELETE /api/users

IMPORTANT: any password change on admin/guard must be reverted before exit so
admin/admin123 and guard/guard123 keep working.
"""
import os
import uuid
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


def h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_user(admin_token):
    r = requests.get(f"{BASE}/auth/me", headers=h(admin_token))
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="module")
def guard_token():
    r = requests.post(f"{BASE}/auth/login", json={"username": "guard", "password": "guard123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class TestSettings:
    def test_get_settings_with_admin_has_defaults(self, admin_token):
        r = requests.get(f"{BASE}/settings", headers=h(admin_token))
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("business_name", "labour_categories", "visit_purposes", "gates"):
            assert k in d, f"missing {k}"
        assert isinstance(d["business_name"], str) and d["business_name"]
        assert isinstance(d["labour_categories"], list) and len(d["labour_categories"]) > 0
        assert isinstance(d["visit_purposes"], list) and len(d["visit_purposes"]) > 0
        assert isinstance(d["gates"], list) and len(d["gates"]) > 0

    def test_get_settings_with_guard_works(self, guard_token):
        r = requests.get(f"{BASE}/settings", headers=h(guard_token))
        assert r.status_code == 200, r.text
        assert "business_name" in r.json()

    def test_put_settings_with_guard_returns_403(self, guard_token):
        r = requests.put(f"{BASE}/settings",
                         json={"business_name": "Hacker Co"},
                         headers=h(guard_token))
        assert r.status_code == 403

    def test_put_settings_admin_updates_all_fields_and_persists(self, admin_token):
        # capture original values to restore later
        original = requests.get(f"{BASE}/settings", headers=h(admin_token)).json()
        try:
            new_business = f"TEST_Biz_{uuid.uuid4().hex[:6]}"
            payload = {
                "business_name": new_business,
                "labour_categories": ["Welder", "Fitter", "TEST_Cat"],
                "visit_purposes": ["Meeting", "TEST_Purpose"],
                "gates": ["Main Gate", "TEST_Gate"],
            }
            r = requests.put(f"{BASE}/settings", json=payload, headers=h(admin_token))
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["business_name"] == new_business
            assert "TEST_Cat" in d["labour_categories"]
            assert "TEST_Purpose" in d["visit_purposes"]
            assert "TEST_Gate" in d["gates"]

            # GET again - verify persistence
            d2 = requests.get(f"{BASE}/settings", headers=h(admin_token)).json()
            assert d2["business_name"] == new_business
            assert "TEST_Cat" in d2["labour_categories"]
            assert "TEST_Purpose" in d2["visit_purposes"]
            assert "TEST_Gate" in d2["gates"]
        finally:
            # restore originals
            restore = {
                "business_name": original["business_name"],
                "labour_categories": original["labour_categories"],
                "visit_purposes": original["visit_purposes"],
                "gates": original["gates"],
            }
            rr = requests.put(f"{BASE}/settings", json=restore, headers=h(admin_token))
            assert rr.status_code == 200

    def test_put_settings_partial_update(self, admin_token):
        original = requests.get(f"{BASE}/settings", headers=h(admin_token)).json()
        try:
            r = requests.put(f"{BASE}/settings",
                             json={"business_name": "TEST_PartialName"},
                             headers=h(admin_token))
            assert r.status_code == 200
            d = r.json()
            assert d["business_name"] == "TEST_PartialName"
            # untouched lists preserved
            assert d["labour_categories"] == original["labour_categories"]
            assert d["visit_purposes"] == original["visit_purposes"]
            assert d["gates"] == original["gates"]
        finally:
            requests.put(f"{BASE}/settings",
                         json={"business_name": original["business_name"]},
                         headers=h(admin_token))


# ---------------------------------------------------------------------------
# Change Password
# ---------------------------------------------------------------------------

class TestChangePassword:
    def test_change_password_wrong_current_returns_400(self, admin_token):
        r = requests.post(f"{BASE}/auth/change-password",
                          json={"current_password": "wrongpass", "new_password": "abcdef"},
                          headers=h(admin_token))
        assert r.status_code == 400

    def test_change_password_short_new_returns_400(self, admin_token):
        r = requests.post(f"{BASE}/auth/change-password",
                          json={"current_password": "admin123", "new_password": "abc"},
                          headers=h(admin_token))
        assert r.status_code == 400

    def test_change_password_full_flow_then_revert(self):
        # login fresh
        r = requests.post(f"{BASE}/auth/login",
                          json={"username": "admin", "password": "admin123"})
        assert r.status_code == 200
        tok = r.json()["access_token"]

        new_pass = "newadminpw123"
        # change to new
        r = requests.post(f"{BASE}/auth/change-password",
                          json={"current_password": "admin123", "new_password": new_pass},
                          headers=h(tok))
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

        try:
            # old password should no longer work
            r_old = requests.post(f"{BASE}/auth/login",
                                  json={"username": "admin", "password": "admin123"})
            assert r_old.status_code == 401

            # new password works
            r_new = requests.post(f"{BASE}/auth/login",
                                  json={"username": "admin", "password": new_pass})
            assert r_new.status_code == 200, r_new.text
            new_tok = r_new.json()["access_token"]
        finally:
            # Revert no matter what
            # Use whichever token still valid; the token issued before pw change should still be valid (JWT)
            revert_tok = tok
            rr = requests.post(f"{BASE}/auth/change-password",
                               json={"current_password": new_pass, "new_password": "admin123"},
                               headers=h(revert_tok))
            assert rr.status_code == 200, f"FAILED to revert admin password: {rr.text}"

        # final sanity: admin/admin123 works again
        r_final = requests.post(f"{BASE}/auth/login",
                                json={"username": "admin", "password": "admin123"})
        assert r_final.status_code == 200, "admin/admin123 not restored!"


# ---------------------------------------------------------------------------
# Users management (admin only)
# ---------------------------------------------------------------------------

class TestUsersManagement:
    created_uid = None  # class-scope holder

    def test_list_users_admin(self, admin_token):
        r = requests.get(f"{BASE}/users", headers=h(admin_token))
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        usernames = {u["username"] for u in items}
        assert "admin" in usernames
        assert "guard" in usernames
        # no password_hash leakage
        for u in items:
            assert "password_hash" not in u
            assert {"id", "name", "username", "role"} <= set(u.keys())

    def test_list_users_guard_returns_403(self, guard_token):
        r = requests.get(f"{BASE}/users", headers=h(guard_token))
        assert r.status_code == 403

    def test_create_user_short_password_400(self, admin_token):
        body = {"name": "Short", "username": f"test_short_{uuid.uuid4().hex[:5]}",
                "password": "abc", "role": "guard"}
        r = requests.post(f"{BASE}/users", json=body, headers=h(admin_token))
        assert r.status_code == 400

    def test_create_user_invalid_role_400(self, admin_token):
        body = {"name": "BadRole", "username": f"test_bad_{uuid.uuid4().hex[:5]}",
                "password": "abcdef", "role": "superuser"}
        r = requests.post(f"{BASE}/users", json=body, headers=h(admin_token))
        assert r.status_code == 400

    def test_create_user_admin_creates_guard_and_login_works(self, admin_token):
        uname = f"test_g_{uuid.uuid4().hex[:6]}"
        body = {"name": "TEST Guard X", "username": uname,
                "password": "guardpw123", "role": "guard"}
        r = requests.post(f"{BASE}/users", json=body, headers=h(admin_token))
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["username"] == uname
        assert u["role"] == "guard"
        TestUsersManagement.created_uid = u["id"]

        # verify via GET /users
        r2 = requests.get(f"{BASE}/users", headers=h(admin_token))
        assert any(x["id"] == u["id"] for x in r2.json())

        # new user can log in
        r3 = requests.post(f"{BASE}/auth/login",
                           json={"username": uname, "password": "guardpw123"})
        assert r3.status_code == 200

    def test_create_user_duplicate_username_400(self, admin_token):
        assert TestUsersManagement.created_uid, "previous test must run first"
        # find the username we just created
        users = requests.get(f"{BASE}/users", headers=h(admin_token)).json()
        existing = next(u for u in users if u["id"] == TestUsersManagement.created_uid)
        body = {"name": "Dup", "username": existing["username"],
                "password": "anypw123", "role": "guard"}
        r = requests.post(f"{BASE}/users", json=body, headers=h(admin_token))
        assert r.status_code == 400

    def test_update_user_name_password_role(self, admin_token):
        uid = TestUsersManagement.created_uid
        assert uid

        # update name
        r = requests.put(f"{BASE}/users/{uid}",
                         json={"name": "TEST Renamed"}, headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["name"] == "TEST Renamed"

        # update password (then test login works with new password)
        users = requests.get(f"{BASE}/users", headers=h(admin_token)).json()
        uname = next(u for u in users if u["id"] == uid)["username"]
        r = requests.put(f"{BASE}/users/{uid}",
                         json={"password": "updatedpw456"}, headers=h(admin_token))
        assert r.status_code == 200
        rlog = requests.post(f"{BASE}/auth/login",
                             json={"username": uname, "password": "updatedpw456"})
        assert rlog.status_code == 200

        # update password too short
        r = requests.put(f"{BASE}/users/{uid}",
                         json={"password": "abc"}, headers=h(admin_token))
        assert r.status_code == 400

        # update role
        r = requests.put(f"{BASE}/users/{uid}",
                         json={"role": "admin"}, headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

        # invalid role
        r = requests.put(f"{BASE}/users/{uid}",
                         json={"role": "wizard"}, headers=h(admin_token))
        assert r.status_code == 400

    def test_delete_self_400(self, admin_token, admin_user):
        r = requests.delete(f"{BASE}/users/{admin_user['id']}", headers=h(admin_token))
        assert r.status_code == 400

    def test_delete_other_user_ok(self, admin_token):
        uid = TestUsersManagement.created_uid
        assert uid
        r = requests.delete(f"{BASE}/users/{uid}", headers=h(admin_token))
        assert r.status_code == 200
        # GET users should not include it
        users = requests.get(f"{BASE}/users", headers=h(admin_token)).json()
        assert not any(u["id"] == uid for u in users)
        # second delete -> 404
        r = requests.delete(f"{BASE}/users/{uid}", headers=h(admin_token))
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Regression: guard cannot reach admin-only endpoints (sanity)
# ---------------------------------------------------------------------------

class TestRegressionGuards:
    def test_guard_cannot_create_user(self, guard_token):
        r = requests.post(f"{BASE}/users",
                          json={"name": "x", "username": "x", "password": "abcdef", "role": "guard"},
                          headers=h(guard_token))
        assert r.status_code == 403

    def test_guard_cannot_delete_user(self, guard_token, admin_token):
        # try delete admin (we know its id from /auth/me with admin)
        me = requests.get(f"{BASE}/auth/me", headers=h(admin_token)).json()
        r = requests.delete(f"{BASE}/users/{me['id']}", headers=h(guard_token))
        assert r.status_code == 403
