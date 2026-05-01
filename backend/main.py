import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

app = FastAPI(
    title="AI Debugger API",
    description="Backend API for the AI Debugger Application"
)

# Allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Debugger API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "redis_host": os.getenv("REDIS_HOST", "localhost")}
