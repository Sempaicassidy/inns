# PRODUCT REQUIREMENTS

**Project:** THE INNS — Hotel, Lodge & Restaurant Management SaaS  
**Version:** 1.0  
**Date:** 2026-10-29  
**Product Owner:** Haula Enterprises

---

## 1. PRODUCT OVERVIEW

THE INNS is a comprehensive hospitality management SaaS platform designed for hotels, lodges, restaurants, bars, conference centers, spas, laundry services, and travel operators in Tanzania.

**Primary Users:**
- Hotel and lodge owners
- General managers
- Receptionists
- Accountants/cashiers
- Housekeeping staff
- Restaurant managers, waiters, and chefs
- Storekeepers and procurement managers
- Platform administrators

**Primary Goal:**
Provide a unified, professional, and operationally reliable system that enables hospitality businesses to manage guests, reservations, rooms, restaurant operations, payments, inventory, staff, and reporting from a single integrated platform.

---

## 2. CORE FUNCTIONAL REQUIREMENTS

### 2.1 Multi-Tenant SaaS Architecture

**FR-1:** The system must support multiple independent tenants (organizations) who cannot access each other's data.

**FR-2:** Each tenant may manage multiple properties (hotels, lodges, restaurants).

**FR-3:** Tenant registration must include business profile, contact information, and initial property setup.

**FR-4:** Subscription plans must define feature entitlements, property limits, and user limits.

**FR-5:** Tenant suspension must prevent access while preserving data.

### 2.2 Authentication & Authorization

**FR-6:** Users must authenticate with email and password (MFA optional Phase 2).

**FR-7:** Password reset must use secure tokens with expiration.

**FR-8:** Email verification must be required for new user registration.

**FR-9:** Role-based access control (RBAC) must enforce permissions server-side.

**FR-10:** Default roles: SaaS Super Admin, Business Owner, General Manager, Receptionist, Accountant/Cashier, Housekeeping, Waiter, Chef, Storekeeper, Procurement Manager.

**FR-11:** Custom roles must be creatable by authorized administrators.

**FR-12:** Granular permissions must exist for every action (e.g., `reservation.check_in`, `payment.refund`).

**FR-13:** Audit logs must record all sensitive actions with user, timestamp, and changes.

### 2.3 Hotel & Lodge Management

**FR-14:** Room types must include name, base rate, capacity, and description.

**FR-15:** Rooms must include room number, floor, type, and operational status.

**FR-16:** Room statuses must separate occupancy (vacant/occupied), housekeeping (dirty/clean/inspected), and maintenance (operational/blocked).

**FR-17:** Rate plans must support seasonal pricing, corporate rates, and packages.

**FR-18:** Availability search must return available rooms for given dates and room type.

**FR-19:** Reservations must include guest details, dates, room type, adults, children, source, and status.

**FR-20:** Booking references must be unique per property (e.g., TI-2026-000123).

**FR-21:** Guest registration must include name, phone, email, nationality, ID type, ID number, and address.

**FR-22:** Duplicate guest detection must warn on phone/email match and block on ID match.

**FR-23:** Walk-in bookings must be supported without prior reservation.

**FR-24:** Reservation modifications must not conflict with existing bookings.

**FR-25:** Cancellations must record reason and update room availability.

**FR-26:** No-show reservations must be marked with reason.

**FR-27:** Deposits and partial payments must be recorded and allocated.

**FR-28:** Check-in must verify room availability, guest details, and payment arrangements.

**FR-29:** Check-in must create a stay record and open a guest folio.

**FR-30:** Check-in must update room status to occupied.

**FR-31:** Check-out must calculate final bill, collect payment, and generate receipt.

**FR-32:** Check-out must update room status to "needs cleaning" and notify housekeeping.

**FR-33:** Room changes must verify availability and update rates.

**FR-34:** Stay extensions must verify availability and update folio.

