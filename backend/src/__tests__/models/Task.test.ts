import Task from '../../models/Task';
import User from '../../models/User';

describe('Task Model', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create a test user
    testUser = new User({
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      name: 'Test User',
    });
    await testUser.save();
  });

  it('should create a task with required fields', async () => {
    const taskData = {
      plan_id: 'test-plan',
      title: 'Test Task',
      status: 'todo',
      created_by: testUser._id,
      updated_by: testUser._id,
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    expect(savedTask._id).toBeDefined();
    expect(savedTask.title).toBe('Test Task');
    expect(savedTask.status).toBe('todo');
    expect(savedTask.plan_id).toBe('test-plan');
    expect(savedTask.created_by.toString()).toBe(testUser._id.toString());
  });

  it('should validate required fields', async () => {
    const task = new Task({});

    try {
      await task.save();
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.errors.plan_id).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.status).toBeDefined();
      expect(error.errors.created_by).toBeDefined();
      expect(error.errors.updated_by).toBeDefined();
    }
  });

  it('should validate status enum', async () => {
    const task = new Task({
      plan_id: 'test-plan',
      title: 'Test Task',
      status: 'invalid-status',
      created_by: testUser._id,
      updated_by: testUser._id,
    });

    try {
      await task.save();
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.errors.status).toBeDefined();
    }
  });

  it('should validate priority enum', async () => {
    const task = new Task({
      plan_id: 'test-plan',
      title: 'Test Task',
      status: 'todo',
      priority: 'invalid-priority',
      created_by: testUser._id,
      updated_by: testUser._id,
    });

    try {
      await task.save();
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.errors.priority).toBeDefined();
    }
  });

  it('should validate progress_pct range', async () => {
    const task = new Task({
      plan_id: 'test-plan',
      title: 'Test Task',
      status: 'todo',
      progress_pct: 150, // Invalid: > 100
      created_by: testUser._id,
      updated_by: testUser._id,
    });

    try {
      await task.save();
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.errors.progress_pct).toBeDefined();
    }
  });

  it('should create task with all optional fields', async () => {
    const taskData = {
      plan_id: 'test-plan',
      title: 'Complete Task',
      description: 'This is a test task',
      status: 'in_progress',
      priority: 'high',
      assignee_ids: [testUser._id],
      start_date: '2024-01-01',
      due_date: '2024-01-31',
      progress_pct: 50,
      tags: ['frontend', 'react'],
      estimate_hours: 8,
      order_index: 1,
      created_by: testUser._id,
      updated_by: testUser._id,
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    expect(savedTask.title).toBe('Complete Task');
    expect(savedTask.description).toBe('This is a test task');
    expect(savedTask.status).toBe('in_progress');
    expect(savedTask.priority).toBe('high');
    expect(savedTask.progress_pct).toBe(50);
    expect(savedTask.tags).toEqual(['frontend', 'react']);
    expect(savedTask.estimate_hours).toBe(8);
  });
});

