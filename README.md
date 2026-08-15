# The Untested API — Take-Home Assignment

A small Express.js Task Manager API used for code reading, testing, debugging, and feature development.

This submission focuses on understanding an unfamiliar codebase, building automated test coverage, identifying defects through testing, fixing confirmed bugs, and implementing the requested task-assignment feature.

> See [ASSIGNMENT.md](./ASSIGNMENT.md) for the original assignment brief.

---

## Submission Summary

### Completed Work

- Added unit tests for the task service layer
- Added integration tests for the HTTP API
- Covered success cases, validation failures, missing resources, and edge cases
- Identified and fixed **3 confirmed bugs**
- Implemented `PATCH /tasks/:id/assign`
- Added validation for task assignment
- Added whitespace handling for assignee names
- Documented the discovered bugs, root causes, and fixes
- Verified the implementation with automated tests and coverage

### Final Test Results

| Metric | Result |
|---|---:|
| Test Suites | **2 passed** |
| Tests | **47 passed** |
| Statement Coverage | **97.41%** |
| Branch Coverage | **98.85%** |
| Function Coverage | **93.33%** |
| Line Coverage | **97.16%** |

The remaining uncovered lines are in the Express application bootstrap/error-handling paths and do not affect the core route, service, or validation coverage.

---

## Bugs Identified and Fixed

Three confirmed defects were identified during code review and testing.

### 1. Pagination Off-by-One Error

**Location:** `task-api/src/services/taskService.js`

The original pagination logic calculated:

```js
const offset = page * limit;
```

This treated the page number as zero-based even though the API accepts page numbers starting from `1`.

For example:

```text
page = 1
limit = 10
offset = 10
```

caused the first page to start with the 11th task.

**Fix:**

```js
const pageNum = Math.max(1, page);
const offset = (pageNum - 1) * limit;
```

Regression tests verify page 1, page 2, page 3, and page values below 1.

---

### 2. Partial Status Matching

**Location:** `task-api/src/services/taskService.js`

The original implementation used:

```js
tasks.filter((t) => t.status.includes(status));
```

This allowed partial values to match multiple statuses.

For example:

```text
status=do
```

could match both:

```text
todo
done
```

**Fix:**

```js
tasks.filter((t) => t.status === status);
```

Status filtering now requires an exact match.

A regression test explicitly verifies that partial values do not produce matches.

---

### 3. Priority Reset When Completing a Task

**Location:** `task-api/src/services/taskService.js`

The original `completeTask()` implementation explicitly assigned:

```js
priority: 'medium'
```

This caused a high- or low-priority task to silently become medium priority when completed.

**Fix:**

Removed the hardcoded priority assignment so the existing task priority is preserved.

For example:

```text
Before completion:
priority = high

After completion:
priority = high
status = done
completedAt = <timestamp>
```

Both service-level and API-level tests verify this behavior.

---

## Feature Implemented

### `PATCH /tasks/:id/assign`

Implemented the requested task assignment endpoint.

### Request

```http
PATCH /tasks/:id/assign
Content-Type: application/json
```

```json
{
  "assignee": "Bob Smith"
}
```

### Successful Response

```http
200 OK
```

```json
{
  "id": "uuid",
  "title": "Task for Assignee",
  "description": "",
  "status": "todo",
  "priority": "medium",
  "dueDate": null,
  "completedAt": null,
  "createdAt": "2026-08-15T00:00:00.000Z",
  "assignee": "Bob Smith"
}
```

### Validation

The endpoint returns `400 Bad Request` when:

* `assignee` is missing
* `assignee` is not a string
* `assignee` is empty
* `assignee` contains only whitespace

Whitespace surrounding the assignee is trimmed before storing it.

For example:

```json
{
  "assignee": "  Bob Smith  "
}
```

is stored as:

```json
{
  "assignee": "Bob Smith"
}
```

If the task does not exist, the endpoint returns:

```http
404 Not Found
```

```json
{
  "error": "Task not found"
}
```

---

## API Reference

| Method   | Endpoint              | Description              |
| -------- | --------------------- | ------------------------ |
| `GET`    | `/tasks`              | List tasks               |
| `GET`    | `/tasks/stats`        | Return task statistics   |
| `POST`   | `/tasks`              | Create a task            |
| `PUT`    | `/tasks/:id`          | Update a task            |
| `DELETE` | `/tasks/:id`          | Delete a task            |
| `PATCH`  | `/tasks/:id/complete` | Mark a task as completed |
| `PATCH`  | `/tasks/:id/assign`   | Assign a task to a user  |

### Query Parameters

`GET /tasks` supports:

```text
status
page
limit
```

Example:

```text
GET /tasks?status=todo&page=1&limit=10
```

---

## Task Model

