const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    it('should return 200 and an empty array initially', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should list all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should filter tasks by status', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Task 1');
    });

    it('should paginate task results starting from page 1', async () => {
      for (let i = 1; i <= 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const res = await request(app).get('/tasks?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(10);
      expect(res.body[0].title).toBe('Task 1');

      const resPage2 = await request(app).get('/tasks?page=2&limit=10');
      expect(resPage2.status).toBe(200);
      expect(resPage2.body.length).toBe(5);
      expect(resPage2.body[0].title).toBe('Task 11');
    });

    it('should handle invalid page and limit string inputs gracefully', async () => {
      taskService.create({ title: 'Task 1' });

      const res = await request(app).get('/tasks?page=invalid&limit=invalid');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return 200 and stats summary', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done' });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1,
        overdue: 0,
      });
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task with 201 Created', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'New Integration Task', priority: 'high' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('New Integration Task');
      expect(res.body.priority).toBe('high');
      expect(res.body.status).toBe('todo');
    });

    it('should return 400 if title is missing or empty', async () => {
      const resMissing = await request(app).post('/tasks').send({});
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error).toMatch(/title is required/);

      const resEmpty = await request(app).post('/tasks').send({ title: '   ' });
      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.error).toMatch(/title is required/);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Valid Title', status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/status must be one of/);
    });

    it('should return 400 for invalid priority', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Valid Title', priority: 'urgent' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority must be one of/);
    });

    it('should return 400 for invalid dueDate', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Valid Title', dueDate: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/dueDate must be a valid ISO date string/);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update an existing task with 200 OK', async () => {
      const task = taskService.create({ title: 'Initial Title' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'Updated Title', status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 404 for non-existent task ID', async () => {
      const res = await request(app)
        .put('/tasks/non-existent-id')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should return 400 if updated title is empty', async () => {
      const task = taskService.create({ title: 'Initial Title' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/title must be a non-empty string/);
    });

    it('should return 400 if updated status is invalid', async () => {
      const task = taskService.create({ title: 'Initial Title' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/status must be one of/);
    });

    it('should return 400 if updated priority is invalid', async () => {
      const task = taskService.create({ title: 'Initial Title' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ priority: 'super_high' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority must be one of/);
    });

    it('should return 400 if updated dueDate is invalid', async () => {
      const task = taskService.create({ title: 'Initial Title' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ dueDate: 'invalid-date' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/dueDate must be a valid ISO date string/);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete an existing task and return 204 No Content', async () => {
      const task = taskService.create({ title: 'Task to Delete' });

      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);

      const getRes = await request(app).get('/tasks');
      expect(getRes.body.length).toBe(0);
    });

    it('should return 404 for non-existent task ID', async () => {
      const res = await request(app).delete('/tasks/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark an existing task as completed', async () => {
      const task = taskService.create({ title: 'Complete Me', priority: 'high' });

      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).toBeDefined();
      expect(res.body.priority).toBe('high'); // Ensures priority was not reset
    });

    it('should return 404 for non-existent task ID', async () => {
      const res = await request(app).patch('/tasks/non-existent-id/complete');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should assign a task to a user and return 200 OK', async () => {
      const task = taskService.create({ title: 'Task for Assignee' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Bob Smith' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
      expect(res.body.assignee).toBe('Bob Smith');
    });

    it('should return 400 if assignee is missing or empty', async () => {
      const task = taskService.create({ title: 'Task for Assignee' });

      const resMissing = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({});
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error).toMatch(/assignee is required/);

      const resEmpty = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '   ' });
      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.error).toMatch(/assignee is required/);
    });

    it('should return 404 for non-existent task ID', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'Bob Smith' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
it('should return 400 if assignee is not a string', async () => {
  const task = taskService.create({ title: 'Task for Assignee' });

  const res = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({ assignee: 123 });

  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/assignee is required/);
});
it('should allow reassignment of an existing task', async () => {
  const task = taskService.create({ title: 'Reassignable Task' });

  const firstAssignment = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({ assignee: 'Alice' });

  expect(firstAssignment.status).toBe(200);
  expect(firstAssignment.body.assignee).toBe('Alice');

  const reassignment = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({ assignee: 'Bob' });

  expect(reassignment.status).toBe(200);
  expect(reassignment.body.assignee).toBe('Bob');
});
  });
});
