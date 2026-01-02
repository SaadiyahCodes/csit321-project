from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.db.base import Base
from app.routers import auth, admin, menu, restaurant

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gusto API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Register routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(menu.router)
app.include_router(restaurant.router)

@app.get("/")
def root():
    return {"message": "Welcome to Gusto API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