A task contains the following fields:

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO 8601 string or null",
  "completedAt": "ISO 8601 string or null",
  "createdAt": "ISO 8601 string",
  "assignee": "string or undefined"
}
```

The API currently uses an **in-memory data store**, so all data is reset when the application restarts.

---

## Getting Started

### Prerequisites

* Node.js 18+
* npm

### Install Dependencies

From the repository root:

```bash
cd task-api
npm install
```

### Start the API

```bash
npm start
```

The server runs at:

```text
http://localhost:3000
```

---

## Running Tests

### Run the complete test suite

```bash
npm test
```

### Run tests serially

```bash
npm test -- --runInBand
```

### Run tests with coverage

```bash
npm run coverage
```

### Expected Result

```text
Test Suites: 2 passed, 2 total
Tests:       47 passed, 47 total
```

---

## Example API Requests

### Create a Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Write tests\",\"priority\":\"high\"}"
```

### List Tasks

```bash
curl http://localhost:3000/tasks
```

### Filter and Paginate Tasks

```bash
curl "http://localhost:3000/tasks?status=todo&page=1&limit=10"
```

### Complete a Task

```bash
curl -X PATCH http://localhost:3000/tasks/<id>/complete
```

### Assign a Task

```bash
curl -X PATCH http://localhost:3000/tasks/<id>/assign \
  -H "Content-Type: application/json" \
  -d "{\"assignee\":\"Bob Smith\"}"
```

### Delete a Task

```bash
curl -X DELETE http://localhost:3000/tasks/<id>
```

---

## Project Structure

```text
Take-Home-Assignment-The-Untested-API/
│
├── task-api/
│   ├── src/
│   │   ├── app.js
│   │   ├── routes/
│   │   │   └── tasks.js
│   │   ├── services/
│   │   │   └── taskService.js
│   │   └── utils/
│   │       └── validators.js
│   │
│   ├── tests/
│   │   ├── taskService.test.js
│   │   └── tasks.routes.test.js
│   │
│   ├── package.json
│   └── jest.config.js
│
├── ASSIGNMENT.md
├── BUG_REPORT.md
└── README.md
```

### Responsibilities

**`src/routes/tasks.js`**

Defines HTTP endpoints, validates request input, invokes the service layer, and maps service results to HTTP responses.

**`src/services/taskService.js`**

Contains task-related business logic and the in-memory data store.

**`src/utils/validators.js`**

Contains request validation helpers used by the routes.

**`tests/taskService.test.js`**

Unit tests for task service behavior.

**`tests/tasks.routes.test.js`**

Integration tests covering the HTTP API using Supertest.

**`BUG_REPORT.md`**

Documents the confirmed defects discovered during the implementation, including their root causes and fixes.

---

## Testing Approach

The test suite is divided into two layers.

### Unit Tests

The service tests verify business logic independently of HTTP concerns, including:

* Task creation
* Default task values
* Task lookup
* Status filtering
* Pagination
* Statistics
* Task updates
* Task deletion
* Task completion
* Task assignment
* Non-existent task handling

### Integration Tests

The route tests exercise the API through HTTP and verify:

* HTTP status codes
* Request validation
* Response bodies
* Resource-not-found behavior
* Query parameters
* Pagination
* Task creation
* Task updates
* Task deletion
* Completion
* Assignment

This separation makes it possible to distinguish service-level logic failures from HTTP/API contract failures.

---

## Design Decisions

### Assignment Validation

Assignment input is validated at the route boundary before calling the service.

This prevents invalid input from reaching the business logic and keeps the service focused on task operations.

### Assignee Normalization

Assignee names are trimmed before being stored:

```text
"  Bob Smith  "
        ↓
"Bob Smith"
```

This avoids storing accidental surrounding whitespace while preserving the actual name.

### Missing Tasks

Service methods return `null`/`false`/`undefined` where appropriate for missing resources, and the route layer translates those results into the corresponding HTTP responses.

For example:

```text
Task not found
       ↓
HTTP 404
```

### In-Memory Storage

The existing assignment uses an in-memory data store. The implementation keeps that architecture rather than introducing a database because persistence was outside the scope of the assignment.

---

## Additional Design Observation

The current implementation handles `status` filtering before pagination.

Therefore:

```text
GET /tasks?status=todo&page=1&limit=5
```

currently returns the filtered task collection without applying pagination to that filtered result.

I did **not** classify this as a confirmed bug because the assignment does not explicitly define whether filtering and pagination must be composable.

If this were a production API, I would clarify the expected API contract first. If composable filtering and pagination were required, I would consolidate query handling into a service-level operation such as:

```js
getTasks({ status, page, limit })
```

This would provide one consistent path for filtering and pagination.

---

## Assignment Deliverables

This repository contains:

* Automated unit tests
* Automated integration tests
* Bug report with root-cause analysis
* Fixes for confirmed defects
* Implementation of `PATCH /tasks/:id/assign`
* Input validation and edge-case handling
* Test coverage results
* Documentation of design decisions

---

## Final Verification

The final implementation was verified with:

```bash
npm test -- --runInBand
```

and:

```bash
npm run coverage -- --runInBand
```

Final result:

```text
2 test suites passed
47 tests passed
97.41% statement coverage
98.85% branch coverage
93.33% function coverage
97.16% line coverage
```

The working tree was also verified with:

```bash
git diff --check
git status
```

with no whitespace errors and no uncommitted changes at the time of submission.