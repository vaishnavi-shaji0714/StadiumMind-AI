import time
import json
import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from .config.config import get_frontend_origins
from .config.database import init_db
from .routes import auth, chat

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StadiumMindBackend")

app = FastAPI(
    title="StadiumMind AI Backend",
    description="Production-ready backend for StadiumMind AI Operations Command Center",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_frontend_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def normalize_api_path_middleware(request: Request, call_next):
    if request.url.path.startswith("//api/"):
        request.scope["path"] = request.url.path[1:]
    return await call_next(request)

# 1. Custom rate limiting middleware (in-memory)
RATE_LIMIT_WINDOW = 60 # seconds
RATE_LIMIT_MAX = 100   # requests per window
ip_requests = {}       # client_ip -> list of timestamps

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Only rate-limit API calls
    if not request.url.path.startswith("/api"):
        return await call_next(request)
        
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Prune expired timestamps
    timestamps = ip_requests.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    ip_requests[client_ip] = timestamps
    
    if len(timestamps) >= RATE_LIMIT_MAX:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return Response(
            content=json.dumps({"detail": "Rate limit exceeded. Try again in a minute."}),
            status_code=429,
            media_type="application/json"
        )
        
    ip_requests[client_ip].append(now)
    return await call_next(request)

# 2. Helmet-style security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    # Content-Security-Policy setup (allowing standard styles, fonts, and scripts)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' http: https: data:; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' http: https: data:;"
    )
    return response

# Startup handler
@app.on_event("startup")
def startup_event():
    logger.info("Initializing SQLite database...")
    init_db()
    logger.info("Database initialized successfully.")

# Mount routers
app.include_router(auth.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}
