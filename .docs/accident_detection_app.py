from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
import random
import os

app = Flask(__name__)
alerts = []  # In-memory storage of alerts

# Ensure static folder exists for detected frames
os.makedirs("static/detected_frames", exist_ok=True)


@app.route("/alert", methods=["POST"])
def receive_alert():
    data = request.json

    alert = {
        "id": len(alerts) + 1,
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": data.get("status", "accident_detected"),
        "image_path": data.get("image_path"),
        "address": data.get("address", "Unknown location"),
        "acknowledged": False,
    }

    alerts.append(alert)
    alerts.sort(key=lambda x: x["timestamp"], reverse=True)  # Keep newest first

    print(f"🚨 New alert #{alert['id']} at {alert['timestamp']}")
    return jsonify({"message": "Alert received", "alert_id": alert["id"]}), 200


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/api/alerts")
def get_alerts():
    return jsonify(
        {
            "alerts": alerts,
            "total": len(alerts),
            "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
    )


@app.route("/update_status", methods=["POST"])
def update_status():
    data = request.json
    alert_id = data.get("id")
    new_status = data.get("status")

    for alert in alerts:
        if alert["id"] == alert_id:
            alert["status"] = new_status
            return jsonify(
                {"message": f"Alert {alert_id} status updated to {new_status}"}
            )

    return jsonify({"error": "Alert not found"}), 404


if __name__ == "__main__":
    # Add some sample alerts for testing
    sample_locations = [
        {"latitude": 29.9058, "longitude": 77.8375, "address": "RIT ROORKEE"},
        {"latitude": 29.5152, "longitude": 77.5347, "address": "IIT ROORKEE"},
        {"latitude": 29.8745, "longitude": 77.8696, "address": "Ramnagar Roorkee"},
        {
            "latitude": 29.394764,
            "longitude": 79.126503,
            "address": "Quantum university",
        },
    ]

    for i, loc in enumerate(sample_locations):
        alerts.append(
            {
                "id": i + 1,
                **loc,
                "timestamp": (
                    datetime.now() - timedelta(minutes=(i + 1) * 15)
                ).strftime("%Y-%m-%d %H:%M:%S"),
                "status": random.choice(
                    ["accident_detected", "under_review", "resolved"]
                ),
                "image_path": f"/static/detected_frames/sample_{i + 1}.jpg",
                "acknowledged": False,
            }
        )

    print("🚀 Starting Netra 2.0 Dashboard Server")
    print("📊 Dashboard: http://localhost:5000/dashboard")
    app.run(debug=True, host="0.0.0.0", port=5000)
