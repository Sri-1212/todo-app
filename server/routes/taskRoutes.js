const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Enforce JWT authentication middleware for all task routes
router.use(authenticateToken);

// 1. CREATE TASK: POST /api/tasks
router.post('/', (req, res) => {
  const { title, completed } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  const isCompleted = completed ? 1 : 0;
  const userId = req.user.id;

  db.run(
    'INSERT INTO tasks (user_id, title, completed) VALUES (?, ?, ?)',
    [userId, title.trim(), isCompleted],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to create task.', error: err.message });
      }

      db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (getErr, newTask) => {
        if (getErr) {
          return res.status(201).json({
            message: 'Task created successfully.',
            task: { id: this.lastID, user_id: userId, title: title.trim(), completed: isCompleted }
          });
        }
        return res.status(201).json({ message: 'Task created successfully.', task: newTask });
      });
    }
  );
});

// 2. GET ALL TASKS FOR AUTHENTICATED USER: GET /api/tasks
router.get('/', (req, res) => {
  const userId = req.user.id;

  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, tasks) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch tasks.', error: err.message });
    }
    return res.status(200).json({ tasks: tasks || [] });
  });
});

// 3. GET SINGLE TASK BY ID: GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }
    return res.status(200).json({ task });
  });
});

// 4. UPDATE TASK: PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const { title, completed } = req.body;

  // Verify task exists and belongs to authenticated user
  db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    const updatedTitle = title !== undefined ? title.trim() : task.title;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : task.completed;

    if (updatedTitle === '') {
      return res.status(400).json({ message: 'Task title cannot be empty.' });
    }

    db.run(
      'UPDATE tasks SET title = ?, completed = ? WHERE id = ? AND user_id = ?',
      [updatedTitle, updatedCompleted, taskId, userId],
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ message: 'Failed to update task.', error: updateErr.message });
        }

        db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (fetchErr, updatedTask) => {
          return res.status(200).json({
            message: 'Task updated successfully.',
            task: updatedTask || { id: Number(taskId), user_id: userId, title: updatedTitle, completed: updatedCompleted }
          });
        });
      }
    );
  });
});

// 5. DELETE TASK: DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  // Verify task exists and belongs to authenticated user
  db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], function (deleteErr) {
      if (deleteErr) {
        return res.status(500).json({ message: 'Failed to delete task.', error: deleteErr.message });
      }
      return res.status(200).json({ message: 'Task deleted successfully.', id: Number(taskId) });
    });
  });
});

module.exports = router;
