from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"

DEFAULT_DASHBOARD_SNAPSHOT = {
    "user": {"name": "Alya Rahman", "role": "Fullstack Explorer"},
    "skillScore": 78,
    "targetRole": "Junior Fullstack Developer",
    "strengths": ["JavaScript", "React", "UI Building"],
    "gaps": ["Flask API Design", "System Design", "SQL Joins"],
    "roadmap": [
        "Build a CRUD API with Flask and PostgreSQL",
        "Practice relational schema design and joins",
        "Ship one end-to-end project with public deployment",
    ],
}


def load_json(filename: str, fallback):
    try:
        with (DATA_DIR / filename).open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError):
        return deepcopy(fallback)


TAXONOMIES = load_json("taxonomies.json", {})
QUIZ_BANK = load_json("quizBank.json", {})
DASHBOARD_SNAPSHOT = load_json("dashboardSnapshot.json", DEFAULT_DASHBOARD_SNAPSHOT)


def normalize_text(value: str = "") -> str:
    return value.lower()


ROLE_PROFILES = [
    {
        "id": "fullstack-web-developer",
        "name": "Junior Full-Stack Web Developer",
        "required_skills": ["javascript", "react", "express", "rest", "sql", "deployment"],
    },
    {
        "id": "ai-engineer",
        "name": "Junior AI Engineer",
        "required_skills": ["python", "tensorflow", "nlp", "model", "keras"],
    },
    {
        "id": "data-scientist",
        "name": "Junior Data Scientist",
        "required_skills": ["python", "data", "eda", "feature", "streamlit"],
    },
    {
        "id": "project-manager-digital",
        "name": "Junior Project Manager Digital",
        "required_skills": ["time management", "leadership", "communication", "project planning", "problem solving", "risk management"],
    },
]


def analyze_cv_text(input_text: str = "", domain: str = "technology") -> dict:
    text = normalize_text(input_text)
    detected_skills = []

    for skill, keywords in (TAXONOMIES.get(domain) or {}).items():
        if any(keyword in text for keyword in keywords):
            detected_skills.append(skill)

    extracted_skills = detected_skills or ["Communication", "Problem Solving"]

    # Calculate match score for each role
    job_matches = []
    for role in ROLE_PROFILES:
        matched = sum(1 for s in role["required_skills"] if s in text)
        total = len(role["required_skills"])
        score = max(35, min(95, round((matched / max(total, 1)) * 100)))
        job_matches.append({
            "id": role["id"],
            "name": role["name"],
            "matchScore": score,
        })

    job_matches.sort(key=lambda r: r["matchScore"], reverse=True)
    best = job_matches[0]

    default_gaps = ["portfolio", "system design", "deployment"]
    skill_gap = [gap for gap in default_gaps if gap not in text]

    return {
        "extractedSkills": extracted_skills,
        "jobMatches": job_matches,
        "suggestedRoleId": best["id"],
        "skillGap": skill_gap,
        "recommendation": [
            f"Study core topics for {best['name']}",
            "Build at least one end-to-end project",
            "Document the project and publish it in your portfolio",
        ],
        "confidence": 0.85 if detected_skills else 0.45,
        "domain": domain,
    }



def get_quiz_questions(domain: str = "technology") -> list:
    return QUIZ_BANK.get(domain) or QUIZ_BANK.get("technology") or []


def score_quiz(answers: list) -> dict:
    positive_signals = len([answer for answer in answers if answer is not None])
    score = min(100, 40 + positive_signals * 20)

    roadmap = (
        [
            "Build a domain-focused project with a real API",
            "Add validation, tests, and deployment polish",
            "Document the architecture and publish your work",
        ]
        if score >= 80
        else [
            "Review frontend, backend, and database fundamentals",
            "Complete guided CRUD and API exercises",
            "Practice with smaller projects before scaling up",
        ]
    )

    return {
        "score": score,
        "track": "job-ready" if score >= 80 else "foundation",
        "roadmap": roadmap,
    }


def get_dashboard_snapshot() -> dict:
    return deepcopy(DASHBOARD_SNAPSHOT)
