from fastapi import FastAPI
from analyzer import router as analyzer_router
from slop_detector import router as slop_router
from optimizer import router as optimizer_router
from token_counter import router as token_router
from recommender import router as recommender_router
from impact import router as impact_router

app = FastAPI(title="GreenMind Backend")

app.include_router(analyzer_router, prefix="/api")
app.include_router(slop_router, prefix="/api")
app.include_router(optimizer_router, prefix="/api")
app.include_router(token_router, prefix="/api")
app.include_router(recommender_router, prefix="/api")
app.include_router(impact_router, prefix="/api")

