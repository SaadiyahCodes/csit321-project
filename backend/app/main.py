from fastapi import FastAPI

app = FastAPI(title="Gusto API")

@app.get("/")
def health_check():
    return {"status": "ok"}
