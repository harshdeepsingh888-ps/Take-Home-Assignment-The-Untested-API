# The Untested API — Take-Home Assignment

A small Express.js Task Manager API used as a code-reading, testing, debugging, and feature-development exercise.

The goal of this submission was to understand an unfamiliar codebase, build confidence through automated tests, identify and fix defects, and implement a small API feature.

> See [ASSIGNMENT.md](./ASSIGNMENT.md) for the original assignment brief.

---

## Submission Summary

### Completed

- Added comprehensive unit tests for the task service
- Added integration tests for all HTTP endpoints
- Identified and fixed 3 confirmed bugs
- Implemented `PATCH /tasks/:id/assign`
- Added validation and edge-case handling for task assignment
- Documented discovered bugs and their fixes
- Achieved high automated test coverage

### Test Results

| Metric | Result |
|---|---:|
| Test Suites | 2 passed |
| Tests | **47 passed** |
| Statement Coverage | **97.41%** |
| Branch Coverage | **98.85%** |
| Function Coverage | **93.33%** |
| Line Coverage | **97.16%** |

---

## Project Overview

The project is a small REST API for managing tasks.

The API uses:

- Node.js
- Express
- Jest
- Supertest
- In-memory data storage

The data store resets whenever the application restarts.

---

## Getting Started

### Prerequisites

- Node.js 18+

### Install dependencies

```bash
cd task-api
npm install