**FR-35:** Guest folios must list accommodation charges, restaurant charges, and other services.

**FR-36:** Folio lines must be immutable; corrections must use reversal lines.

**FR-37:** Folio balance must be calculated as charges minus payments.

**FR-38:** Housekeeping tasks must be assignable to staff with status tracking.

**FR-39:** Room inspections must be recorded by authorized staff.

**FR-40:** Maintenance blocks must prevent room assignment during specified dates.

**FR-41:** Guest requests must be trackable and assignable.

**FR-42:** Booking sources must be recorded (walk-in, phone, website, OTA, etc.).

**FR-43:** Double-booking must be prevented through server-side concurrency control.

### 2.4 Restaurant POS

**FR-44:** Menu categories must be customizable and sortable.

**FR-45:** Menu items must include name, price, cost, tax rate, and active status.

**FR-46:** Menu variants/modifiers must support price deltas.

**FR-47:** Tables must include area, number, capacity, and status.

**FR-48:** Order types must support dine-in, takeaway, and room service.

**FR-49:** Room service orders must link to guest folios for billing.

**FR-50:** Waiters must be able to create, modify, and cancel orders.

**FR-51:** Kitchen display must show new, preparing, and ready orders in real-time.

**FR-52:** Kitchen display must be legible from a distance (font ≥ 24px).

**FR-53:** Kitchen display must use icons + text, not color alone.

**FR-54:** Orders must support bill splitting and consolidation.

**FR-55:** Discounts must require approval if above configured limit.

**FR-56:** Restaurant payments must support cash, card, mobile money, and room charging.

**FR-57:** Menu price history must track all price changes with timestamp and user.

**FR-58:** Recipes must define ingredient quantities for menu items.

**FR-59:** Recipe-based consumption must deduct stock when order is served.

**FR-60:** Stock consumption must be idempotent to prevent duplicate deductions.

### 2.5 Finance

**FR-61:** Invoices must include sequential numbering, customer details, and line items.

**FR-62:** Invoice lines must include description, quantity, unit price, tax, and total.

**FR-63:** Payments must record method, amount, reference, status, and receiver.

**FR-64:** Payment allocation must link to invoices, folios, or orders.

**FR-65:** Partial payments must be supported.

**FR-66:** Deposits must be refundable with approval.

**FR-67:** Refunds must require approval (≤ TZS 500,000 by accountant, > by GM/Owner).

**FR-68:** Refunds must record approver and reason in audit log.

**FR-69:** Expense submissions must include category, amount, receipt, and date.

**FR-70:** Expense approval must require approver ≠ submitter.

**FR-71:** Tax calculations must be based on configurable rates per property.

**FR-72:** Service charges must be configurable and applied to accommodation and restaurant.

**FR-73:** Cashier shifts must track opening float, closing float, and variance.

**FR-74:** Payment reconciliation must match recorded payments with bank statements.

**FR-75:** Outstanding balances must be calculated from unpaid invoices and folios.

**FR-76:** Revenue reports must show total revenue by period and source.

**FR-77:** Collection reports must show payments received by method and period.

**FR-78:** Financial audit trail must be append-only and 7-year retention.

**FR-79:** Monetary values must use DECIMAL(15,2), never FLOAT.

**FR-80:** Financial records must never be soft-deleted.

### 2.6 Inventory & Procurement

**FR-81:** Inventory items must include name, SKU, unit, category, reorder level, and cost method.

**FR-82:** Suppliers must include contact information and payment terms.

**FR-83:** Storage locations must define where stock is held.

**FR-84:** Opening stock must be recorded with quantity and value.

**FR-85:** Purchase requests must be created by staff and approved by managers.

**FR-86:** Purchase orders must be sent to suppliers with expected delivery.

**FR-87:** Goods receiving must record actual quantities received and unit costs.

**FR-88:** Stock transfers must move items between locations with approval.

**FR-89:** Stock adjustments must require approval and record reason.

