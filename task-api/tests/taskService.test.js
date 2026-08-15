const taskService = require('../src/services/taskService');

describe('taskService Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create()', () => {
    it('should create a task with default values', () => {
      const task = taskService.create({ title: 'Test Task' });

      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
      expect(new Date(task.createdAt).getTime()).not.toBeNaN();
    });

    it('should create a task with custom fields', () => {
      const dueDate = new Date('2026-12-31').toISOString();
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Detailed description',
        status: 'in_progress',
        priority: 'high',
        dueDate,
      });

      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Detailed description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });
  });

  describe('getAll()', () => {
    it('should return an empty array when no tasks exist', () => {
      const tasks = taskService.getAll();
      expect(tasks).toEqual([]);
    });

    it('should return a copy of all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const tasks = taskService.getAll();
      expect(tasks.length).toBe(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');

      // Ensure returning a copy doesn't mutate internal state
      tasks.pop();
      expect(taskService.getAll().length).toBe(2);
    });
  });

  describe('findById()', () => {
    it('should find an existing task by id', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent id', () => {
      const found = taskService.findById('non-existent-uuid');
      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus()', () => {
    it('should filter tasks by exact status', () => {
      taskService.create({ title: 'Todo Task', status: 'todo' });
      taskService.create({ title: 'In Progress Task', status: 'in_progress' });
      taskService.create({ title: 'Done Task', status: 'done' });

      const todos = taskService.getByStatus('todo');
      expect(todos.length).toBe(1);
      expect(todos[0].title).toBe('Todo Task');
    });

    it('should NOT match partial status substrings (bug fix verification)', () => {
      taskService.create({ title: 'Todo Task', status: 'todo' });
      taskService.create({ title: 'Done Task', status: 'done' });

      // Substring 'do' should not match 'todo' or 'done'
      const partialMatches = taskService.getByStatus('do');
      expect(partialMatches).toEqual([]);
    });
  });

  describe('getPaginated()', () => {
    beforeEach(() => {
      for (let i = 1; i <= 25; i++) {
        taskService.create({ title: `Task ${i}` });
      }
    });

    it('should return page 1 correctly starting from the first item (bug fix verification)', () => {
      const page1 = taskService.getPaginated(1, 10);
      expect(page1.length).toBe(10);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[9].title).toBe('Task 10');
    });

    it('should return page 2 correctly', () => {
      const page2 = taskService.getPaginated(2, 10);
      expect(page2.length).toBe(10);
      expect(page2[0].title).toBe('Task 11');
      expect(page2[9].title).toBe('Task 20');
    });

    it('should return partial page 3', () => {
      const page3 = taskService.getPaginated(3, 10);
      expect(page3.length).toBe(5);
      expect(page3[0].title).toBe('Task 21');
      expect(page3[4].title).toBe('Task 25');
    });

    it('should handle page number less than 1 by defaulting to page 1', () => {
      const page0 = taskService.getPaginated(0, 5);
      expect(page0.length).toBe(5);
      expect(page0[0].title).toBe('Task 1');
    });
  });

  describe('getStats()', () => {
    it('should calculate counts by status and overdue count', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      taskService.create({ title: 'Overdue Todo', status: 'todo', dueDate: yesterday });
      taskService.create({ title: 'Future Todo', status: 'todo', dueDate: tomorrow });
      taskService.create({ title: 'In Progress Task', status: 'in_progress', dueDate: yesterday });
      taskService.create({ title: 'Completed Overdue', status: 'done', dueDate: yesterday });
      taskService.create({ title: 'Custom Status Task', status: 'custom_unknown' });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(2); // Overdue todo and overdue in_progress, completed is ignored
    });
  });

  describe('update()', () => {
    it('should update task fields', () => {
      const task = taskService.create({ title: 'Original Title', priority: 'low' });
      const updated = taskService.update(task.id, { title: 'Updated Title', priority: 'high' });

      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe('high');
      expect(taskService.findById(task.id).title).toBe('Updated Title');
    });

    it('should return null when updating a non-existent task', () => {
      const result = taskService.update('non-existent-id', { title: 'New Title' });
      expect(result).toBeNull();
    });
  });

  describe('remove()', () => {
    it('should delete an existing task', () => {
      const task = taskService.create({ title: 'To Delete' });
      const success = taskService.remove(task.id);

      expect(success).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return false when deleting a non-existent task', () => {
      const success = taskService.remove('non-existent-id');
      expect(success).toBe(false);
    });
  });

  describe('completeTask()', () => {
    it('should mark task as done and set completedAt while preserving priority (bug fix verification)', () => {
      const task = taskService.create({ title: 'High Priority Task', priority: 'high', status: 'todo' });
      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();
      expect(new Date(completed.completedAt).getTime()).not.toBeNaN();
      expect(completed.priority).toBe('high'); // Priority should NOT be reset to medium
    });

    it('should return null when completing a non-existent task', () => {
      const result = taskService.completeTask('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('assignTask()', () => {
    it('should assign a user to a task and trim whitespace', () => {
      const task = taskService.create({ title: 'Task to Assign' });
      const assigned = taskService.assignTask(task.id, '  John Doe  ');

      expect(assigned.assignee).toBe('John Doe');
      expect(taskService.findById(task.id).assignee).toBe('John Doe');
    });

    it('should return null when assigning a non-existent task', () => {
      const result = taskService.assignTask('non-existent-id', 'John Doe');
      expect(result).toBeNull();
    });
  });
});
