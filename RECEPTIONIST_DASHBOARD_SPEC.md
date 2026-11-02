# DEVELOPMENT SPECIFICATION: RECEPTIONIST DASHBOARD

**Hotel, Lodge & Restaurant Management System**  
**Product:** Hotel & Lodge Management System  
**Department:** Front Office / Reception  
**Prepared for:** Antigravity AI / Software Development Team  
**Design Standard:** Professional, Human-Centered, Responsive, Production-Ready

---

## 1. PROJECT OBJECTIVE

Develop a professional Receptionist Dashboard that enables hotel and lodge receptionists to manage guest arrivals, room reservations, check-ins, check-outs, guest records, payments, and customer communication from one centralized interface.

The dashboard must be designed for real operational use, not merely as a visual prototype.
The receptionist should be able to complete common tasks quickly, minimize errors, and access only the information and functions permitted by their assigned role.

---

## 2. RECEPTIONIST DASHBOARD OVERVIEW

The dashboard home page must display the following operational summary cards:

- **Arrivals Today** — guests expected to check in today.
- **Departures Today** — guests expected to check out today.
- **Currently Checked In** — guests currently staying at the property.
- **Available Rooms** — rooms ready for occupation.
- **Occupied Rooms** — rooms currently assigned to guests.
- **Pending Reservations** — reservations awaiting confirmation.
- **Pending Payments** — outstanding balances requiring follow-up.
- **Room Cleaning Status** — rooms awaiting cleaning or inspection.

Every card must display real database information and provide a link to its corresponding detailed page.
Do not use hardcoded statistics in production.

---

## 3. SIDEBAR NAVIGATION

Create a clear, compact sidebar with these menu items:

- Dashboard
- Reservations & Bookings
- Guest Registration
- Check-In
- Current Guests
- Room Availability
- Room Status
- Check-Out
- Payments & Receipts
- Guest Communication
- Guest History
- Notifications
- My Profile
- Help & Support

Only display modules and actions that the logged-in receptionist is authorized to access.

---

## 4. GUEST REGISTRATION MODULE

Create a guest registration form with the following fields:

- Full name
- Phone number with country code
- Email address (optional)
- Nationality
- Identification document type
- Identification document number, where legally required
- Residential address (optional)
- Booking reference, if applicable
- Check-in date and expected check-out date
- Number of guests
- Room type and assigned room
- Special requests or accessibility requirements
- Emergency contact, where appropriate

**Functional requirements:**

- Validate required fields before saving.
- Detect possible duplicate guest records.
- Allow the receptionist to search for an existing guest before creating a new record.
- Generate a unique guest or registration reference.
- Record who created or updated the registration and when.
- Protect personal and identification information from unauthorized access.
- Follow applicable Tanzanian privacy and guest-registration requirements.

---

## 5. RESERVATION MANAGEMENT

The receptionist must be able to:

- Create a new reservation.
- Search reservations by guest name, phone number, booking reference, or date.
- View room availability before confirming a reservation.
- Select arrival and departure dates.
- Select room type and available room.
- Record the number of adults and children.
- Apply authorized rates, discounts, or promotional offers.
- Record the booking source, such as walk-in, phone, website, or online travel agency.
- Confirm, modify, cancel, or mark reservations as no-show according to permissions and policy.
- View reservation history and payment status.

Prevent double-booking through server-side availability validation and appropriate database transactions.

---

## 6. CHECK-IN WORKFLOW

Create a guided check-in process.

**Step 1:** Find an existing reservation or select walk-in registration.  
**Step 2:** Verify guest details and complete any required registration fields.  
**Step 3:** Confirm the room is available, clean, and ready for occupation.  
**Step 4:** Confirm the applicable room rate, stay dates, deposit, and payment arrangements.  
**Step 5:** Record the payment or deposit if received.  
**Step 6:** Confirm check-in and update the room and reservation status.  
**Step 7:** Generate a confirmation receipt or registration document where applicable.  
**Step 8:** Offer to send the guest a welcome message by SMS or WhatsApp, subject to consent and configured communication settings.

The system must not mark a guest as checked in until the necessary validation steps have passed.

---

## 7. CURRENT GUESTS

Provide a searchable table showing:

- Guest name
- Room number
- Check-in date
- Expected check-out date
- Number of nights
- Booking reference
- Payment status
- Outstanding balance
- Guest status
- Available actions

Actions may include viewing guest details, extending a stay, changing rooms, recording an authorized payment, and initiating check-out.
Any room change or stay extension must trigger availability and pricing validation.

---

## 8. CHECK-OUT MANAGEMENT

The check-out interface must:

