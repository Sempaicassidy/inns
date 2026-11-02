# DATABASE DESIGN

**Project:** THE INNS — Hotel, Lodge & Restaurant Management SaaS  
**Version:** 1.0  
**Date:** 2026-10-29

---

## 1. CORE TABLES

### 1.1 Tenancy Tables

```sql
tenants (id, name, slug, plan_id, status, trial_ends_at, created_at, updated_at)
properties (id, tenant_id, name, timezone, currency, address_json, tax_config_json, invoice_prefix, receipt_prefix, created_at, updated_at)
departments (id, property_id, name, type, created_at, updated_at)
```

### 1.2 Identity Tables

```sql
users (id, tenant_id, name, email, phone, password, status, last_login_at, created_at, updated_at)
roles (id, tenant_id, name, is_system, created_at, updated_at)
permissions (id, name, module, description, created_at, updated_at)
role_permission (role_id, permission_id, created_at)
user_role (user_id, role_id, property_id, created_at)
sessions (id, user_id, ip, user_agent, last_activity, created_at)
audit_logs (id, tenant_id, user_id, action, model_type, model_id, changes_json, ip, created_at)
```

### 1.3 Hotel Tables

```sql
room_types (id, property_id, name, base_rate, capacity, description, created_at, updated_at)
rooms (id, property_id, room_type_id, number, floor, status_occupancy, status_hk, is_active, created_at, updated_at)
rate_plans (id, property_id, name, type, config_json, created_at, updated_at)
room_rates (id, room_type_id, rate_plan_id, date_from, date_to, rate, min_stay, created_at, updated_at)
reservations (id, property_id, guest_id, ref_no, status, check_in, check_out, adults, children, source, notes, created_by, created_at, updated_at)
reservation_rooms (id, reservation_id, room_type_id, room_id, rate, nights, total, created_at, updated_at)
guests (id, tenant_id, first_name, last_name, email, phone, id_type, id_number, nationality, address_json, notes, created_at, updated_at)
stays (id, reservation_room_id, room_id, guest_id, checked_in_at, checked_out_at, registration_data, created_at, updated_at)
folios (id, stay_id, guest_id, folio_number, currency, total_charges_minor, total_payments_minor, balance_minor, status, opened_at, closed_at, created_at, updated_at)
folio_lines (id, folio_id, description, quantity, unit_price, tax, total, source, source_id, posted_at, created_at, updated_at)
housekeeping_tasks (id, room_id, type, status, assigned_to, notes, completed_at, created_at, updated_at)
maintenance_blocks (id, room_id, reason, start_date, end_date, created_at, updated_at)
```

### 1.4 Restaurant Tables

```sql
menu_categories (id, property_id, name, sort_order, created_at, updated_at)
menu_items (id, property_id, category_id, name, price, cost, is_active, tax_rate, created_at, updated_at)
menu_modifiers (id, menu_item_id, name, price_delta, created_at, updated_at)
menu_price_history (id, menu_item_id, old_price, new_price, changed_by, changed_at, created_at)
tables (id, property_id, area, number, capacity, status, created_at, updated_at)
orders (id, property_id, table_id, type, status, room_id, guest_id, opened_by, opened_at, closed_at, subtotal, tax, total, folio_id, created_at, updated_at)
order_items (id, order_id, menu_item_id, quantity, unit_price, modifiers_json, notes, status, sent_to_kitchen_at, ready_at, served_at, created_at, updated_at)
order_payments (id, order_id, method, amount, reference, paid_at, created_at, updated_at)
recipes (id, menu_item_id, ingredient_id, quantity, unit, created_at, updated_at)
```

### 1.5 Finance Tables

