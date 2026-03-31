from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.analytics_service import AnalyticsService

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