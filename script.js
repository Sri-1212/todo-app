/* ==========================================================================
   TaskFlow Application Logic (Vanilla JS + REST API Integration)
   ========================================================================== */

// Dynamic API URL matching the current host (127.0.0.1 or localhost)
const API_BASE_URL = `http://${window.location.hostname || 'localhost'}:5000/api`;

// Global Application State
const state = {
  token: localStorage.getItem('authToken') || null,
  user: null,
  tasks: [],
  filter: 'all', // 'all' | 'active' | 'completed'
  searchQuery: '',
  editingTaskId: null
};

// ==========================================================================
// 1. INITIALIZATION & EVENT LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (state.token) {
    loadApp();
  } else {
    showAuthView();
  }

  // Setup Event Delegation for Task Actions
  const taskListEl = document.getElementById('task-list');
  if (taskListEl) {
    taskListEl.addEventListener('click', (e) => {
      const item = e.target.closest('.task-item');
      if (!item) return;
      
      const taskId = Number(item.dataset.id);
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      if (e.target.closest('.task-checkbox')) {
        handleToggleComplete(taskId, task.completed);
      } else if (e.target.closest('.btn-icon.edit')) {
        openEditModal(task.id, task.title);
      } else if (e.target.closest('.btn-icon.delete')) {
        handleDeleteTask(task.id);
      }
    });
  }
});

function showAuthView() {
  document.getElementById('auth-view').classList.remove('hidden');
  document.getElementById('app-view').classList.add('hidden');
}

function showDashboardView() {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authSubtitle = document.getElementById('auth-subtitle');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authSubtitle.textContent = 'Welcome back! Please enter your details.';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authSubtitle.textContent = 'Create a new account to get started.';
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// 2. AUTHENTICATION HANDLERS
// ==========================================================================

// Login Handler
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const loginBtn = document.getElementById('login-btn');

  if (!email || !password) {
    showToast('Please enter both email and password.', 'error');
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Signing In...</span>';

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('authToken', data.token);

    showToast('Login successful!', 'success');
    document.getElementById('login-form').reset();
    loadApp();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Sign In</span>';
  }
}

// Register Handler
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const registerBtn = document.getElementById('register-btn');

  if (!username || !email || !password) {
    showToast('All fields are required.', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  try {
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span>Creating...</span>';

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed.');
    }

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('authToken', data.token);

    showToast('Account created successfully!', 'success');
    document.getElementById('register-form').reset();
    loadApp();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    registerBtn.disabled = false;
    registerBtn.innerHTML = '<span>Create Account</span>';
  }
}

// Logout Handler
function handleLogout() {
  state.token = null;
  state.user = null;
  state.tasks = [];
  localStorage.removeItem('authToken');
  showAuthView();
}

// ==========================================================================
// 3. DASHBOARD DATA & API INTEGRATION
// ==========================================================================

async function loadApp() {
  const isAuthenticated = await fetchUserProfile();
  if (isAuthenticated) {
    showDashboardView();
    await fetchTasks();
  }
}

// Fetch Logged-in User Profile
async function fetchUserProfile() {
  if (!state.token) {
    handleLogout();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (!response.ok) {
      handleLogout();
      return false;
    }

    const data = await response.json();
    state.user = data.user;

    document.getElementById('user-display-name').textContent = state.user.username;
    document.getElementById('user-avatar').textContent = state.user.username.charAt(0).toUpperCase();
    return true;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    handleLogout();
    return false;
  }
}

// Fetch All Tasks
async function fetchTasks() {
  const loadingEl = document.getElementById('tasks-loading');
  const listEl = document.getElementById('task-list');
  const emptyEl = document.getElementById('tasks-empty');

  try {
    loadingEl.classList.remove('hidden');
    listEl.innerHTML = '';
    emptyEl.classList.add('hidden');

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (response.status === 401 || response.status === 403) {
      handleLogout();
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch tasks.');
    }

    const data = await response.json();
    state.tasks = data.tasks || [];
    renderTasks();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Add New Task
async function handleAddTask(e) {
  e.preventDefault();
  const inputEl = document.getElementById('new-task-title');
  const title = inputEl.value.trim();

  if (!title) return;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ title })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not create task.');
    }

    state.tasks.unshift(data.task);
    inputEl.value = '';
    showToast('Task created successfully!', 'success');
    renderTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Toggle Task Completion Status
