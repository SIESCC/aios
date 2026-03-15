from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import search, models, tools, research, trends, alerts

app = FastAPI(
    title="AIOS Central Intelligence API",
    description="The core backend powering global AI ecosystem discovery.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-routers
app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(models.router, prefix="/api/v1", tags=["AI Models"])
app.include_router(tools.router, prefix="/api/v1", tags=["AI Tools"])
app.include_router(research.router, prefix="/api/v1", tags=["Research"])
app.include_router(trends.router, prefix="/api/v1", tags=["Trends"])
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])

@app.get("/health")
def health_check():
    return {"status": "operational", "api": "fastapi"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
