from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from werkzeug.utils import secure_filename

load_dotenv(Path(__file__).resolve().parent / ".env")

from src.analysis import analyze_cv_text, get_dashboard_snapshot, get_quiz_questions, score_quiz
from src.db import init_database, save_cv_analysis, save_quiz_result


def build_fallback_text(filename: str) -> str:
    return f"{filename} react flask sql portfolio deployment"


def get_uploaded_file_size() -> int:
    uploaded_file = request.files.get("cv")
    if not uploaded_file or not uploaded_file.stream:
        return 0

    current_position = uploaded_file.stream.tell()
    uploaded_file.stream.seek(0, os.SEEK_END)
    size = uploaded_file.stream.tell()
    uploaded_file.stream.seek(current_position)
    return size


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    CORS(app, resources={r"/api/*": {"origins": [cors_origin]}, r"/health": {"origins": [cors_origin]}})

    init_database()

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "skillmap-api", "stack": "flask"})

    @app.post("/api/cv/upload")
    def upload_cv():
        uploaded_file = request.files.get("cv")
        domain = request.form.get("domain") or request.args.get("domain") or "technology"

        raw_file_name = uploaded_file.filename if uploaded_file and uploaded_file.filename else "cv.pdf"
        file_name = secure_filename(raw_file_name) or "cv.pdf"
        extracted_text = request.form.get("text") or build_fallback_text(file_name)
        analysis = analyze_cv_text(extracted_text, domain)

        try:
            save_cv_analysis(
                file_name=file_name,
                extracted_skills=analysis["extractedSkills"],
                skill_gap=analysis["skillGap"],
                recommendation=analysis["recommendation"],
                confidence=analysis["confidence"],
            )
        except Exception:
            app.logger.exception("Failed to persist CV analysis")

        return jsonify(
            {
                "fileName": file_name,
                "fileSize": get_uploaded_file_size(),
                **analysis,
            }
        )

    @app.get("/api/quiz/questions")
    def quiz_questions():
        domain = request.args.get("domain", "technology")
        return jsonify({"questions": get_quiz_questions(domain)})

    @app.post("/api/quiz/submit")
    def quiz_submit():
        payload = request.get_json(silent=True) or {}
        domain = payload.get("domain") or request.args.get("domain") or "technology"
        answers = payload.get("answers")
        if not isinstance(answers, list):
            answers = []

        result = score_quiz(answers)

        try:
            save_quiz_result(score=result["score"], result={**result, "domain": domain})
        except Exception:
            app.logger.exception("Failed to persist quiz result")

        return jsonify(result)

    @app.get("/api/dashboard/overview")
    def dashboard_overview():
        return jsonify(get_dashboard_snapshot())

    @app.get("/api/dashboard/<user_id>")
    def dashboard_by_user(user_id: str):
        snapshot = get_dashboard_snapshot()
        snapshot["user"] = {**snapshot.get("user", {}), "id": user_id}
        return jsonify(snapshot)

    @app.errorhandler(Exception)
    def handle_error(error: Exception):
        if isinstance(error, HTTPException):
            return jsonify({"error": error.description}), error.code

        app.logger.exception("Unhandled server error")
        return jsonify({"error": str(error) or "Internal server error"}), 500

    return app


app = create_app()