```sql
invoices (id, property_id, number, type, customer_type, customer_id, subtotal, tax, total, status, issued_at, due_at, paid_at, created_at, updated_at)
invoice_lines (id, invoice_id, description, quantity, unit_price, tax, total, created_at, updated_at)
payments (id, property_id, invoice_id, folio_id, order_id, payment_method, amount_minor, reference, status, received_by, received_at, verified_at, verified_by, created_at, updated_at)
payment_allocations (id, payment_id, invoice_id, folio_id, order_id, amount, created_at, updated_at)
refunds (id, payment_id, amount_minor, reason, requested_by, approved_by, approved_at, status, created_at, updated_at)
expenses (id, property_id, category, description, amount_minor, expense_date, receipt_path, submitted_by, approved_by, approved_at, status, created_at, updated_at)
cashier_shifts (id, property_id, user_id, opened_at, closed_at, opening_float, closing_float, expected_cash, actual_cash, variance, created_at, updated_at)
tax_rates (id, property_id, name, rate, is_inclusive, created_at, updated_at)
```

### 1.6 Inventory Tables

```sql
inventory_items (id, property_id, name, sku, unit, category, reorder_level, cost_method, created_at, updated_at)
suppliers (id, tenant_id, name, contact_json, payment_terms, created_at, updated_at)
storage_locations (id, property_id, name, created_at, updated_at)
stock_levels (id, inventory_item_id, location_id, quantity, value, created_at, updated_at)
stock_movements (id, inventory_item_id, location_id, type, quantity, unit_cost, reference_type, reference_id, created_by, created_at, updated_at)
purchase_requests (id, property_id, requested_by, status, approved_by, approved_at, created_at, updated_at)
purchase_orders (id, property_id, supplier_id, status, total, ordered_at, received_at, created_at, updated_at)
po_lines (id, po_id, inventory_item_id, quantity, unit_cost, total, created_at, updated_at)
goods_receipts (id, po_id, received_by, received_at, notes, created_at, updated_at)
goods_receipt_lines (id, receipt_id, po_line_id, quantity_received, unit_cost, created_at, updated_at)
stock_transfers (id, from_location_id, to_location_id, status, created_by, created_at, updated_at)
stock_adjustments (id, inventory_item_id, quantity_delta, reason, approved_by, approved_at, created_at, updated_at)
```

### 1.7 Notification Tables

```sql
notification_templates (id, tenant_id, key, channel, subject, body, variables_json, created_at, updated_at)
notifications (id, tenant_id, user_id, channel, template_key, payload_json, status, sent_at, delivered_at, error, created_at, updated_at)
message_deliveries (id, notification_id, provider, provider_message_id, status, error, retried_at, created_at, updated_at)
webhook_events (id, provider, event_id, payload_json, processed_at, status, created_at, updated_at)
```

---

## 2. DATA INTEGRITY RULES

### 2.1 Monetary Precision

- All monetary columns: `DECIMAL(15,2)` (minor units as integer: `amount_minor` INT)
- Never use `FLOAT`

### 2.2 Unique Constraints

- `reservations.ref_no` unique per property
- `invoices.number` unique per property
- `folios.folio_number` unique per property
- `payments.reference` unique per method per property

### 2.3 Foreign Keys

- All FKs with `ON DELETE RESTRICT` (default)
- Optional FKs: `ON DELETE SET NULL`

### 2.4 Indexes

```sql
-- Tenant isolation (every table)
CREATE INDEX idx_{table}_tenant ON {table}(tenant_id);
CREATE INDEX idx_{table}_property ON {table}(property_id);

-- Hotel
CREATE INDEX idx_reservations_dates ON reservations(property_id, check_in, check_out);
CREATE INDEX idx_reservations_status ON reservations(property_id, status);
CREATE INDEX idx_rooms_status ON rooms(property_id, status_occupancy, status_hk);
CREATE INDEX idx_folios_status ON folios(property_id, status);

-- Restaurant
CREATE INDEX idx_orders_open ON orders(property_id, status) WHERE status IN ('open','sent','preparing');
CREATE INDEX idx_order_items_kitchen ON order_items(status, sent_to_kitchen_at);

-- Finance
CREATE INDEX idx_payments_received ON payments(property_id, received_at);
CREATE INDEX idx_invoices_status ON invoices(property_id, status);

-- Audit
CREATE INDEX idx_audit_created ON audit_logs(tenant_id, created_at DESC);
```

---

## 3. MIGRATION STRATEGY

- Greenfield: no data migration needed
- Migrations written with `up` and `down` methods
- Rollback tested before deployment
- No destructive migrations in production without backup

---

**Last Updated:** 2026-10-29
