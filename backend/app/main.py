from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.api_v1.api import api_router
from .db.session import engine
from .db.base import Base
from . import models  # noqa

app = FastAPI(title="ClickUp Clone")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
