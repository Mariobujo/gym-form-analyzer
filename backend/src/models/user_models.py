"""
Modelos Pydantic para usuarios
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    height: Optional[float] = Field(None, ge=100, le=250)  # cm
    weight: Optional[float] = Field(None, ge=30, le=300)   # kg
    fitness_level: Optional[str] = Field("beginner", regex="^(beginner|intermediate|advanced)$")

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    fitness_level: str
    created_at: datetime
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse