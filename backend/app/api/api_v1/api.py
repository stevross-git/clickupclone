from fastapi import APIRouter

from .endpoints import auth, tasks, workspaces, projects, comments, ws, activity, workspace_members

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
api_router.include_router(ws.router, prefix="/ws", tags=["ws"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(workspace_members.router, prefix="/workspaces", tags=["workspace-members"])
