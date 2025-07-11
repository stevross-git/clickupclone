from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from datetime import date

from app.schemas.task import Task, TaskBase, TaskWithDependencies, TaskLink
from app.api import deps

router = APIRouter()

FAKE_TASKS = [
    Task(
        id=1,
        title="First Task",
        description="Test",
        status="open",
        priority="medium",
        due_date=date.today(),
    ),
    Task(
        id=2,
        title="Second Task",
        description="Another",
        status="done",
        priority="high",
        due_date=None,
    ),
]
_next_id = 3
FAKE_DEPENDENCIES: Dict[int, Dict[str, List[TaskLink]]] = {}

@router.get("/", response_model=List[Task])
def get_tasks(current_user=Depends(deps.get_current_active_user)):
    return FAKE_TASKS


@router.post("/", response_model=Task)
def create_task(
    task_in: TaskBase, current_user=Depends(deps.get_current_active_user)
):
    global _next_id
    new_task = Task(id=_next_id, **task_in.dict())
    _next_id += 1
    FAKE_TASKS.append(new_task)
    return new_task


@router.put("/{task_id}", response_model=Task)
def update_task(
    task_id: int, task_in: TaskBase, current_user=Depends(deps.get_current_active_user)
):
    for idx, t in enumerate(FAKE_TASKS):
        if t.id == task_id:
            updated = Task(id=task_id, **task_in.dict())
            FAKE_TASKS[idx] = updated
            return updated
    raise HTTPException(status_code=404, detail="Task not found")


@router.delete("/{task_id}", response_model=Task)
def delete_task(task_id: int, current_user=Depends(deps.get_current_active_user)):
    for idx, t in enumerate(FAKE_TASKS):
        if t.id == task_id:
            return FAKE_TASKS.pop(idx)
    raise HTTPException(status_code=404, detail="Task not found")


def _get_task(task_id: int) -> Task | None:
    for t in FAKE_TASKS:
        if t.id == task_id:
            return t
    return None


def _get_task_with_deps(task_id: int) -> TaskWithDependencies | None:
    task = _get_task(task_id)
    if not task:
        return None
    deps = FAKE_DEPENDENCIES.get(task_id, {"successors": [], "predecessors": []})
    return TaskWithDependencies(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        due_date=task.due_date,
        successors=deps.get("successors", []),
        predecessors=deps.get("predecessors", []),
    )


@router.get("/{task_id}/dependencies", response_model=TaskWithDependencies)
def get_dependencies(task_id: int, current_user=Depends(deps.get_current_active_user)):
    result = _get_task_with_deps(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


@router.post("/{task_id}/dependencies/{depends_on_id}", response_model=TaskWithDependencies)
def add_dependency(
    task_id: int,
    depends_on_id: int,
    current_user=Depends(deps.get_current_active_user),
):
    if task_id == depends_on_id:
        raise HTTPException(status_code=400, detail="Task cannot depend on itself")
    task = _get_task(task_id)
    depends_on = _get_task(depends_on_id)
    if not task or not depends_on:
        raise HTTPException(status_code=404, detail="Task not found")

    deps = FAKE_DEPENDENCIES.setdefault(task_id, {"successors": [], "predecessors": []})
    link = TaskLink(id=depends_on.id, title=depends_on.title)
    if link not in deps["predecessors"]:
        deps["predecessors"].append(link)

    reverse = FAKE_DEPENDENCIES.setdefault(depends_on_id, {"successors": [], "predecessors": []})
    back_link = TaskLink(id=task.id, title=task.title)
    if back_link not in reverse["successors"]:
        reverse["successors"].append(back_link)

    return _get_task_with_deps(task_id)


@router.delete("/{task_id}/dependencies/{depends_on_id}", response_model=TaskWithDependencies)
def remove_dependency(
    task_id: int,
    depends_on_id: int,
    current_user=Depends(deps.get_current_active_user),
):
    task = _get_task(task_id)
    depends_on = _get_task(depends_on_id)
    if not task or not depends_on:
        raise HTTPException(status_code=404, detail="Task not found")

    deps = FAKE_DEPENDENCIES.get(task_id)
    if deps:
        deps["predecessors"] = [d for d in deps["predecessors"] if d.id != depends_on_id]
    reverse = FAKE_DEPENDENCIES.get(depends_on_id)
    if reverse:
        reverse["successors"] = [d for d in reverse["successors"] if d.id != task_id]

    return _get_task_with_deps(task_id)
