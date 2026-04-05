from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import datetime
import cv2
import random
import base64
import asyncio

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model
model = YOLO("runs/detect/train20/weights/best.pt")
video_path = "videos/accident_trim.mov"

# Roorkee location data
roorkee_locations = [
    {"name": "Cawnpore Dwar Military Contonment Roorkee India", "latitude": 29.856335, "longitude": 77.888219},
    {"name": "Rampur Chungi, Roorkee India", "latitude": 29.884123, "longitude": 77.877516},
    {"name": "Ramnagar, Roorkee India", "latitude": 29.873383, "longitude": 77.876879},
    {"name": "Bhagwanpur Highway, Roorkee India", "latitude": 29.939262, "longitude": 77.812466},
]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔗 WebSocket connection established")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("❌ Error opening video file")
        return

    consecutive_detections = 0
    location = random.choice(roorkee_locations)
    
    while True:
        try:
            await asyncio.sleep(1/30)

            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            start_time = datetime.datetime.now()

            results = model(frame)
            annotated_frame = results[0].plot()

            end_time = datetime.datetime.now()
            inference_time = (end_time - start_time).total_seconds()
            fps = round(1 / inference_time, 2) if inference_time > 0 else 0.0

            # Top-left: FPS
            cv2.putText(
                annotated_frame,
                f"FPS: {fps}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
                cv2.LINE_AA
            )

            # Top-right: Timestamp
            timestamp_str = end_time.strftime("%Y-%m-%d %H:%M:%S")
            text_size, _ = cv2.getTextSize(timestamp_str, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            text_x = annotated_frame.shape[1] - text_size[0] - 10
            cv2.putText(
                annotated_frame,
                timestamp_str,
                (text_x, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )

            _, jpeg_frame = cv2.imencode(".jpg", annotated_frame)
            b64_frame = base64.b64encode(jpeg_frame).decode("utf-8")

            # Ensure a default location is always available
           

            if len(results[0].boxes) > 0:
                consecutive_detections += 1
                print(f"⚠️ Accident detected ({consecutive_detections} consecutive frames)")

                accident_state = consecutive_detections >= 5
            else:
                consecutive_detections = 0
                accident_state = False

            response = {
                "frame": b64_frame,
                "detections": len(results[0].boxes),
                "consecutive_detections": consecutive_detections,
                "accident_state": accident_state,
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "address": location["name"],
                "timestamp": end_time.isoformat()
            }

            await websocket.send_json(response)

        except Exception as e:
            print(f"WebSocket error: {e}")
            break

    cap.release()
    print("🛑 WebSocket connection closed")
