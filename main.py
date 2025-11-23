from fastapi import FastAPI
from app.database import engine, Base
from app.routers import router

app = FastAPI(title="eHealth API - Create/Get")

# 创建表（开发/测试用，保留不会影响远端代理行为）
Base.metadata.create_all(bind=engine)

# 只保留 /api 前缀，避免与根路径重复挂载导致路由解析混乱
app.include_router(router, prefix="/api")

# 如果将来确实需要根路径形式，再打开下一行，并统一更新测试脚本 baseUrl
# app.include_router(router)
