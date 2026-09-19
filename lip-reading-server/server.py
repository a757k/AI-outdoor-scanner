from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.get("/")
def home():
    return jsonify({
        "status": "online",
        "service": "AI Outdoor Scanner Silent Lip Reading"
    })


@app.post("/predict")
def predict():
    """
    Receives a visual speech sequence.

    The Auto-AVSR model will be connected here.
    We deliberately do NOT return fake speech.
    """

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "text": "",
            "confidence": 0,
            "status": "no-data"
        }), 400

    frames = data.get("frames", [])

    if not frames:
        return jsonify({
            "text": "",
            "confidence": 0,
            "status": "no-frames"
        }), 400

    return jsonify({
        "text": "",
        "confidence": 0,
        "status": "model-not-connected",
        "frameCount": len(frames)
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False
    )
