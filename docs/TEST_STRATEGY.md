# TEST STRATEGY

**Project:** THE INNS — Hotel, Lodge & Restaurant Management SaaS  
**Version:** 1.0  
**Date:** 2026-10-29

---

## TEST PYRAMID

| Level | Tool | Coverage Target |
|---|---|---|
| Unit | PHPUnit | 70%+ |
| Feature/Integration | PHPUnit | Critical paths 100% |
| E2E | Laravel Dusk | 15 core workflows |
| Authorization | PHPUnit | Every policy |
| Tenant Isolation | PHPUnit | Every model |
| Financial | PHPUnit | Every calculation |
| Inventory | PHPUnit | Every movement type |

---

## CRITICAL WORKFLOWS (MUST PASS)

1. Tenant + property creation
2. Two tenants isolated (cross-tenant access blocked)
3. Role + permission enforcement
4. Reservation + double-booking prevention (concurrent test)
5. Check-in + folio creation
6. Restaurant order → kitchen → served
7. Room service → correct folio
8. Recipe stock consumption (no duplicate)
9. Payment record + verify + reconcile
10. Refund approval + audit
11. Check-out + housekeeping transition
12. Notification failure handling
13. Financial report accuracy
14. Unauthorized API/export access
15. Dashboard filter + responsive

---

## CI GATES

PR cannot merge if:
- Tests fail
- Coverage < 70%
- Critical security warnings (`composer audit`)
- Pint fails

---

**Last Updated:** 2026-10-29
