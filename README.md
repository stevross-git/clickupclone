# ClickUp Clone Skeleton

This repository contains a minimal skeleton for a ClickUp-like application. The backend now exposes simple task CRUD endpoints (create, update, delete) with optional due dates and the frontend includes a minimal task list and calendar view. Task dependencies can be managed via dedicated API routes.

## Backend
- FastAPI app located in `backend/app` with placeholder authentication and task endpoints.
- Install dependencies using `pip install -r backend/requirements.txt`.
- Tasks include a `due_date` field so they can appear in the calendar.
- New `/tasks/{task_id}/dependencies` routes allow adding or removing task dependencies.
- Tasks now support a `priority` value (`low`, `medium`, `high`, `urgent`).

- Optional `tag` query parameter filters tasks by tag. Tasks can have a `tags` list.

## Frontend
- React application under `frontend/src` demonstrating login, protected routes, list and calendar views.

This code is a lightweight starting point that can be expanded with full database models and advanced features.
