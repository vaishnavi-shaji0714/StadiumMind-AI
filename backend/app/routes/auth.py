import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..config.config import settings
from ..config.database import get_db, User, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

# Helper to generate JWT token
def create_jwt_token(email: str, user_id: int) -> str:
    payload = {
        "sub": email,
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

# Helper to verify JWT token from cookie
def get_current_user_email(request: Request) -> str:
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session token"
            )
        return email
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )

@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    token = create_jwt_token(user.email, user.id)
    
    # Set secure HTTP-only cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=3600 * 24 * 7, # 7 days
        expires=3600 * 24 * 7,
        samesite="lax",
        secure=False # Set to False for local dev (http://localhost) so cookie works without HTTPS
    )
    
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email
        }
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="session_token",
        samesite="lax",
        httponly=True
    )
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/me")
def get_me(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email
        }
    }
