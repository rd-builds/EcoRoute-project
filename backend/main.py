from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analyzer import router as analyzer_router
from slop_detector import router as slop_router
from optimizer import router as optimizer_router
from token_counter import router as token_router
from recommender import router as recommender_router
from impact import router as impact_router

app = FastAPI(title="GreenMind Backend")

# Allow React/Vite frontend origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(analyzer_router, prefix="/api")
app.include_router(slop_router, prefix="/api")
app.include_router(optimizer_router, prefix="/api")
app.include_router(token_router, prefix="/api")
app.include_router(recommender_router, prefix="/api")
app.include_router(impact_router, prefix="/api")
