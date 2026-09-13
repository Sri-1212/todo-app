# Task Management Application

A full-stack Task Management web application featuring secure user authentication, user authorization, SQLite data persistence, a RESTful API backend, and a modern responsive dashboard frontend.

---
LIVE DEMO :  todo-app-three-theta-89.vercel.app

## Features

- User Authentication: Secure user registration and login using hashed passwords and JSON Web Tokens (JWT).
- User Authorization: Protected routes and SQL query-level isolation ensuring users can only access and modify their own tasks.
- Task Management (CRUD): Create, view, update, toggle completion status, and delete tasks.
- Task Filters & Search: Instant filtering by status (All, Active, Completed) and search keyword matching.
- Real-time Dashboard Metrics: Summary cards displaying total, active, and completed task counts.
- Responsive UI: Built with vanilla HTML5, CSS custom properties, and JavaScript for desktop and mobile viewports.
- Error Handling & Notifications: Feedback via toast notifications and empty/loading states.

---

## Tech Stack

### Backend
- Node.js
- Express.js
- SQLite3 (Local relational database)
- JSON Web Token (jsonwebtoken)
- bcryptjs (Password hashing)
- CORS & dotenv

### Frontend
- HTML5
- Vanilla CSS3 (Custom Properties & Glassmorphism UI)
- JavaScript (ES6+ Fetch API)

---

## Project Structure

```text
todo-app/
├── index.html          # Main application HTML structure
├── style.css           # Global stylesheet and responsive design rules
├── script.js           # Frontend client logic and API interactions
├── README.md           # Project documentation
├── .gitignore          # Git ignore rules for root
└── server/             # Backend Node.js Express server
    ├── server.js       # Main server entry point
    ├── .env            # Environment configuration (local)
    ├── .env.example    # Environment configuration template
    ├── database.sqlite # SQLite database file (generated at runtime)
    ├── config/
    │   └── db.js       # SQLite database connection & schema initialization
    ├── middleware/
    │   └── auth.js     # JWT verification middleware
    └── routes/
        ├── authRoutes.js # Authentication API routes (/api/auth)
        └── taskRoutes.js # Task CRUD API routes (/api/tasks)
```

---

## Authentication and Authorization

1. Password Hashing: User passwords are encrypted using `bcryptjs` with a salt factor of 10 prior to database insertion.
2. Token Generation: Upon successful authentication, the backend issues a signed JWT token valid for 24 hours.
3. Protected Endpoints: Backend endpoints require an `Authorization: Bearer <token>` HTTP header.
4. User Data Isolation: Database operations enforce authorization by constraining queries with `WHERE user_id = req.user.id`.

---

## REST API Endpoints

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | Public | Register a new user (`username`, `email`, `password`) |
| POST | `/api/auth/login` | Public | Authenticate user credentials and return a JWT token |
| GET | `/api/auth/me` | Protected | Fetch current logged-in user profile |

### Task Endpoints (`/api/tasks`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/tasks` | Protected | Fetch all tasks for the authenticated user |
| POST | `/api/tasks` | Protected | Create a new task (`title`, `completed` optional) |
| GET | `/api/tasks/:id` | Protected | Fetch a single task by ID |
| PUT | `/api/tasks/:id` | Protected | Update task title or completed status |
| DELETE | `/api/tasks/:id` | Protected | Delete a task by ID |

---

## Database Information

The application uses SQLite3 stored in `server/database.sqlite`. Database tables are created automatically on server startup:

### Users Table (`users`)
- `id` (INTEGER, Primary Key, Auto Increment)
- `username` (TEXT, Unique, Not Null)
- `email` (TEXT, Unique, Not Null)
- `password` (TEXT, Not Null)
- `created_at` (DATETIME, Default: CURRENT_TIMESTAMP)

### Tasks Table (`tasks`)
- `id` (INTEGER, Primary Key, Auto Increment)
- `user_id` (INTEGER, Foreign Key -> `users.id`)
- `title` (TEXT, Not Null)
- `completed` (INTEGER, Default: 0)
- `created_at` (DATETIME, Default: CURRENT_TIMESTAMP)

---

## Environment Variables

Create a `.env` file in the `server` directory based on `.env.example`:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
```

---

## How to Run the Application

### 1. Backend Setup

Navigate to the `server` directory, install dependencies, and start the server:

```bash
cd server
npm install
npm run dev
# or: node server.js
```

The backend server will run on `http://localhost:5000`.

### 2. Frontend Setup

Serve `index.html` using any local HTTP server (such as Live Server in VS Code, Python HTTP server, or http-server):

```bash
# Example using Python
python -m http.server 5500
```

Open your browser and navigate to `http://localhost:5500`.

---

## Basic Usage

1. Open the application in your browser.
2. Click "Create Account" to register a new user account or "Sign In" with existing credentials.
3. Create tasks using the input field at the top of the dashboard.
4. Toggle completion by clicking the checkbox next to a task.
5. Edit a task title by clicking the edit icon, or delete a task using the trash icon.
6. Filter tasks using the status buttons (All, Active, Completed) or search by keyword using the search bar.
7. Click "Logout" in the header to terminate the session.

---

## Future Improvements

- Task priority tags and due date reminders.
- Password reset functionality.
- Dark / light theme toggle button.
- Pagination for large task lists.
- WebSocket or SSE integration for real-time multi-device synchronization.
