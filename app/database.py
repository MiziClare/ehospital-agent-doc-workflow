from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 本项目当前以“远端表 API 代理”为主，保留本地 DB 配置以便将来切换/迁移使用。
DATABASE_URL = "sqlite:///E:/Code/FastAPI eHealth/app.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
