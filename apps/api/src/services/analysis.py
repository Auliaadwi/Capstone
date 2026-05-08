import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")

DEFAULT_TAXONOMIES = {
    "technology": {
        "JavaScript": ["javascript", "js", "ecmascript"],
        "React": ["react", "next", "vite"],
        "Express": ["express", "node", "nodejs"],
        "REST API": ["rest", "api", "endpoint", "http"],
        "PostgreSQL": ["postgres", "postgresql", "sql", "database"],
        "TensorFlow": ["tensorflow", "keras", "deep learning"],
        "NLP": ["nlp", "natural language", "text classification"],
        "Deployment": ["deployment", "deploy", "vercel", "netlify", "render"]
    }
}

DEFAULT_QUIZ_BANK = {
    "technology": [
        {
            "id": "tq1",
            "prompt": "Seberapa nyaman kamu membangun fitur web interaktif dengan JavaScript?",
            "options": ["Belum pernah", "Paham dasar", "Sering praktik", "Mampu memimpin implementasi"]
        },
        {
            "id": "tq2",
            "prompt": "Seberapa siap kamu membuat REST API dengan validasi dan error handling?",
            "options": ["Belum siap", "Masih belajar", "Cukup siap", "Sangat siap"]
        },
        {
            "id": "tq3",
            "prompt": "Bagaimana pengalamanmu menggunakan database relasional?",
            "options": ["Belum pernah", "Query dasar", "Desain tabel sederhana", "Optimasi dan relasi kompleks"]
        }
    ]
}

ROLE_PROFILES = [
    {
        "id": "fullstack-web-developer",
        "name": "Junior Full-Stack Web Developer",
        "domain": "technology",
        "audience": "Mahasiswa tingkat akhir dan fresh graduates",
        "requiredSkills": ["JavaScript", "React", "Express", "REST API", "PostgreSQL", "Deployment", "Testing"],
        "businessGoal": "Siap melamar role full-stack junior dengan portofolio end-to-end.",
        "marketSignals": ["React + API integration", "RESTful backend", "database persistence", "public deployment"]
    },
    {
        "id": "ai-engineer",
        "name": "Junior AI Engineer",
        "domain": "technology",
        "audience": "Fresh graduates yang ingin masuk ke bidang AI/NLP",
        "requiredSkills": ["Python", "TensorFlow", "NLP", "Model Evaluation", "TensorBoard", "Model Serving"],
        "businessGoal": "Mampu membangun model NLP untuk ekstraksi skill dan rekomendasi learning path.",
        "marketSignals": ["TensorFlow Functional API", "custom training loop", "model export", "inference API"]
    },
    {
        "id": "data-scientist",
        "name": "Junior Data Scientist",
        "domain": "technology",
        "audience": "Mahasiswa/fresh graduates yang fokus pada analisis data",
        "requiredSkills": ["Python", "Data Wrangling", "EDA", "Feature Engineering", "A/B Testing", "Streamlit"],
        "businessGoal": "Mampu mengubah dataset CV, job description, dan quiz menjadi insight siap dashboard.",
        "marketSignals": ["data cleaning", "business questions", "explanatory analysis", "interactive dashboard"]
    }
]

ROADMAP_BY_SKILL = {
    "JavaScript": "Practice JavaScript fundamentals through form, state, and validation tasks.",
    "React": "Build the SkillMap frontend flow with reusable React components and responsive states.",
    "Express": "Create Express routes for CV upload, quiz submission, recommendations, and dashboard data.",
    "REST API": "Document RESTful endpoints and test success, empty, and error responses.",
    "PostgreSQL": "Persist users, CV analysis, quiz attempts, and learning paths in PostgreSQL.",
    "Deployment": "Deploy the frontend and API, then connect production environment variables.",
    "Testing": "Run feature checks for upload, quiz, dashboard, and API failure states.",
    "Python": "Prepare Python notebooks/scripts for preprocessing CV and job description datasets.",
    "TensorFlow": "Train a TensorFlow model with a production-ready export format.",
    "NLP": "Build text preprocessing and skill extraction pipelines for CV content.",
    "Model Evaluation": "Measure model quality and compare predictions against labeled job requirements.",
    "TensorBoard": "Log training metrics to TensorBoard for monitoring and final reporting.",
    "Model Serving": "Serve model inference from a Flask or FastAPI service.",
    "Data Wrangling": "Gather, assess, clean, and document dataset quality before modeling.",
    "EDA": "Create visual analysis of skill distributions and role demand patterns.",
    "Feature Engineering": "Create role-skill match, quiz readiness, and gap severity features.",
    "A/B Testing": "Run a Python A/B test for two recommendation presentation variants.",
    "Streamlit": "Deploy an interactive Streamlit dashboard for data insight and conclusions."
}

def load_json(filename, fallback):
    try:
        with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback

