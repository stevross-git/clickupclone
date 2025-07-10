from fastapi import FastAPI

from .api.api_v1.api import api_router

app = FastAPI(title="ClickUp Clone")

app.include_router(api_router, prefix="/api/v1")
