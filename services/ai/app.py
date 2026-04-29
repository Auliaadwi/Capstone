from flask import Flask, jsonify, request

app = Flask(__name__)


def extract_skills(text: str):
    lowered = (text or "").lower()
    skill_map = {
        "JavaScript": ["javascript", "js"],
        "React": ["react", "next", "vite"],
        "Node.js": ["node", "express"],
        "SQL": ["sql", "postgres", "mysql"],
        "Python": ["python", "flask", "django"],
    }

    detected = [skill for skill, keywords in skill_map.items() if any(keyword in lowered for keyword in keywords)]
    if not detected:
        detected = ["Communication", "Problem Solving"]

    return detected


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "skillmap-ai"})


@app.post("/analyze")
def analyze():
    payload = request.get_json(silent=True) or {}
    filename = payload.get("filename", "cv.pdf")
    source_text = payload.get("text", filename)
    skills = extract_skills(source_text)

    return jsonify(
        {
            "filename": filename,
            "skills": skills,
            "gap": ["Deep Learning", "Deployment"],
            "recommendation": [
                "Build a small portfolio project",
                "Study system design fundamentals",
                "Deploy your work with a simple CI pipeline",
            ],
        }
    )


if __name__ == "__main__":
    app.run(port=5000, debug=True)