taxonomies = load_json("taxonomies.json", DEFAULT_TAXONOMIES)
quiz_bank = load_json("quizBank.json", DEFAULT_QUIZ_BANK)
dashboard_snapshot_data = load_json("dashboardSnapshot.json", {
    "user": {"name": "Demo User", "role": "SkillMap Explorer"},
    "skillScore": 76,
    "targetRole": "Junior Full-Stack Web Developer",
    "strengths": ["JavaScript", "React"],
    "gaps": ["Express", "PostgreSQL", "Deployment"],
    "roadmap": []
})

def normalize_text(value=""):
    return str(value).lower() if value else ""

def get_role_profile(target_role="fullstack-web-developer"):
    for role in ROLE_PROFILES:
        if role["id"] == target_role:
            return role
    return ROLE_PROFILES[0]

def get_domain_taxonomy(domain="technology"):
    base = taxonomies.get(domain) or taxonomies.get("technology") or DEFAULT_TAXONOMIES["technology"]
    expanded = dict(base)

    for role in ROLE_PROFILES:
        if role.get("domain") != domain:
            continue

        for skill in role.get("requiredSkills", []):
            if skill not in expanded:
                expanded[skill] = [skill.lower()]

    return expanded

def extract_skills(input_text="", domain="technology"):
    text = normalize_text(input_text)
    detected_skills = []
    taxonomy = get_domain_taxonomy(domain)

    for skill, keywords in taxonomy.items():
        normalized_keywords = keywords if isinstance(keywords, list) else [skill]
        for keyword in normalized_keywords:
            if normalize_text(keyword) in text:
                detected_skills.append(skill)
                break

    return list(dict.fromkeys(detected_skills)) # return unique

def create_roadmap(skill_gaps, role_profile):
    has_gaps = len(skill_gaps) > 0
    focus_gaps = skill_gaps if has_gaps else role_profile.get("requiredSkills", [])[:3]

    roadmap = []
    for index, skill in enumerate(focus_gaps[:5]):
        roadmap.append({
            "id": f"step-{index + 1}",
            "title": f"Close {skill} gap" if has_gaps else f"Polish {skill} proof",
            "focus": skill,
            "duration": "1-2 weeks" if index < 2 else "2-3 weeks",
            "action": ROADMAP_BY_SKILL.get(skill) or f"Build one practical project artifact that proves {skill}."
        })
    return roadmap

def build_recommendation_texts(roadmap, role_profile):
    roadmap_texts = [step["action"] for step in roadmap]
    return [
        f"Focus on {role_profile['name']} requirements before applying.",
    ] + roadmap_texts[:3] + [
        "Publish progress as portfolio evidence for recruiters."
    ]

def calculate_readiness_score(extracted_skills, required_skills, quiz_score=None):
    required_set = {skill.lower() for skill in required_skills}
    matched_count = sum(1 for skill in extracted_skills if skill.lower() in required_set)
    cv_score = round((matched_count / max(len(required_skills), 1)) * 100)

    if isinstance(quiz_score, (int, float)):
        return round(cv_score * 0.6 + quiz_score * 0.4)

    return max(35, min(95, cv_score))

def readiness_label(score):
    if score >= 85:
        return "job-ready"
    if score >= 65:
        return "nearly ready"
    return "foundation"

def get_role_profiles():
    return ROLE_PROFILES

def extract_text_from_upload(file_obj=None, body=None):
    if body is None:
        body = {}
        
    if body.get("text") and str(body["text"]).strip():
        return str(body["text"])

    if file_obj:
        file_data = file_obj.get("buffer", b"")
        mimetype = file_obj.get("mimetype", "")
        originalname = file_obj.get("originalname", "")
        
        if mimetype.startswith("text/") or originalname.lower().endswith(".txt"):
            try:
                return file_data.decode("utf-8")
            except Exception:
                pass

    return " ".join([
        (file_obj.get("originalname") if file_obj else "uploaded-cv"),
        body.get("targetRole", ""),
        body.get("domain", "technology"),
        "portfolio project communication problem solving"
    ])

def analyze_cv_text(input_text="", options=None):
    if options is None:
        options = {}
        
    domain = options.get("domain", "technology")
    extracted_skills = extract_skills(input_text, domain)
    normalized_extracted = {skill.lower() for skill in extracted_skills}

    job_matches = []
    for role in ROLE_PROFILES:
        required_skills = role.get("requiredSkills", [])
        matched_skills = [skill for skill in required_skills if skill.lower() in normalized_extracted]
        match_score = calculate_readiness_score(extracted_skills, required_skills)
        
        job_matches.append({
            "id": role["id"],
            "name": role["name"],
            "domain": role["domain"],
            "matchScore": match_score,
            "matchedSkills": matched_skills,
            "requiredSkills": required_skills,
            "businessGoal": role.get("businessGoal"),
            "marketSignals": role.get("marketSignals")
        })
        
    job_matches.sort(key=lambda x: x["matchScore"], reverse=True)

    best_match = job_matches[0]
    best_role_profile = get_role_profile(best_match["id"])
    skill_gap = [skill for skill in best_role_profile.get("requiredSkills", []) if skill.lower() not in normalized_extracted]
    roadmap = create_roadmap(skill_gap, best_role_profile)
    
    confidence = max(0.45, min(0.94, 0.48 + (len(extracted_skills) / max(len(best_role_profile.get("requiredSkills", [])), 1)) * 0.42))

    return {
        "extractedSkills": extracted_skills if extracted_skills else ["Communication", "Problem Solving"],
        "jobMatches": job_matches,
        "suggestedRoleId": best_match["id"],
        "skillGap": skill_gap,
        "recommendation": build_recommendation_texts(roadmap, best_role_profile),
        "roadmap": roadmap,
        "readinessScore": best_match["matchScore"],
        "readinessLabel": readiness_label(best_match["matchScore"]),
        "confidence": confidence,
        "domain": domain,
        "targetRole": best_match["name"],
        "targetRoleId": best_match["id"],
        "marketSignals": best_match.get("marketSignals"),
        "businessGoal": best_match.get("businessGoal")
    }

