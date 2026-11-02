# THE INNS — ENGINEERING GUIDE

## Haula Enterprises · Hotel, Lodge & Restaurant Management SaaS
### Complete Build Specification · MVP-First · UAT-Ready

**Document Version:** 1.0  
**Date:** 2026-10-29  
**Owner:** Haula Enterprises  
**Audience:** Engineering Team (Backend, Frontend, QA, DevOps)

---

# SEHEMU 1: MUHTASARI WA MRADI

## 1.1 Taarifa za Msingi

| Kipengele | Thamani |
|---|---|
| Jina la mfumo | The Inns — Hospitality Management SaaS |
| Kampuni | Haula Enterprises |
| Aina | Multi-tenant SaaS (hotel, lodge, restaurant, bar, conference, spa, laundry, travel) |
| Nchi | Tanzania |
| Sarafu kuu | TZS (single-currency Phase 1) |
| Lugha | English (Phase 1), Swahili (Phase 2) |
| Timezone | Africa/Dar_es_Salaam (EAT, UTC+3) |

---

# SEHEMU 2: TECH STACK (CURRENT IMPLEMENTATION)

## 2.1 Stack Kamili (Inns Project)

| Tabaka | Chaguo |
|---|---|
| Backend | **Laravel** (PHP 8.4) |
| Frontend | **Laravel Inertia.js v2 + React + TypeScript** |
| UI components | **Tailwind CSS v3 + Lucide React** |
| Database | **MySQL** |
| Cache/Queue | **Database (Phase 1)** |
| Testing | **PHPUnit** |

---

# SEHEMU 3: ROLES & PERMISSIONS (RBAC)

## 3.1 Default Roles

| # | Role | Scope |
|---|---|---|
| 1 | **General Manager / Owner** | Property |
| 2 | **Receptionist** | Property |
| 3 | **Housekeeper** | Property |
| 4 | **Accountant / Cashier** | Property |
| 5 | **Restaurant Manager** | Property |
| 6 | **Waiter** | Property |
| 7 | **Chef / Kitchen** | Property |
| 8 | **Storekeeper** | Property |

---

# SEHEMU 4: UI/UX REQUIREMENTS

## 4.1 Design Principles

- Professional hospitality, si "admin template"
- Navy/neutral palette (primary: `#1E3A5F`, accent: `#2563EB`)
- Typography: rahisi kusoma
- Spacing: consistent
- Border radius: moderate
- Shadows: subtle
- **Light theme**
- WCAG 2.2 AA

## 4.2 Color Palette

| Purpose | Color |
|---|---|
| Primary brand | Deep navy blue `#1E3A5F` |
| Primary action | Professional blue `#2563EB` |
| Page background | Soft neutral `#F8FAFC` |
| Card background | White `#FFFFFF` |
| Main text | Dark slate `#1E293B` |
| Secondary text | Muted slate `#64748B` |
| Success | `#15803D` |
| Warning | `#B45309` |
| Error | `#B91C1C` |
| Borders | Light slate `#E2E8F0` |

---

# SEHEMU 5: OWNER DASHBOARD REQUIREMENTS

## 5.1 Summary Cards

- Total Revenue
- Occupied Rooms
- Today's Check-ins
- Today's Check-outs
- Active Guests
- Available Rooms
- Pending Bookings
- Outstanding Balance

## 5.2 Revenue Overview

- Room Revenue
- ADR (Average Daily Rate)
- RevPAR
- Revenue chart (7-day/30-day/90-day)

## 5.3 Room Occupancy Overview

- Occupied
- Available (Clean)
- Available (Dirty)
- Maintenance
- Total Rooms

## 5.4 Performance Metrics

- Occupancy Rate with progress bar
- Revenue Target with progress bar
- Guest Satisfaction rating

## 5.5 Notifications

- New Guest Checked In
- Payment Received
- Room Maintenance Required
- New Booking Received

## 5.6 Financial Breakdown

- Revenue Sources (Room Revenue, Restaurant & POS, Other Services)
- Payments & Expenses (Payments Received, Outstanding Balance, Expenses)

---

# SEHEMU 6: RECEPTIONIST DASHBOARD REQUIREMENTS

## 6.1 Summary Cards

- Arrivals Today
- Departures Today
- Currently Checked In
- Available Rooms
- Occupied Rooms
- Pending Reservations
- Pending Payments
- Room Cleaning Status

## 6.2 Quick Actions

- New Reservation
- Guest Search
- Check-in
- Current Guests
- Check-out
- Room Availability
- Record Payment

## 6.3 Guest Registration

- Full name
- Phone number with country code
- Email address (optional)
- Nationality
- Identification document type
- Identification document number
- Residential address (optional)
- Booking reference (if applicable)
- Check-in date and expected check-out date
- Number of guests
- Room type and assigned room
- Special requests

## 6.4 Check-in Workflow

1. Find existing reservation or walk-in
2. Verify guest details
3. Confirm room availability
4. Confirm rate and payment
5. Record payment or deposit
6. Confirm check-in
7. Generate receipt
8. Send welcome message (SMS/WhatsApp - optional)

## 6.5 Check-out Workflow

1. Display accommodation charges
2. Include restaurant/service charges
3. Show deposits, payments, discounts
4. Calculate final bill
5. Collect payment
6. Generate invoice and receipt
7. Record check-out
8. Update room status to "Needs Cleaning"
9. Notify housekeeping

---

# SEHEMU 7: SECURITY

## 7.1 Role Separation

- **Owner**: Full access to financial reports, settings, staff management
- **Receptionist**: Guest management, reservations, check-in/out, payments (limited)
- **Accountant**: Payments, invoices, expenses, financial reports
- **Housekeeper**: Room status, housekeeping tasks
- **Chef/Kitchen**: Order viewing, order status updates

## 7.2 Permission Enforcement

- Backend policies for every action
- Middleware for route protection
- Audit logs for sensitive actions

---

# SEHEMU 8: DATABASE RULES

## 8.1 Monetary Precision

- Always use `DECIMAL` — never `FLOAT`
- Currency: TZS (Phase 1)

## 8.2 Data Integrity

- No double-booking (server-side validation)
- Unique constraints on booking references
- Soft delete for guests, rooms
- Immutable for financial records

---

# SEHEMU 9: TESTING

## 9.1 Critical Workflows

- Reservation + double-booking prevention
- Check-in + folio
- Restaurant order → kitchen → served
- Payment record + verify
- Check-out + housekeeping transition
- Authorization (every role)

---

# SEHEMU 10: MVP SCOPE

## 10.1 Must Have (P0)

- Auth with roles
- Reservations
- Check-in / Check-out
- Folios
- Restaurant POS
- Kitchen Display
- Payments
- Owner Dashboard
- Reception Dashboard
- Reports (basic)

## 10.2 Should Have (P1)

- Housekeeping workflow
- Maintenance blocks
- Guest duplicate detection
- Purchase orders
- Cashier shifts

---

**Document Saved:** October 29, 2026  
**Current Implementation:** Laravel + Inertia.js + React + MySQL
