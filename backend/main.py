from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai

app = FastAPI(title="AuditMate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Для локальной разработки
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])

@app.get("/")
def read_root():
    return {"message": "AuditMate Backend is running!"}
