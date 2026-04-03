from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.analytics_service import AnalyticsService
import os
from pydantic import BaseModel
from typing import Any
from google import genai
from google.genai import types

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard(
    restaurant_id: int = Query(..., description="Restaurant ID"),
    date_range: str = Query("7days", regex="^(7days|30days)$"),
    db: Session = Depends(get_db)
):
    """Main analytics dashboard endpoint"""
    
    analytics = AnalyticsService(db)
    days = 7 if date_range == "7days" else 30
    
    try:
        kpi = analytics.get_kpi_metrics(restaurant_id, days)
        return {
            "kpi": kpi,
            "top_questions": analytics.get_top_questions(restaurant_id, days),
            "conversation_timeline": analytics.get_conversation_timeline(restaurant_id, days),
            "language_distribution": analytics.get_language_distribution(restaurant_id, days),
            "top_menu_items": analytics.get_top_menu_items(restaurant_id, days, limit=5),
            "alerts": analytics.generate_alerts(restaurant_id, days),
            "date_range": date_range
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class AISummaryRequest(BaseModel):
    kpi: dict[str, Any]
    alerts: list[dict[str, Any]]
    top_questions: list[dict[str, Any]]
    top_menu_items: list[dict[str, Any]]
    language_distribution: list[dict[str, Any]]
    date_range: str

@router.post("/ai-summary")
async def get_ai_summary(request: AISummaryRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    client = genai.Client(api_key=api_key)

    prompt = f"""You are an analytics assistant for Gusto, a restaurant AI ordering platform.

You will be given restaurant analytics data. Your job is to surface ONE non-obvious insight the restaurant owner would not immediately read from looking at the charts themselves.

Do not restate numbers they can already see. Instead, find a pattern, correlation, or implication — for example: a mismatch between what customers ask about and what gets ordered, an AOV gap that suggests a pricing opportunity, or a language distribution that suggests an untapped customer segment.

Respond with exactly 2 sections separated by ||BREAK||

INSIGHT: One sharp observation in 2 sentences max. Be specific and data-driven.
ACTION: One concrete thing the restaurant can do about it, in 1 sentence.

No markdown, no bullet points, no asterisks, no bold. Plain sentences only.

DATA: {request.model_dump()}"""

    try:
        response = client.models.generate_content(
            model='models/gemini-flash-latest',
            contents=prompt,
            config={"temperature": 0}
        )
        content = response.text.strip()
        if not content:
            raise HTTPException(status_code=502, detail="Model returned empty response")
        return {"summary": content}
    except Exception as e:
        print(f"Gemini error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))