- Display the guest's accommodation charges.
- Include approved restaurant or other service charges posted to the guest's account.
- Show deposits, payments, discounts, and outstanding balances.
- Calculate the final bill accurately.
- Allow authorized payment collection or settlement.
- Generate a final invoice and receipt.
- Record the check-out date and time.
- Update the room status to "Needs Cleaning" or the equivalent configured status.
- Notify housekeeping of the room's new status.
- Preserve the guest's stay and billing history.

Do not automatically mark a room as available and ready when it still requires cleaning or inspection.

---

## 9. PAYMENTS AND RECEIPTS

Support configurable payment methods, including:

- Cash
- Bank transfer
- Card payment, if supported
- Mobile money, such as M-Pesa, Airtel Money, and Tigo Pesa/Yas
- Integrated online payment gateways, where configured

**Functional requirements:**

- Record transaction reference, amount, date, payment method, and responsible user.
- Support partial payments and deposits.
- Calculate outstanding balances correctly.
- Generate sequential receipt numbers using a configurable numbering policy.
- Prevent duplicate payment recording.
- Integrate with payment providers through verified server-side callbacks and transaction reconciliation.
- Require authorization for refunds, voids, and corrections.
- Maintain an audit trail of financial changes.

Never mark an online payment as successful merely because the guest clicked a payment button.

---

## 10. SMS AND WHATSAPP COMMUNICATION

Create a guest communication module that can integrate with an SMS provider or WhatsApp Business API.

Supported message events should include:

- Reservation confirmation
- Booking reminder
- Welcome message after check-in
- Payment confirmation
- Upcoming check-out reminder
- Thank-you message after check-out

**Example welcome message:**

> "Hello [Guest Name], welcome to [Hotel Name]. We are delighted to host you. Your room is [Room Number]. For assistance, please contact [Hotel Phone Number]. We wish you a pleasant stay."

**Requirements:**

- Use configurable message templates.
- Support the guest's preferred language where available.
- Store message status, recipient, timestamp, and provider reference.
- Track statuses such as queued, sent, delivered, failed, and pending where supported by the provider.
- Retry temporary failures using a controlled retry mechanism.
- Never expose API keys or credentials in frontend code.
- Do not block the check-in workflow if the messaging service is temporarily unavailable.
- Respect guest communication preferences and applicable privacy requirements.

---

## 11. ROOM STATUS MANAGEMENT

Each room must have a clear operational status, such as:

- Available and Ready
- Reserved
- Occupied
- Needs Cleaning
- Cleaning in Progress
- Inspection Required
- Out of Service

Use readable text labels with restrained status colors.
The receptionist must see which rooms are ready for assignment without needing to contact housekeeping manually.
Room maintenance or out-of-service restrictions must prevent assignment until the room is appropriately released.

---

## 12. NOTIFICATIONS

Provide an in-app notification center for operational events, including:

- New reservation received
- Guest arrival approaching
- Guest has arrived
- Check-out overdue
- Payment recorded or payment failure reported
- Guest balance outstanding
- Room not ready
- Room marked out of service
- Guest request requiring attention

Notifications must be based on actual system events and permissions.
Allow users to mark notifications as read and navigate to the related record.
Do not send every internal event to every employee. Route notifications to the appropriate roles.

---

## 13. SEARCH, FILTERS, AND DATA TABLES

Provide a global or module-specific search experience.
Users should be able to search by guest name, phone number, room number, booking reference, and relevant dates.
Provide filters for reservation status, payment status, room status, and arrival/departure dates.
Tables must support pagination, clear empty states, useful loading states, and understandable error messages.
Include a confirmation step for destructive or financially sensitive actions.

---

## 14. USER INTERFACE AND USER EXPERIENCE

Design a modern, human-centered, professional hospitality interface.

**Visual design principles:**

- Use a restrained palette: deep navy or dark blue for primary navigation, white surfaces, light neutral backgrounds, and a subtle accent color.
- Avoid excessive gradients, bright colors, decorative effects, and unnecessary animations.
- Use a consistent typography system with readable font sizes and clear visual hierarchy.
- Use simple icons only when they improve understanding; pair unfamiliar icons with text labels.
- Use subtle borders, modest shadows, and consistent spacing.
- Ensure adequate contrast and visible keyboard focus.
- Avoid overcrowded dashboards and unnecessarily wide forms.
- Use familiar terms such as "Check In," "Check Out," "New Reservation," and "Record Payment."
- Use clear confirmation messages after successful actions and actionable error messages when something fails.

**Layout:**

- **Desktop:** Compact sidebar, top navigation, page title, primary action, summary cards, and operational tables.
- **Tablet:** Responsive navigation and appropriately sized touch targets.
- **Mobile:** Stacked cards, mobile-friendly forms, simplified tables, and easy access to primary actions.

**Human-centered behavior:**