async function handleToggleComplete(taskId, currentStatus) {
  const isCompleted = currentStatus === 1 || currentStatus === true;
  const newStatus = !isCompleted;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ completed: newStatus })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not update task status.');
    }

    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      state.tasks[taskIndex].completed = newStatus ? 1 : 0;
    }

    renderTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Delete Task
async function handleDeleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not delete task.');
    }

    state.tasks = state.tasks.filter(t => t.id !== taskId);
    showToast('Task deleted successfully.', 'info');
    renderTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Open Edit Task Modal
function openEditModal(taskId, currentTitle) {
  state.editingTaskId = taskId;
  document.getElementById('edit-task-title').value = currentTitle;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  state.editingTaskId = null;
  document.getElementById('edit-modal').classList.add('hidden');
}

// Save Edited Task Title
async function handleSaveEdit(e) {
  e.preventDefault();
  if (!state.editingTaskId) return;

  const newTitle = document.getElementById('edit-task-title').value.trim();
  if (!newTitle) {
    showToast('Task title cannot be empty.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${state.editingTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ title: newTitle })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not save task update.');
    }

    const taskIndex = state.tasks.findIndex(t => t.id === state.editingTaskId);
    if (taskIndex !== -1) {
      state.tasks[taskIndex].title = newTitle;
    }

    showToast('Task updated successfully!', 'success');
    closeEditModal();
    renderTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==========================================================================
// 4. RENDERING & UI FILTERS
// ==========================================================================

function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTasks();
}

function handleSearch(e) {
  state.searchQuery = e.target.value.toLowerCase().trim();
  renderTasks();
}

function renderTasks() {
  const listEl = document.getElementById('task-list');
  const emptyEl = document.getElementById('tasks-empty');

  // Stats Calculations
  const totalCount = state.tasks.length;
  const completedCount = state.tasks.filter(t => t.completed === 1 || t.completed === true).length;
  const pendingCount = totalCount - completedCount;

  document.getElementById('stat-total').textContent = totalCount;
  document.getElementById('stat-pending').textContent = pendingCount;
  document.getElementById('stat-completed').textContent = completedCount;

  // Filter Tasks
  let filteredTasks = state.tasks.filter(task => {
    const isCompleted = task.completed === 1 || task.completed === true;
    if (state.filter === 'active') return !isCompleted;
    if (state.filter === 'completed') return isCompleted;
    return true;
  });

  // Apply Search Query
  if (state.searchQuery) {
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(state.searchQuery)
    );
  }

  // Handle Empty State
  if (filteredTasks.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');

    if (state.searchQuery) {
      document.getElementById('empty-title').textContent = 'No matching tasks';
      document.getElementById('empty-desc').textContent = `No tasks found matching "${state.searchQuery}".`;
    } else if (state.filter !== 'all') {
      document.getElementById('empty-title').textContent = `No ${state.filter} tasks`;
      document.getElementById('empty-desc').textContent = `You have no tasks marked as ${state.filter}.`;
    } else {
      document.getElementById('empty-title').textContent = 'No tasks yet';
      document.getElementById('empty-desc').textContent = 'Add your first task above to get organized!';
    }
    return;
  }

  emptyEl.classList.add('hidden');

  listEl.innerHTML = filteredTasks.map(task => {
    const isCompleted = task.completed === 1 || task.completed === true;
    const formattedDate = formatDate(task.created_at);

    return `
      <li class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-left">
          <div class="task-checkbox ${isCompleted ? 'checked' : ''}" title="Toggle Complete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="task-content">
            <span class="task-title">${escapeHTML(task.title)}</span>
            <span class="task-date">${formattedDate}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon edit" title="Edit Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon delete" title="Delete Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </li>
    `;
  }).join('');
}

// Helpers
function formatDate(dateStr) {
  if (!dateStr) return 'Just now';
  const isoStr = (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T'))
    ? dateStr.replace(' ', 'T') + 'Z'
    : dateStr;
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}