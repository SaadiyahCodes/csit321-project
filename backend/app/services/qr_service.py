import qrcode
import json
import base64
from io import BytesIO

# Service to generate QR codes for given payloads
def generate_qr_code(payload: dict) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(json.dumps(payload))
    qr.make(fit=True)

    img = qr.make_image(fill='black', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format="PNG")

    encoded = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"