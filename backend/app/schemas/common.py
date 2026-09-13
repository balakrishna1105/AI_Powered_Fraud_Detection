from datetime import datetime, timezone
from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel

def utcnow():
    return datetime.now(timezone.utc)

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[Any] = None
    timestamp: datetime = utcnow()

class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginatedResponse(APIResponse[PaginatedData[T]], Generic[T]):
    pass