- Keep common tasks short and predictable.
- Preserve entered form data after recoverable validation errors.
- Warn users before losing unsaved changes.
- Avoid unnecessary pop-ups.
- Show progress during long-running operations.
- Provide clear empty states, such as "No arrivals scheduled for today."
- Use local date/time conventions and configure the property timezone, with Africa/Dar_es_Salaam as the initial timezone for a Tanzanian property.
- Support Tanzanian shilling (TZS) and configurable tax and service-charge rules.

---

## 15. SECURITY AND ROLE-BASED ACCESS CONTROL

The receptionist role must have only the permissions needed for front-office operations.

**Typical permissions may include:**

- Register and update guest details.
- Create and manage reservations.
- Perform check-in and check-out.
- View permitted room information.
- Record payments within assigned limits.
- Generate guest receipts.
- Send authorized guest communications.

**Restrict access to:**

- Owner-only financial summaries and profit reports.
- Payroll and confidential staff records.
- System-wide settings and integrations.
- Unauthorized discounts, refunds, payment reversals, and deletions.
- Other properties' guest and financial records.

Enforce permissions on the backend, not only by hiding frontend buttons.
Record important actions in an audit log. Apply secure authentication, session management, input validation, and protection against common web vulnerabilities.

---

## 16. TECHNICAL AND DATABASE REQUIREMENTS

Integrate with the existing project architecture rather than introducing an unrelated stack without approval.

If the project uses Laravel, implement appropriate models, migrations, controllers or service classes, policies, validation requests, events, notifications, and automated tests.

Potential entities include:

- Users
- Roles and Permissions
- Properties
- Guests
- Reservations
- Rooms
- Room Types
- Stays
- Payments
- Invoices
- Receipts
- Guest Requests
- Message Logs
- Notifications
- Audit Logs

Maintain relationships between reservations, guests, rooms, stays, invoices, and payments.
For multi-property or SaaS operation, enforce property-level data isolation on every relevant backend query and action.
Use database transactions for critical operations such as room assignment, check-in, payment recording, and check-out.

---

## 17. ACCEPTANCE CRITERIA

The receptionist dashboard is ready for acceptance only when:

- A receptionist can register a guest and retrieve that guest later.
- A reservation can be created without double-booking a room.
- A valid check-in updates the reservation, stay, and room status correctly.
- A guest's accommodation charges and outstanding balance are calculated correctly.
- Payments and receipts are recorded with appropriate audit information.
- Check-out generates the correct final bill and updates housekeeping status.
- SMS or WhatsApp messages can be queued and their delivery status tracked when a provider is configured.
- Dashboard cards and tables display actual database records.
- Unauthorized users cannot access restricted functions by directly calling backend endpoints.
- The interface works on desktop, tablet, and mobile devices.
- Automated tests cover the critical reservation, check-in, payment, and check-out workflows.
- Failures in external messaging or payment services are handled safely without corrupting guest or financial records.

---

## 18. DEVELOPMENT INSTRUCTIONS

Before implementation:

- Inspect the existing repository, framework, database, authentication, and UI components.
- Identify existing modules that can be reused.
- Prepare the receptionist workflow and screen structure.
- Implement the frontend and backend together.
- Use real API endpoints and database records.
- Add validation, permissions, error handling, and automated tests.
- Test the full workflow using realistic sample data.
- Document environment variables and provider setup without committing secrets.

**Final instruction:** Build a functional, secure, maintainable Receptionist Dashboard suitable for real hotel and lodge operations. Prioritize operational accuracy, usability, accessibility, and professional design over decorative visuals. Do not stop at mockups or static screens.

---

## JINSI RECEPTIONIST ATAKAVYOTUMIA MFUMO

### 1. Reservation
Anatafuta booking iliyopo au anatengeneza booking mpya na kuthibitisha upatikanaji wa chumba.

### 2. Guest Registration & Check-In
Anathibitisha taarifa za mgeni, chumba, tarehe na malipo yanayotakiwa.

### 3. Notifications
Mfumo unatuma ujumbe wa kumkaribisha mgeni na kurekodi hali ya ujumbe. Mmiliki anapata taarifa kulingana na notification settings.

### 4. Billing & Check-Out
Anahakiki gharama, anarekodi malipo, anatoa risiti na kupeleka chumba kwenye hatua ya usafi.

---

## PENDEKEZO LA USALAMA

**Usimpe receptionist mamlaka sawa na mmiliki.** 

- **Mmiliki** ndiye awe na uwezo wa kuona ripoti za faida, matumizi, mapato ya jumla na utendaji wa biashara.
- **Receptionist** awe na dashboard inayomsaidia kuhudumia wageni kwa haraka na usahihi, bila kupata mamlaka ya kuona ripoti za kifedha za juu.

---

**Document Prepared:** October 29, 2026  
**Product Owner:** Haula Technologies  
**Target Implementation:** Professional Receptionist Dashboard
