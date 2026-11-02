# RBAC MATRIX

**Project:** THE INNS — Hotel, Lodge & Restaurant Management SaaS  
**Version:** 1.0  
**Date:** 2026-10-29

---

## DEFAULT ROLES

### 1. SaaS Super Admin

**Scope:** Platform-wide  
**Permissions:** `platform.*`

Can:
- Manage tenants
- Manage subscription plans
- View platform audit logs
- Access platform health monitoring

Cannot:
- Access tenant business data
- Modify tenant financial records

---

### 2. Business Owner

**Scope:** Tenant-wide  
**Permissions:** `tenant.*`, `report.financial.view`, `role.manage`

Can:
- Manage properties
- Manage staff and roles
- View all financial reports
- Approve large refunds (> TZS 500,000)
- Approve large expenses
- View audit logs

Cannot:
- Modify another owner's data
- Delete financial records without audit

---

### 3. General Manager

**Scope:** Property  
**Permissions:** `property.*`, `report.*`, `reservation.*`, `payment.*` (except refund > limit)

Can:
- Manage all hotel operations
- View all reports
- Record payments
- Approve refunds ≤ TZS 500,000
- Approve expenses ≤ TZS 500,000

Cannot:
- Approve refunds > TZS 500,000 (requires Owner)
- Delete financial records
- Modify system settings

---

### 4. Auditor

**Scope:** Tenant (read-only)  
**Permissions:** `report.financial.view`, `audit.view`

Can:
- View all financial reports
- View audit logs
- Export reports

Cannot:
- Create, update, delete any record
- Approve anything

---

### 5. Receptionist

**Scope:** Property  
**Permissions:** `reservation.*`, `guest.*`, `payment.record`, `folio.view`

Can:
- Create and manage reservations
- Register guests
- Perform check-in and check-out
- Record payments
- View guest folios

Cannot:
- Refund payments
- Approve expenses
- View financial reports
- Delete financial records

---

### 6. Accountant / Cashier

**Scope:** Property  
**Permissions:** `payment.*`, `invoice.*`, `expense.*`, `report.financial.view`

Can:
- Record payments
- Create invoices
- Submit expenses
- Approve expenses (not own)
- Reconcile payments
- View financial reports

Cannot:
- Refund payments without approval
- Approve own expenses
- Delete financial records

---

### 7. Housekeeping

**Scope:** Property  
**Permissions:** `housekeeping.*`, `room.status.update`

Can:
- View room status
- Update room cleaning status
- Report maintenance issues
- View assigned tasks

Cannot:
- Modify room assignments
- Access financial data
- View guest PII beyond operational needs

---

### 8. Waiter

**Scope:** Property (restaurant)  
**Permissions:** `order.create`, `order.view.own`, `payment.record`

Can:
- Create orders
- View own orders
- Record payments

Cannot:
- Modify other waiters' orders
- Delete orders without approval
- Access kitchen-only functions

---

### 9. Chef / Kitchen

**Scope:** Property (kitchen)  
**Permissions:** `order.view`, `order.status.update`, `menu.view`

Can:
- View orders
- Update order status (preparing, ready)
- View menu

Cannot:
- Create orders
- Modify menu prices
- Access financial data

---

### 10. Storekeeper

**Scope:** Property  
**Permissions:** `inventory.*`, `stock.receive`, `stock.adjust` (approval required)

Can:
- View inventory
- Receive goods
- Request stock adjustments

Cannot:
- Approve own adjustments
- Delete stock movements
- Access financial data

---

### 11. Procurement Manager

**Scope:** Property  
**Permissions:** `procurement.*`, `supplier.*`, `po.approve`

Can:
- Create purchase orders
- Approve purchase orders
- Approve stock adjustments
- Manage suppliers

Cannot:
- Approve own expenses
- Delete financial records

---

## PERMISSION NAMING CONVENTION

`{module}.{action}`

Examples:
- `reservation.view`, `reservation.create`, `reservation.cancel`, `reservation.check_in`, `reservation.check_out`
- `payment.record`, `payment.verify`, `payment.refund`, `payment.void`
- `expense.create`, `expense.approve`
- `inventory.adjust`, `stock.transfer`
- `report.financial.view`, `report.inventory.view`
- `role.create`, `role.assign`
- `audit.view`

---

## SEPARATION OF DUTIES

| Action | Rule |
|---|---|
| Refund > TZS 500,000 | Requires GM or Owner approval |
| Stock adjust | Requires Procurement Manager approval |
| Expense approve | Cannot approve own expense |
| Role change | Cannot change own role |
| Cashier shift close | Requires Accountant verification |

---

**Last Updated:** 2026-10-29
