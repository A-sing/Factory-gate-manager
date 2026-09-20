# Security audit — source/configuration only

## Request and scope
- User explicitly requested: "Run the Security Audit on the deployed app."
- Read-only security specialist reviewed the available backend/frontend source and configuration. No application code was changed, no fixes were applied, and no live login or exploit tests were performed.
- No deployed-app URL or deployed commit was supplied. This report does NOT verify the live deployed environment or certify its safety.
- Credentials and secret values are intentionally omitted from this report.

## Findings
1. **SEC-001 — High, deployment-dependent:** `backend/server.py:881-903` automatically seeds fixed-password Admin/Guard accounts if missing. Deleting them permits recreation on restart. If defaults remain active in the deployed environment, unauthorized users could take over an account. Remove fixed-password auto-seeding, rotate any default passwords, and use controlled first-admin provisioning. Actual deployed password state is unverified.
2. **SEC-002 — Medium, source-supported:** `backend/server.py:694-695,772-779,811-820` places untrusted user strings directly into XLSX cells. Formula-prefixed text may become spreadsheet formulas. Force untrusted text to remain literal; external interactions depend on spreadsheet settings. No live export test was run.
3. **SEC-003 — Medium, source-supported:** `backend/server.py:171-210,605-615` accepts unbounded photo/text input and includes full base64 images in large/unpaginated responses. Authenticated requests can consume excessive resources. Add field/body limits and bounded pagination; do not move large photos into Firestore. Upstream request caps were not verified.
4. **SEC-004 — Medium, source-confirmed:** `backend/server.py:262-270,37,75-98` changes password hashes without invalidating existing bearer tokens. Add a checked session/token version and revoke sessions on password changes/resets. Existing role demotion and user deletion already take effect via per-request database lookup. Live behavior remains untested.

## Additional hardening
- Restrict CORS origins where appropriate (`server.py:913-919`).
- Remove the insecure JWT secret fallback and fail closed when configuration is absent (`server.py:35`). No production secret exposure was confirmed.
- Add login throttling (`server.py:242`).
- Reduce unnecessary Aadhaar/mobile/photo exposure and add access logging.
- Enforce atomic check-in/open-attendance uniqueness (`server.py:553-571`).
- Strengthen password requirements.

## Status and next steps
- High-risk default-account behavior needs attention; absence of a proven live exploit is not a security clearance.
- Obtain the actual deployed URL/version before claiming deployment-specific verification.
- Firebase/Firestore is not yet implemented or connected and was not audited remotely.
- No bug has been fixed or verified. If fixes are authorized and applied, the user requires testing-agent verification against the reported issues before any fixed/tested claim.