**FR-90:** Stock movements must be append-only (opening, purchase, consumption, adjustment, wastage, transfer).

**FR-91:** Stock levels must be derived from movement ledger.

**FR-92:** Recipe consumption must create stock movement records when orders are served.

**FR-93:** Low-stock alerts must notify staff when quantity drops below reorder level.

**FR-94:** Wastage must be recorded with reason and quantity.

**FR-95:** Stock valuation must use FIFO (Phase 1) or configurable method.

**FR-96:** Inventory reports must show current stock, movements, and valuation.

### 2.7 Staff & Permissions

**FR-97:** Staff profiles must include name, email, phone, department, property, and role.

**FR-98:** Staff invitations must send email with registration link.

**FR-99:** Department configuration must define operational units.

**FR-100:** Property assignments must restrict staff to authorized locations.

**FR-101:** Account status must enable/disable staff access.

**FR-102:** Role management must allow creation and modification of custom roles.

**FR-103:** Permission assignment must control access to every system function.

**FR-104:** Permission checks must be enforced server-side on every action.

**FR-105:** Approval limits must be configurable (e.g., refund limit, expense limit).

**FR-106:** Separation of duties must prevent self-approval (expenses, role changes).

### 2.8 Messaging & Notifications

**FR-107:** In-app notifications must be stored in database with read status.

**FR-108:** Email notifications must use configurable templates with variable substitution.

