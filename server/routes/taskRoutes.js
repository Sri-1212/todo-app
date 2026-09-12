const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Enforce JWT authentication middleware for all task routes
router.use(authenticateToken);

// 1. CREATE TASK: POST /api/tasks
router.post('/', async (req, res) => {
  const { title, completed } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  const isCompleted = completed ? true : false;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, completed) VALUES ($1, $2, $3) RETURNING *',
      [userId, title.trim(), isCompleted]
    );

    return res.status(201).json({
      message: 'Task created successfully.',
      task: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create task.', error: err.message });
  }
});

// 2. GET ALL TASKS FOR AUTHENTICATED USER: GET /api/tasks
router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return res.status(200).json({ tasks: result.rows || [] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch tasks.', error: err.message });
  }
});

// 3. GET SINGLE TASK BY ID: GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    const task = result.rows[0];
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    return res.status(200).json({ task });
  } catch (err) {
    return res.status(500).json({ message: 'Database error.', error: err.message });
  }
});

// 4. UPDATE TASK: PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const { title, completed } = req.body;

  try {
    const checkTask = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    const existingTask = checkTask.rows[0];
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    const updatedTitle = title !== undefined ? title.trim() : existingTask.title;
    const updatedCompleted = completed !== undefined ? (completed ? true : false) : existingTask.completed;

    if (updatedTitle === '') {
      return res.status(400).json({ message: 'Task title cannot be empty.' });
    }

    const updateResult = await pool.query(
      'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [updatedTitle, updatedCompleted, taskId, userId]
    );

    return res.status(200).json({
      message: 'Task updated successfully.',
      task: updateResult.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update task.', error: err.message });
  }
});

// 5. DELETE TASK: DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  try {
    const checkTask = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (checkTask.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    return res.status(200).json({ message: 'Task deleted successfully.', id: Number(taskId) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete task.', error: err.message });
  }
});

module.exports = router;
