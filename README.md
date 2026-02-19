# Staff Management App

A web app for managing staff, salaries, and hours with role-based access (Managers and Employees).

## Features

- **Staff directory & pay** – Managers see full staff list with salary and can add staff; employees see name/role/email only (no pay).
- **Login** – Staff log in with email and password (JWT).
- **My Hours** – All staff can log their own hours and see status (Pending / Approved / Disapproved).
- **Manage hours** – Managers see all hours, get a notification for pending entries, and can approve or disapprove.

## Tech stack

- **Frontend:** React, React Router, Axios, Tailwind
- **Backend:** Node.js, Express, JWT, bcryptjs
- **Data:** In-memory (no database)

## Setup

1. **Backend**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Server runs at http://localhost:5000.

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   App runs at http://localhost:3000.

3. **Demo logins** (default password: `password123`)
   - Manager: `alice@example.com`
   - Employee: `bob@example.com` or `charlie@example.com`

## Optional: environment

- Backend: create `backend/.env` with `PORT=5000` and `JWT_SECRET=your-secret` for production.
