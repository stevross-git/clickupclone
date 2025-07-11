from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    projects = relationship("Project", back_populates="workspace")
    members = relationship("WorkspaceMember", back_populates="workspace")