**FR-109:** SMS notifications must support configurable provider (Beem, Africa's Talking).

**FR-110:** WhatsApp notifications must use Meta Cloud API with templates.

**FR-111:** Notification events must include reservation confirmation, booking reminder, welcome message, payment confirmation, check-out reminder.

**FR-112:** Operational alerts must include new booking, guest arrival, check-out overdue, payment failure, room not ready.

**FR-113:** Message delivery status must track queued, sent, delivered, failed.

**FR-114:** Failed messages must retry with exponential backoff (3 attempts).

**FR-115:** Messaging failures must not corrupt reservations or payments.

**FR-116:** Message credentials must never be exposed in frontend code.

### 2.9 Payment Gateway Integration

**FR-117:** Payment gateway must support M-Pesa, Airtel Money, and Tigo Pesa.

**FR-118:** Payment initiation must redirect to provider payment page or use API.

**FR-119:** Server-side verification must confirm payment status via API or webhook.

**FR-120:** Webhooks must verify signatures to prevent fraud.

**FR-121:** Duplicate webhook events must be rejected via idempotency keys.

**FR-122:** Payment refunds must be initiated via API when supported.

**FR-123:** Payment reconciliation must match provider records with system records.

**FR-124:** Payment failures must be logged and notified to staff.

**FR-125:** Payment gateway must not be claimed live until credentials are configured and verified.

### 2.10 Reports & Analytics

**FR-126:** Revenue reports must show total revenue by period, source, and property.

**FR-127:** Occupancy reports must show occupancy rate, available rooms, and trends.

**FR-128:** Arrival/departure reports must show expected guests for given dates.

**FR-129:** Reservation reports must show bookings by status, source, and period.

**FR-130:** Outstanding balance reports must show unpaid invoices and folios.

**FR-131:** Restaurant sales reports must show sales by category, item, and period.

**FR-132:** Inventory reports must show stock levels, movements, and valuation.

**FR-133:** Procurement reports must show purchase orders, costs, and supplier performance.

**FR-134:** Expense reports must show spending by category and period.

**FR-135:** Cashier reconciliation reports must match expected vs actual cash.

**FR-136:** Branch comparison reports must compare performance across properties.

**FR-137:** Reports must support date range filters and property filters.

**FR-138:** Reports must export to CSV and PDF where appropriate.

**FR-139:** Report exports must require the same permissions as viewing the data.

**FR-140:** Reports must never show fabricated or hardcoded numbers.

---

## 3. NON-FUNCTIONAL REQUIREMENTS

### 3.1 Performance

**NFR-1:** Dashboard must load within 3 seconds on 3G connection.

**NFR-2:** Database queries must use appropriate indexes to avoid full table scans.

**NFR-3:** Large reports must use pagination and server-side processing.

**NFR-4:** Background jobs must not block the main application.

**NFR-5:** API responses must be under 500ms for critical operations.

### 3.2 Security

**NFR-6:** All pages must use HTTPS in production.

**NFR-7:** Passwords must be hashed using bcrypt or argon2.

**NFR-8:** Session cookies must be secure and HTTP-only.

**NFR-9:** CSRF protection must be enabled on all forms.

**NFR-10:** SQL injection must be prevented via parameterized queries.

**NFR-11:** XSS must be prevented via output escaping.

**NFR-12:** File uploads must validate type, size, and scan for malware.

**NFR-13:** Rate limiting must apply to login (5/min) and API (60/min).

**NFR-14:** Secrets must never be committed to version control.

**NFR-15:** Audit logs must not record passwords or tokens.

### 3.3 Reliability

**NFR-16:** Database must be backed up daily with 30-day retention.

**NFR-17:** Backup restoration must be tested monthly.

**NFR-18:** Failed background jobs must be logged and retried.

**NFR-19:** Webhook failures must not corrupt data.

**NFR-20:** Application errors must be logged and monitored (Sentry).

**NFR-21:** System uptime must be ≥ 99.5% (excluding planned maintenance).

### 3.4 Usability

**NFR-22:** UI must be responsive on 360px, 390px, 768px, 1024px, 1280px, 1440px.

**NFR-23:** UI must achieve WCAG 2.2 AA accessibility.

**NFR-24:** Keyboard navigation must work for all interactive elements.

**NFR-25:** Focus indicators must be clearly visible.

**NFR-26:** Color contrast must be ≥ 4.5:1 for text.

**NFR-27:** Forms must provide clear validation errors and helper text.

**NFR-28:** Loading states must indicate progress during long operations.

**NFR-29:** Empty states must provide helpful guidance.

**NFR-30:** Error messages must be actionable and user-friendly.

### 3.5 Scalability

**NFR-31:** Architecture must support horizontal scaling via load balancers (Phase 2).

**NFR-32:** Database must support read replicas for reporting (Phase 2).

**NFR-33:** Static assets must be served via CDN (Phase 2).

**NFR-34:** Queue workers must be horizontally scalable.

### 3.6 Compliance

**NFR-35:** System must comply with Tanzania PDPA 2022.

**NFR-36:** Guest PII must be retained for 7 years (financial) or 2 years (profile).

**NFR-37:** Audit logs must be retained for 7 years.

**NFR-38:** Data at rest must be encrypted (Phase 2).

**NFR-39:** Fiscalization (EFD/TRA) integration planned for Phase 2.

**NFR-40:** PCI-DSS compliance planned for Phase 2 (hosted payment gateway).

---

## 4. USER STORIES

### 4.1 Owner Stories

**US-1:** As a business owner, I want to see daily revenue and occupancy on my dashboard so I can monitor business performance.

**US-2:** As a business owner, I want to view outstanding balances so I can follow up on payments.

**US-3:** As a business owner, I want to compare performance across branches so I can identify underperforming locations.

**US-4:** As a business owner, I want to approve large refunds so I can control financial risk.

**US-5:** As a business owner, I want to receive daily sales summary by email so I can stay informed.

### 4.2 Receptionist Stories

**US-6:** As a receptionist, I want to quickly search for existing guests so I can avoid duplicate records.

**US-7:** As a receptionist, I want to see room availability in real-time so I can avoid double-booking.

**US-8:** As a receptionist, I want a guided check-in process so I don't miss required steps.

**US-9:** As a receptionist, I want to send welcome messages via WhatsApp so guests feel welcomed.

**US-10:** As a receptionist, I want to record payments so guest folios are accurate.

### 4.3 Chef Stories

**US-11:** As a chef, I want to see orders grouped by status so I can prioritize preparation.

**US-12:** As a chef, I want to mark orders as ready so waiters know when to serve.

**US-13:** As a chef, I want to see order notes so I can accommodate special requests.

### 4.4 Accountant Stories

**US-14:** As an accountant, I want to verify payments against bank statements so I can reconcile accounts.

**US-15:** As an accountant, I want to approve expense submissions so I can control spending.

**US-16:** As an accountant, I want to view financial reports so I can provide insights to management.

### 4.5 Housekeeper Stories

**US-17:** As a housekeeper, I want to see rooms that need cleaning so I can prioritize my work.

**US-18:** As a housekeeper, I want to mark rooms as clean after inspection so receptionists can assign them.

**US-19:** As a housekeeper, I want to report maintenance issues so they get fixed.

---

## 5. ACCEPTANCE CRITERIA

### 5.1 Functional Acceptance

- All P0 requirements are implemented and tested.
- All critical workflows (reservation, check-in, check-out, payment) pass end-to-end tests.
- Tenant isolation is verified with automated tests.
- Permissions are enforced server-side with coverage tests.
- Financial calculations are accurate and verified.
- Inventory movements are immutable and reconciled.
- Notifications are delivered (email) or tracked (SMS/WhatsApp) with failure handling.

### 5.2 UI/UX Acceptance

- UI is consistent across all modules with defined design system.
- Responsive behavior is verified at all required breakpoints.
- Accessibility is verified to WCAG 2.2 AA.
- No critical visual defects remain after inspection.
- Forms provide clear validation and error messages.
- Empty states are helpful and guide users to next actions.

### 5.3 Security Acceptance

- No critical or high-severity security vulnerabilities remain.
- Tenant isolation is verified with automated penetration tests.
- Authentication and authorization are tested.
- Audit logs are complete and reviewable.
- Secrets are properly managed and not exposed.

### 5.4 Performance Acceptance

- Dashboard loads within 3 seconds on 3G.
- Critical API responses are under 500ms.
- Database queries are optimized with appropriate indexes.
- Background jobs do not block the main application.

### 5.5 Reliability Acceptance

- System uptime ≥ 99.5% (excluding planned maintenance).
- Backup restoration is tested and documented.
- Error monitoring is configured and alerts are active.
- Failed jobs are retried and logged.

---

## 6. CONSTRAINTS & ASSUMPTIONS

### 6.1 Constraints

- **Budget:** Limited for Phase 1; prioritized free or low-cost integrations.
- **Timeline:** MVP demo target 2026-10-30; full UAT TBD.
- **Resources:** Small team; must balance speed with quality.
- **Infrastructure:** VPS with 2 vCPU, 4GB RAM for MVP.
- **Compliance:** Must adhere to Tanzania PDPA 2022.

### 6.2 Assumptions

- Users have internet access for cloud-based system.
- Properties have basic computer equipment for reception and restaurant.
- Payment gateway providers are available in Tanzania (M-Pesa, Airtel, Tigo).
- SMS/WhatsApp providers have APIs suitable for integration.
- Staff have basic computer literacy for system use.

---

## 7. OUT OF SCOPE (Phase 2+)

- Mobile native apps (iOS/Android)
- OTA channel manager integration
- Dynamic pricing algorithms
- Loyalty program management
- Event management module
- Full accounting system (trial balance, balance sheet, P&L)
- Integration with QuickBooks/Xero
- Advanced analytics and forecasting
- Multi-currency support
- Fiscalization (EFD/TRA) integration
- Video conferencing integration
- Guest self-service portal

---

**Document Owner:** Haula Enterprises  
**Last Updated:** 2026-10-29  
**Next Review:** After Stage 1 completion
