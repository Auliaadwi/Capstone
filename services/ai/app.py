from __future__ import annotations

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from src.analysis import analyze_cv_text

def get_cors_origins():
    raw = os.getenv("CORS_ORIGIN", "*")
    if raw.strip() == "*":
        return "*"
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    CORS(app, resources={r"/api/*": {"origins": get_cors_origins()}})

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "skillmap-ai-service", "stack": "flask"})

    @app.post("/api/ai/cv/analyze")
    def analyze_cv():
        """
        API Contract:
        Input JSON: { "text": "...", "domain": "technology" }
        Output JSON: { "extractedSkills": [...], "skillGap": [...], "recommendation": [...], "confidence": 0.85, "domain": "technology" }
        """
        payload = request.get_json(silent=True) or {}
        extracted_text = payload.get("text", "")
        domain = payload.get("domain", "technology")
        
        analysis = analyze_cv_text(extracted_text, domain)
        return jsonify(analysis)

    @app.errorhandler(Exception)
    def handle_error(error: Exception):
        if isinstance(error, HTTPException):
            return jsonify({"error": error.description}), error.code
        app.logger.exception("Unhandled server error")
        return jsonify({"error": str(error) or "Internal server error"}), 500

    return app

app = create_app()
