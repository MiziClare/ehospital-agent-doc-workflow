from fastapi import FastAPI
from app.routers import router

app = FastAPI(title="eHealth API - Create/Get")

app.include_router(router, prefix="/api")

