import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analyzer import router as analyzer_router
from slop_detector import router as slop_router
from optimizer import router as optimizer_router
from token_counter import router as token_router
from recommender import router as recommender_router
from impact import router as impact_router

app = FastAPI(title="EcoRoute Backend")

# Allow React/Vite frontend origins and Chrome Extension origins
origins = [
    "https://eco-route-project.vercel.app",
    "https://ecoroute-project-1.onrender.com",
    "chrome-extension://ehpckjafpegpnphioaekomceopbmjhge",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyzer_router, prefix="/api")
app.include_router(slop_router, prefix="/api")
app.include_router(optimizer_router, prefix="/api")
app.include_router(token_router, prefix="/api")
app.include_router(recommender_router, prefix="/api")
app.include_router(impact_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
