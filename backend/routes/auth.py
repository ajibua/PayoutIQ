import os
import jwt
import bcrypt
import logging
import httpx
import secrets
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
from models import User
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = "payoutiq-super-secret-key-for-jwt"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# OAuth Environment Configurations
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

# Schemas
class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    email: EmailStr
    password: str
    confirm_password: str
    organization_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def generate_pkce_pair() -> tuple:
    # 64 random bytes URL-safe base64 encoded (around 86 characters)
    verifier = secrets.token_urlsafe(64)
    # S256 challenge
    sha256_hash = hashlib.sha256(verifier.encode('utf-8')).digest()
    challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8').replace('=', '')
    return verifier, challenge

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Email/Password Routes
@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="An account with this email already exists."
        )

    hashed = hash_password(payload.password)
    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        middle_name=payload.middle_name,
        email=payload.email,
        password_hash=hashed,
        organization_name=payload.organization_name
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    user_data = {
        "sub": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "middle_name": user.middle_name
    }
    token = create_access_token(data=user_data)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )

    user_data = {
        "sub": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "middle_name": user.middle_name
    }
    token = create_access_token(data=user_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

# helper to check / save user
def register_oauth_user(email: str, first_name: str, last_name: str, org: str, db: Session) -> str:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash=hash_password("oauth-dummy-hashed-pass"),
            first_name=first_name,
            last_name=last_name,
            organization_name=org
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    user_data = {
        "sub": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "middle_name": user.middle_name
    }
    return create_access_token(data=user_data)

# --- 1. GOOGLE OAUTH ---
@router.get("/google/login")
def google_login(state: Optional[str] = None):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=501,
            detail="Google Social Login is not configured on this server. Please set GOOGLE_CLIENT_ID in your .env file."
        )
    
    verifier, challenge = generate_pkce_pair()
    
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code"
        f"&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&scope=openid%20profile%20email"
        f"&code_challenge={challenge}"
        f"&code_challenge_method=S256"
    )
    if state:
        url += f"&state={state}"
        
    response = RedirectResponse(url)
    
    # Securely store code_verifier in an HTTP-only cookie
    is_secure = FRONTEND_URL.lower().startswith("https://")
    response.set_cookie(
        key="pkce_verifier",
        value=verifier,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=600  # 10 minutes expiry
    )
    return response

@router.get("/google/callback")
async def google_callback(
    code: str, 
    request: Request,
    state: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google Social Login is not configured on this server.")
        
    pkce_verifier = request.cookies.get("pkce_verifier")
    if not pkce_verifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PKCE verification failed: Missing code_verifier session cookie. Please try logging in again."
        )
        
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Exchange token, passing the code_verifier
            t_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code_verifier": pkce_verifier
                }
            )
            t_data = t_res.json()
            acc_token = t_data.get("access_token")
            
            if not acc_token:
                raise HTTPException(status_code=400, detail=f"Google OAuth token exchange failed: {t_data.get('error_description', 'No access token returned')}")
            
            # Fetch profile
            p_res = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {acc_token}"}
            )
            p_data = p_res.json()
            email = p_data.get("email")
            first_name = p_data.get("given_name", "Google")
            last_name = p_data.get("family_name", "User")
            
            if not email:
                raise HTTPException(status_code=400, detail="Failed to retrieve email address from Google profile data")
                
            jwt_token = register_oauth_user(email, first_name, last_name, "Google Organization", db)
            
            # Resolve and validate target redirect URL
            target_frontend = FRONTEND_URL
            if state:
                state_clean = state.strip().rstrip('/')
                allowed_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
                allowed_origins = [FRONTEND_URL.strip().rstrip('/')]
                if allowed_origins_env:
                    allowed_origins.extend([o.strip().rstrip('/') for o in allowed_origins_env.split(",") if o.strip()])
                
                # Trust standard local addresses and configured domains
                if any(state_clean.startswith(o) for o in allowed_origins) or "localhost" in state_clean or "127.0.0.1" in state_clean:
                    target_frontend = state_clean

            target_frontend = target_frontend.strip().rstrip('/')
            
            response = RedirectResponse(f"{target_frontend}/#token={jwt_token}")
            # Clean up verifier cookie
            response.delete_cookie(key="pkce_verifier")
            return response
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google Callback Error: {type(e).__name__}: {e!r}")
        raise HTTPException(status_code=502, detail=f"Google authentication failed:  {type(e).__name__}")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "middle_name": current_user.middle_name,
        "organization_name": current_user.organization_name
    }
