# AssetFlow — Requirements Verification Checklist

Ordered highest → lowest priority, based on what the problem statement treats as
core/mandatory vs. supporting/bonus. Use this for your own manual walkthrough and
for final integration testing before demo.

---

## P0 — Core Business Rules (these are explicitly called out as "the system must
enforce X" — a working demo that fails any of these will visibly fail live in front
of judges)

- [ ] **Double-allocation block**: allocating an already-allocated asset is rejected,
      response shows "currently held by [name]", and a **Transfer Request** button/flow
      is offered instead (not just a generic error)
- [ ] **Booking overlap validation — reject case**: booking 9:30–10:30 against an
      existing 9:00–10:00 booking on the same resource is rejected
- [ ] **Booking overlap validation — back-to-back allowed**: booking 10:00–11:00
      against an existing 9:00–10:00 booking on the same resource is **accepted**
      (strict inequality, not `<=`)
- [ ] **Maintenance approval gate**: a maintenance request cannot start repair work
      (i.e. asset does not flip to Under Maintenance) until an Asset Manager approves it
- [ ] **Asset status auto-updates**: Available → Under Maintenance happens automatically
      on maintenance approval; Under Maintenance → Available happens automatically on
      resolution (not manual admin toggling)
- [ ] **Realistic signup — no self-elevation**: signup creates an Employee-role
      account only; there is no role selector on the signup form; Admin/Dept
      Head/Asset Manager can only be assigned by an Admin from the Employee
      Directory (Screen 3, Tab C) — this is stated as "the only place roles are
      assigned"
- [ ] **Audit discrepancy → Lost status**: closing an Audit Cycle automatically
      updates confirmed-missing assets' status to Lost
- [ ] **Full asset lifecycle states present**: Available, Allocated, Reserved, Under
      Maintenance, Lost, Retired, Disposed — all seven exist as selectable/visible
      statuses, not a subset
- [ ] **Overdue return auto-flagging**: allocations past Expected Return Date are
      detected automatically (not by manual marking) and surfaced separately from
      upcoming returns

## P1 — Core Screens & Modules (the 10 numbered screens are the explicit deliverable
list — missing any one is a missing "feature" in the grading rubric)

- [ ] **Screen 1 — Login/Signup**: email+password login, forgot password, session
      validation, signup (Employee-only, as above)
- [ ] **Screen 2 — Dashboard**: KPI cards for Assets Available, Assets Allocated,
      Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns;
      overdue returns shown separately; quick actions (Register Asset, Book
      Resource, Raise Maintenance Request)
- [ ] **Screen 3 — Organization Setup (Admin only, 3 tabs)**:
  - [ ] Tab A Departments: create/edit/deactivate, assign Dept Head, optional
        Parent Department, Status
  - [ ] Tab B Categories: create/edit, optional category-specific fields
        (e.g. warranty period)
  - [ ] Tab C Employee Directory: Name/Email/Department/Role/Status, promote to
        Dept Head or Asset Manager here
- [ ] **Screen 4 — Asset Registration & Directory**: register with Name, Category,
      auto-generated Asset Tag (e.g. AF-0001), Serial Number, Acquisition Date,
      Acquisition Cost, Condition, Location, photo/documents, shared/bookable flag;
      search/filter by tag, serial, QR code, category, status, department, location;
      per-asset allocation history + maintenance history visible
- [ ] **Screen 5 — Asset Allocation & Transfer**: allocate with optional Expected
      Return Date; conflict block (see P0); Transfer workflow Requested → Approved
      (by Asset Manager/Dept Head) → Re-allocated with history auto-updated; return
      flow captures condition check-in notes and reverts status to Available
- [ ] **Screen 6 — Resource Booking**: calendar view of a resource's existing
      bookings; overlap validation (see P0); status states Upcoming/Ongoing/
      Completed/Cancelled; cancel/reschedule; reminder notification before slot starts
- [ ] **Screen 7 — Maintenance Management**: raise request (asset, issue
      description, priority, photo); workflow Pending → Approved/Rejected →
      Technician Assigned → In Progress → Resolved; auto status updates (P0);
      maintenance history retained per asset
