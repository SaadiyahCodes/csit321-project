# app/services/qr_service.py
import qrcode
import json
import base64
from io import BytesIO

def generate_qr_code(payload: dict) -> str:
    """
    Generate QR code with comprehensive order data
    Payload should include: selection_id, restaurant_id, items, total, timestamp
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4
    )
    
    # Convert payload to JSON string
    qr_data = json.dumps(payload, ensure_ascii=False)
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color='black', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format="PNG")

    encoded = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"