def get_quiz_questions(domain="technology", target_role="fullstack-web-developer"):
    base_questions = quiz_bank.get(domain) or quiz_bank.get("technology") or DEFAULT_QUIZ_BANK["technology"]
    role_profile = get_role_profile(target_role)
    
    role_question = {
        "id": f"{role_profile['id']}-focus",
        "prompt": f"Seberapa siap kamu membuktikan skill utama untuk {role_profile['name']}?",
        "options": ["Belum punya bukti", "Ada latihan kecil", "Ada proyek sederhana", "Ada portofolio siap demo"]
    }

    return (base_questions + [role_question])[:5]

def score_quiz(answers=None, options=None):
    if answers is None:
        answers = []
    if options is None:
        options = {}
        
    role_profile = get_role_profile(options.get("targetRole"))
    domain = options.get("domain") or role_profile.get("domain", "technology")
    questions = get_quiz_questions(domain, role_profile["id"])
    
    normalized_answers = answers if isinstance(answers, list) else []
    max_score = len(questions) * 3
    
    raw_score = 0
    for i, _ in enumerate(questions):
        try:
            val = float(normalized_answers[i])
            raw_score += max(0, min(3, val))
        except (IndexError, TypeError, ValueError):
            pass
            
    score = round((raw_score / max(max_score, 1)) * 100)
    
    weak_signals = []
    for i, question in enumerate(questions):
        try:
            if float(normalized_answers[i]) <= 1:
                weak_signals.append(question["prompt"])
        except (IndexError, TypeError, ValueError):
            weak_signals.append(question["prompt"])

    roadmap = create_roadmap(role_profile.get("requiredSkills", [])[:4], role_profile)

    return {
        "score": score,
        "track": readiness_label(score),
        "answeredCount": len([a for a in normalized_answers if a is not None]),
        "totalQuestions": len(questions),
        "weakSignals": weak_signals,
        "roadmap": [step["action"] for step in roadmap],
        "targetRole": role_profile["name"],
        "recommendation": "Prioritize portfolio polish, deployment, and interview storytelling." if score >= 80 else "Strengthen fundamentals first, then convert each skill gap into one portfolio artifact."
    }

def create_personalized_recommendation(payload=None):
    if payload is None:
        payload = {}
        
    role_profile = get_role_profile(payload.get("targetRole"))
    extracted_skills = payload.get("extractedSkills", [])
    if not isinstance(extracted_skills, list):
        extracted_skills = []
        
    quiz_score = payload.get("quizScore")
    if not isinstance(quiz_score, (int, float)):
        quiz_score = None
        
    normalized_extracted = {str(skill).lower() for skill in extracted_skills}
    skill_gap = [skill for skill in role_profile.get("requiredSkills", []) if skill.lower() not in normalized_extracted]
    readiness_score = calculate_readiness_score(extracted_skills, role_profile.get("requiredSkills", []), quiz_score)
    roadmap = create_roadmap(skill_gap, role_profile)

    return {
        "targetRole": role_profile["name"],
        "readinessScore": readiness_score,
        "readinessLabel": readiness_label(readiness_score),
        "skillGap": skill_gap,
        "roadmap": roadmap,
        "recommendation": build_recommendation_texts(roadmap, role_profile),
        "marketSignals": role_profile.get("marketSignals")
    }

def get_dashboard_snapshot():
    snapshot = dict(dashboard_snapshot_data)
    snapshot.update({
        "featureModules": [
            "CV skill extraction",
            "Adaptive quiz",
            "Skill gap mapping",
            "Personalized learning path",
            "Dashboard insight"
        ],
        "researchQuestions": [
            "How accurately can NLP detect CV skill gaps against industry requirements?",
            "How does a personalized learning path affect confidence and job readiness?"
        ],
        "compliance": {
            "frontend": ["React", "Vite module bundler", "Axios networking calls", "responsive UI"],
            "backend": ["Flask REST API", "RESTful URL convention", "PostgreSQL-ready persistence"],
            "aiMl": ["CV NLP extraction placeholder", "model-service integration contract", "recommendation engine"],
            "dataScience": ["skill mapping dataset", "EDA/dashboard insight contract", "ready for Streamlit reporting"]
        }
    })
    return snapshot
