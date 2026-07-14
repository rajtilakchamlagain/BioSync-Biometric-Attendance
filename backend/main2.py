from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import os
import mysql.connector
from datetime import datetime
from deepface import DeepFace
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- DATABASE CONFIGURATION ---
# These are loaded from the .env file
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "biosync")
# ------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

class QRRequest(BaseModel):
    token: str

@app.post("/verify-qr")
async def verify_qr(data: QRRequest):
    print(f"\n📡 API ALERT: QR Token '{data.token}' received.")
    
    if data.token != "USR-RAJTILAK-998877":
        return {"status": "error", "message": "Invalid QR Token."}

    ref_image_path = "rajtilak_face.jpeg"
    if not os.path.exists(ref_image_path):
        return {"status": "error", "message": "Reference photo missing!"}

    print("📷 AI: Taking control of webcam for live scan...")
    video_capture = cv2.VideoCapture(0)
    for _ in range(5):
        video_capture.read()
    ret, frame = video_capture.read()
    video_capture.release() 

    if not ret:
        return {"status": "error", "message": "Webcam failure."}

    print("🧠 AI: Analyzing live face against database...")
    try:
        result = DeepFace.verify(img1_path=ref_image_path, img2_path=frame, enforce_detection=False)

        if result["verified"]:
            print("✅ AI: BIOMETRIC MATCH CONFIRMED!")
            
            # --- PHASE 4: BUSINESS LOGIC & DATABASE ---
            now = datetime.now()
            current_time = now.strftime("%H:%M:%S")
            current_date = now.strftime("%Y-%m-%d")
            
            # The Clock Rules
            if now.hour < 12:
                status = "IN"
            else:
                status = "OUT"
                
            print(f"🕒 CLOCK: Time is {current_time}. Logging as '{status}'.")

            # Connect to MySQL and save it
            try:
                db = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
                cursor = db.cursor()
                
                # Assuming your table is named 'attendance' - change if needed!
                sql = "INSERT INTO attendance (token, scan_date, scan_time, status) VALUES (%s, %s, %s, %s)"
                val = (data.token, current_date, current_time, status)
                cursor.execute(sql, val)
                db.commit()
                print("💾 DATABASE: Attendance saved successfully!")
                
            except Exception as db_err:
                print(f"⚠️ DB Warning: AI worked, but couldn't save to MySQL. Error: {db_err}")

            return {"status": "success", "message": f"Face Verified! Logged '{status}' at {current_time}."}
            
        else:
            print("🚨 AI: SECURITY ALERT! FACE MISMATCH!")
            return {"status": "error", "message": "Intruder Alert: Face mismatch!"}
            
    except Exception as e:
        print(f"❌ AI Error: {e}")
        return {"status": "error", "message": "AI processing error."}