- [ ] **Screen 8 — Asset Audit**: create Audit Cycle with scope (department or
      location) and date range; assign one or more auditors; auditor marks each
      asset Verified/Missing/Damaged; auto-generated discrepancy report for
      flagged items; Close Audit Cycle locks it and updates statuses (P0); audit
      history retained per cycle
- [ ] **Screen 9 — Reports & Analytics**: asset utilization trends; most-used vs.
      idle assets; maintenance frequency by asset/category; assets due for
      maintenance or nearing retirement; department-wise allocation summary;
      resource booking heatmap; exportable reports
- [ ] **Screen 10 — Activity Logs & Notifications**: notifications for at minimum —
      Asset Assigned, Maintenance Approved/Rejected, Booking Confirmed/Cancelled/
      Reminder, Transfer Approved, Overdue Return Alert, Audit Discrepancy Flagged;
      full activity log of who did what, when (admin/manager/employee actions)

## P2 — Role-Based Access Control (explicitly required, tested by trying actions as
each role)

- [ ] **Admin**: manages departments, categories, audit cycles, employee/role
      assignment (Org Setup); views organization-wide analytics
- [ ] **Asset Manager**: registers and allocates assets; approves transfers,
      maintenance requests, audit discrepancy resolution; approves returns and
      condition check-in notes
- [ ] **Department Head**: views assets allocated to their department; approves
      allocation/transfer requests within their department; books shared resources
      on behalf of the department
- [ ] **Employee**: views assets allocated to them; books shared resources; raises
      maintenance requests; initiates return/transfer requests
- [ ] Role checks are enforced **server-side** on every relevant endpoint, not just
      hidden in the UI (a judge who calls the API directly or inspects network
      tab should still be blocked)

## P3 — Data Model Completeness (underpins everything above — check these exist
with the right relationships, not just as flat tables)

- [ ] Department: hierarchy support (Parent Department, self-referencing)
- [ ] Asset Category: supports optional category-specific fields (flexible/JSON
      field, not hardcoded per category)
- [ ] Asset: department_id linkage, is_bookable flag, all 7 statuses
- [ ] Allocation: linked to both employee AND optionally department; Expected
      Return Date; Return Condition Notes
- [ ] Transfer Request: From/To, Reason, status lifecycle, links back into
      allocation history automatically
- [ ] Booking: linked to a bookable Asset, time range, 4-state status lifecycle
- [ ] Maintenance Request: priority field, photo attachment, 6-state workflow
- [ ] Audit Cycle → Audit Assignment (auditors) → Audit Record (per-asset result)
      — three-table structure, not flattened into one
- [ ] Notification: typed (matches the 6+ notification types listed), read/unread
- [ ] Activity Log: separate from Notification — records raw actions, not just
      user-facing alerts

## P4 — Cross-Cutting / Non-Functional (mentioned once but easy to silently skip)

- [ ] Responsive/intuitive UI/UX (explicitly named as a grading concern)
- [ ] "Clean architecture... scalable module design" — reusable modules, not one
      monolithic file (this is explicitly called out as a demonstration
      requirement, not just nice-to-have)
- [ ] System correctly stays **out of scope** on purchasing/invoicing/accounting —
      Acquisition Cost is used only for ranking/reports, not wired into any
      accounting logic (an over-eager build might accidentally add this — check
      it wasn't)
- [ ] Basic Workflow end-to-end runs without manual DB intervention: Admin setup →
      Asset Manager registers asset → allocate/block/transfer → book resource →
      raise+approve maintenance → audit cycle → notifications/logs/reports all
      reflect the above

## P5 — Bonus / Implied but Not Explicitly Mandatory

- [ ] QR code search actually functions (vs. just a text field that happens to
      accept a QR-looking string)
- [ ] Reminder notification fires before a booking's slot actually starts (not
      just on creation)
- [ ] Photo/document upload for assets and maintenance requests is functional
      (even if stored as placeholder/base64 for demo purposes)
- [ ] Session validation / token refresh works across a page reload, not just
      immediately after login
