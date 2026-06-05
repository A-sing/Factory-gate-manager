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
