from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, accounts, incomes, expenses, budgets, dashboard, profile, reports, goals, notifications, analytics, admin

# Create all database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BudgetBuddy API",
    description="Backend API for BudgetBuddy - Personal Budget Planning and Expense Management System",
    version="1.0.0"
)

from app.config import settings

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    settings.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(incomes.router)
app.include_router(expenses.router)
app.include_router(budgets.router)
app.include_router(dashboard.router)
app.include_router(profile.router)
app.include_router(reports.router)
app.include_router(goals.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "app": "BudgetBuddy API",
        "tagline": "Your money. Your goals. Your future.",
        "status": "online",
        "docs": "/docs"
    }
