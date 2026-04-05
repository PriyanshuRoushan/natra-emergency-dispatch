from ultralytics import YOLO
import requests
import datetime
import os
import cv2
import random

# Load YOLOv8 model
model = YOLO("runs/detect/train20/weights/best.pt")
video_path = "videos/accident_trim.mov"
save_frame_dir = "static/detected_frames"
os.makedirs(save_frame_dir, exist_ok=True)

# Alert API configuration
alert_url = "http://localhost:5000/alert"

# Roorkee locations data
roorkee_locations = [
    {
        "name": "RIT ROORKEE",
        "latitude": 29.9058,
        "longitude": 77.8375
    },
    {
        "name": "IIT ROORKEE",
        "latitude": 29.5152, 
        "longitude": 77.5347
    },
    {
        "name": "Ramnagar Roorkee",
        "latitude": 29.8745,
        "longitude": 77.8696
    },
    {
        "name": "Quantum university",
        "latitude": 29.394764,
        "longitude": 79.126503
    }
]

def send_alert(frame):
    """Send alert to dashboard with detection frame"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"accident_{timestamp}.jpg"
    filepath = os.path.join(save_frame_dir, filename)
    cv2.imwrite(filepath, frame)
    
    # Select random Roorkee location
    location = random.choice(roorkee_locations)
    
    payload = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "address": location["name"],
        "image_path": f"/static/detected_frames/{filename}",
        "status": "accident_detected"
    }

    try:
        response = requests.post(alert_url, json=payload)
        if response.status_code == 200:
            print(f"✅ Alert sent successfully from {location['name']}!")
        else:
            print(f"⚠️ Failed to send alert. Status code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error sending alert: {str(e)}")

def main():
    print("🔍 Starting Roorkee Accident Detection System...")
    print("Press SPACE to pause/resume, ESC to exit")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("❌ Error opening video file")
        return
    
    paused = False
    consecutive_detections = 0
    alert_sent = False
    current_frame = None
    
    while True:
        # Always check for key presses
        key = cv2.waitKey(1) & 0xFF
        
        # SPACE to toggle pause
        if key == ord(' '):
            paused = not paused
            if paused:
                print("⏸️ Video PAUSED - Press SPACE to resume")
            else:
                print("▶️ Video RESUMED")
            # Add small delay to prevent rapid toggling
            cv2.waitKey(200)  
            continue
        
        # ESC to exit
        elif key == 27:
            break
        
        # Process frames only when not paused
        if not paused:
            ret, frame = cap.read()
            if not ret:
                # Loop video when ended
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            current_frame = frame.copy()
            results = model(frame)
            annotated_frame = results[0].plot()
            
            # Check for detections
            if len(results[0].boxes) > 0:
                consecutive_detections += 1
                print(f"⚠️ Accident detected ({consecutive_detections} consecutive frames)")
                
                # Send alert after 5 consecutive detections
                if consecutive_detections >= 5 and not alert_sent:
                    send_alert(frame)
                    alert_sent = True
            else:
                consecutive_detections = 0
                alert_sent = False
            
            # Display the processed frame
            cv2.imshow('Roorkee Accident Detection (SPACE=pause, ESC=exit)', annotated_frame)
        else:
            # When paused, keep showing the last frame
            if current_frame is not None:
                # Create a "Paused" overlay
                paused_frame = current_frame.copy()
                cv2.putText(paused_frame, "PAUSED", (50, 50), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                cv2.imshow('Roorkee Accident Detection (SPACE=pause, ESC=exit)', paused_frame)
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("🛑 Detection stopped")

if __name__ == '__main__':
    main()