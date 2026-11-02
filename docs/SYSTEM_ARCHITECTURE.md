# SYSTEM ARCHITECTURE

**Project:** THE INNS — Hotel, Lodge & Restaurant Management SaaS  
**Version:** 1.0  
**Date:** 2026-10-29

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Pattern: Modular Monolith

The system uses a modular monolith architecture with domain boundaries.

```
Platform
└── Tenant (Organization)
    └── Property (Hotel/Lodge/Restaurant)
        └── Department (Front Desk, Kitchen, Housekeeping, Bar)
            └── Business Records
```

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Laravel (PHP 8.4) |
| Frontend | Inertia.js v2 + React + TypeScript |
| Database | MySQL 8.x |
| Cache/Queue | Database (Phase 1), Redis (Phase 2) |
| UI | Tailwind CSS v3 |
| Testing | PHPUnit |

### 1.3 Directory Structure

```
app/
├── Domain/
│   ├── Tenancy/          # Tenant, Property models
│   ├── Identity/         # User, Role, Permission
│   ├── Hotel/            # Room, Reservation, Stay, Folio
│   ├── Restaurant/       # Menu, Order, Kitchen
│   ├── Finance/          # Invoice, Payment, Expense
│   ├── Inventory/        # Stock, Movement, Procurement
│   └── Notification/     # Email, SMS, WhatsApp
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   └── Requests/
├── Models/
├── Policies/
└── Providers/
```

---

## 2. DOMAIN BOUNDARIES

### 2.1 Domain Communication Rules

- Domains communicate via **Events** and **Interfaces**, not direct imports
- Example: Restaurant domain emits `RoomServiceOrderClosed` event; Hotel domain listens and posts to folio
- This keeps domains decoupled and testable

### 2.2 Global Scopes

Every model with `tenant_id` uses `BelongsToTenant` trait:

```php
trait BelongsToTenant {
    protected static function bootBelongsToTenant(): void {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (auth()->check()) {
                $builder->where('tenant_id', auth()->user()->tenant_id);
            }
        });
        static::creating(function ($model) {
            if (auth()->check() && empty($model->tenant_id)) {
                $model->tenant_id = auth()->user()->tenant_id;
            }
        });
    }
}
```

---

## 3. KEY ARCHITECTURAL DECISIONS

### 3.1 Tenant Isolation

**Strategy:** Single database, shared schema, `tenant_id` column

**Enforcement:**
- Global scope on all tenant-owned models
- Middleware sets `app('tenant')` on request
- Policies verify tenant match
- Tests verify cross-tenant access is blocked

### 3.2 Financial Data Integrity

**Decisions:**
- Use `DECIMAL(15,2)` for all monetary values
- Never use `FLOAT`
- Financial records are never soft-deleted
- Folio lines are immutable; corrections use reversal lines
- Payments are never edited; reversals create new records

### 3.3 Stock Management

**Decisions:**
- `stock_movements` is append-only ledger
- `stock_levels` is derived from movements
- Recipe consumption uses idempotency to prevent duplicate deductions
- Unique constraint: `(reference_type, reference_id, inventory_item_id, type)`

### 3.4 Background Jobs

**Queues:**
- `default` - General operations
- `notifications` - Email, SMS, WhatsApp
- `reports` - Report generation, PDF creation

**Retry Policy:**
- 3 attempts with exponential backoff (1m, 5m, 15m)
- Failed jobs logged and alerted

---

## 4. API STRATEGY

### 4.1 Internal API

- Uses Laravel Sanctum for authentication
- Prefix: `/api/v1/`
- Used for mobile app (Phase 2+)

### 4.2 Webhooks

- Prefix: `/webhooks/{provider}`
- Signature verification required
- Idempotency keys required

---

## 5. SECURITY ARCHITECTURE

### 5.1 Authentication

- Laravel built-in session-based auth
- Password hashing: bcrypt
- Email verification required for new users
- MFA: Phase 2

### 5.2 Authorization

- Gates and Policies for every action
- Middleware: `permission:{action}`
- UI directive: `@can('{action}')` - not security, just UX

### 5.3 Data Protection

- PII in database: encrypted at rest (Phase 2)
- Audit logs: no passwords/tokens
- Secrets: `.env` file, never committed
- File uploads: validated type, size, virus scan

---

## 6. DEPLOYMENT ARCHITECTURE

### 6.1 Phase 1 (MVP)

- VPS: 2 vCPU, 4GB RAM, 80GB SSD
- OS: Ubuntu 22.04 LTS
- Web: Nginx + PHP-FPM 8.4
- Database: MySQL 8.x (same VPS)
- Cache: File cache
- Queue: Database driver (cron every minute)
- SSL: Let's Encrypt

### 6.2 Phase 2+

- Redis for cache and queue
- Separate database server
- CDN for static assets
- Load balancer for horizontal scaling

---

**Last Updated:** 2026-10-29
