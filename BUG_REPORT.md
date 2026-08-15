# Bug Report: Task Manager API

This document records the defects identified while reading the existing implementation and writing unit/integration tests. Each confirmed bug includes its expected behavior, observed behavior, discovery method, root cause, and fix.

---

## 1. 1-Indexed Pagination Calculation Error

- **Location:** `task-api/src/services/taskService.js`
- **Expected Behavior:** `getPaginated(1, 10)` should return the first 10 tasks.
- **Actual Behavior:** The original implementation calculated the offset as `page * limit`. For `page = 1` and `limit = 10`, this produced an offset of `10`, causing the first page to skip the first 10 tasks.
- **Discovery Method:** A unit test for page 1 expected the first task (`Task 1`) but the original implementation returned `Task 11`.
- **Root Cause:** The API uses 1-based page numbering, but the offset calculation treated the page number as if it were zero-based.
- **Fix:** Changed the calculation to use `(page - 1) * limit` and guarded the page number with `Math.max(1, page)`.
- **Regression Test:** `getPaginated()` tests verify page 1, page 2, page 3, and a page number below 1.

---

## 2. Partial Substring Status Matching

- **Location:** `task-api/src/services/taskService.js`
- **Expected Behavior:** Filtering by a status should return only tasks whose status exactly matches the requested value.
- **Actual Behavior:** The original implementation used `t.status.includes(status)`. For example, querying with `status=do` could match both `todo` and `done`.
- **Discovery Method:** A unit test was written to verify that status filtering does not return partial matches.
- **Root Cause:** `String.prototype.includes()` performs substring matching instead of exact status comparison.
- **Fix:** Changed the filter condition to `t.status === status`.
- **Regression Test:** `getByStatus()` verifies exact matching and explicitly verifies that a partial value such as `do` returns no results.

---

## 3. Unintended Task Priority Reset on Completion

- **Location:** `task-api/src/services/taskService.js`
- **Expected Behavior:** Completing a task should change its status to `done` and set `completedAt` while preserving the task's existing priority.
- **Actual Behavior:** The original `completeTask()` implementation explicitly set `priority: 'medium'`, causing high- or low-priority tasks to be silently changed to medium priority.
- **Discovery Method:** The integration test for `PATCH /tasks/:id/complete` used a high-priority task and verified that its priority remained unchanged.
- **Root Cause:** `completeTask()` contained an unnecessary hardcoded priority assignment.
- **Fix:** Removed the hardcoded `priority: 'medium'` assignment so the existing task priority is preserved.
- **Regression Test:** Both service-level and API-level completion tests verify that a high-priority task remains high priority after completion.

---

## Additional Design Observation

### Status Filtering and Pagination

The current route handling prioritizes the `status` query parameter when it is present. Therefore, a request containing both filtering and pagination parameters, such as:

`GET /tasks?status=todo&page=1&limit=5`

currently returns the filtered tasks without applying pagination.

I have **not classified this as a confirmed bug** because the assignment does not explicitly define whether filtering and pagination must be composable.

Before changing this behavior in a production system, I would clarify the API contract with the product/API owner. If combined filtering and pagination are required, I would consolidate the query handling into a service-level operation such as:

`getTasks({ status, page, limit })`

This would allow filtering and pagination to be applied consistently in one place.
