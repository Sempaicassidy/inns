# UAT PLAN

**Project:** THE INNS — Hotel, Lodge & Restaurant Management SaaS  
**Version:** 1.0  
**Date:** 2026-10-29

---

## UAT OBJECTIVES

Verify that THE INNS platform meets all functional, non-functional, and business requirements for hospitality operations.

---

## UAT PRECONDITIONS

- All P0 features implemented and tested
- Tenant isolation verified
- Permissions enforced server-side
- Financial calculations accurate
- Inventory integrity verified
- Critical UI layouts inspected at all breakpoints
- No critical security vulnerabilities
- Backup restoration tested
- Documentation complete

---

## UAT TEST DATA

- Synthetic test data (factories/seeders)
- No real guest/payment data
- Test scenarios for each role

---

## UAT SCENARIOS

### 1. Owner Dashboard
- View revenue, occupancy, and key metrics
- Filter by date range
- View notifications and alerts
- Export reports

### 2. Receptionist Workflow
- Create reservation
- Check-in guest
- Record payment
- Check-out guest

### 3. Restaurant POS
- Create order
- Send to kitchen
- Serve order
- Process payment

### 4. Multi-Tenant Isolation
- Login as Tenant A
- Verify cannot access Tenant B data
- Login as Tenant B
- Verify cannot access Tenant A data

### 5. Financial Accuracy
- Create invoice
- Record payment
- Verify balance calculated correctly
- Generate report and verify accuracy

### 6. Inventory Integrity
- Receive goods
- Create recipe-based order
- Verify stock deducted correctly
- Verify no duplicate deductions

---

## UAT CRITERIA

- All critical workflows pass end-to-end
- UI is responsive at all breakpoints
- Accessibility meets WCAG 2.2 AA
- No critical bugs remain
- Performance targets met
- Security verified

---

## UAT EXPECTED OUTCOMES

- Platform ready for production deployment
- Business users can perform daily operations
- System is stable and reliable
- Documentation is complete

---

**Last Updated:** 2026-10-29
