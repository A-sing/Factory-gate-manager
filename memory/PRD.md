# DBS Factory — Gate Management System (PRD)

## Overview
A production-ready factory gate management mobile app for security guards and admins. Built with Expo React Native + FastAPI + MongoDB. JWT auth. Photos as base64. QR codes for labour.

## Roles
- **Guard**: Visitor entry, Labour entry (new registration, search, scan QR, check-in/check-out, currently inside)
- **Admin**: Dashboard KPIs, Visitor reports, Labour reports, Contractor management (CRUD), Live occupancy / emergency roll call

## Modules
### Visitor Management
- One-time records: name (req), mobile, purpose (req), photo (camera), gate, auto datetime
- Filter/search by name, mobile, purpose, date range

### Labour Management
- Register once with auto Labour ID (LAB-NNNNNN) + QR code
- Repeat entry via search (ID / Name / Aadhaar) OR QR scan
- Check-in / Check-out with auto datetime + total worked hours
- Categories: Welder, Fitter, Electrician, Helper, Carpenter, Painter, Other

### Contractor Master
- Name, contact, mobile, address
- Per-contractor labour count + today's attendance

### Admin Dashboard
- Visitors Today, Labour Inside, Checked Out Today, Total Labour, Contractor Count
- Live "currently inside" emergency roll call list

## Tech
- **Frontend**: Expo SDK 54, expo-router, expo-camera, react-native-qrcode-svg, react-native-keyboard-controller, lucide-react-native
- **Backend**: FastAPI + Motor (MongoDB async), JWT (HS256), bcrypt via passlib
- **Storage**: All photos base64 in MongoDB (no external storage)

## Default Accounts (auto-seeded)
- admin / admin123 (role: admin)
- guard / guard123 (role: guard)

## Sample Data
- Two contractors pre-seeded: Apex Engineering, Sunrise Constructions

## Current request: Firestore connection (pending credentials)
- User supplied Firebase project ID: `gate-manager-693fc`.
- User confirms Firestore has been created. Remote access has not been verified.
- Final explicit scope: connect Firestore first; Firebase Storage is not needed now.
- Preserve existing Admin/Guard usernames, passwords, role flows, records, reports, and the light green/yellow interface with black text.
- Do not enable Firebase Authentication or Firebase Storage as part of this request.
- Backend currently still uses MongoDB; no Firestore code or data migration has been applied.
- Configuration check found no Firebase Admin service-account secret, Google application credentials, or local Google ADC credentials.
- Firebase Admin credentials must be configured server-side and excluded from source control. A project ID alone cannot authorize database access.
- Existing photo data remains untouched pending an explicit migration strategy; do not move image payloads into Firestore as a substitute for object storage.

### Priorities
- P0: Obtain Firebase Admin backend credentials and verify access to the intended Firestore database before implementation.
- P0: Implement Firestore record persistence, preserve current authentication behavior, migrate records without deleting source data, and validate Admin/Guard/report flows against the real database.
- P1: Native-device QR/camera verification after database integration.
- P2: Firebase photo storage and optional per-guard performance dashboard are out of the current scope.

## Security audit requested after Firebase setup discussion
- Read-only source/configuration audit completed; see `memory/security_audit.md`.
- Deployed-environment audit remains unverified: no deployed URL/version was supplied and no live login tests were performed.
- Findings: high-risk fixed-password account auto-seeding; medium-risk XLSX formula injection, unbounded photo payloads/responses, and missing token invalidation after password changes.
- Additional hardening: login throttling, fail-closed JWT configuration, constrained CORS, PII minimization, and atomic check-in uniqueness.
- No application code changes or security fixes applied. Remediation requires subsequent implementation and testing-agent verification before claiming fixes.
