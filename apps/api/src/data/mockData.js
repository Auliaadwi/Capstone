export const quizQuestions = [
  {
    id: "q1",
    prompt: "Seberapa percaya diri kamu membangun REST API?",
    options: ["Baru mulai", "Pernah bikin", "Sudah lancar", "Bisa mengajar"]
  },
  {
    id: "q2",
    prompt: "Bagian mana yang paling ingin kamu tingkatkan?",
    options: ["Frontend", "Backend", "Database", "AI / Data"]
  },
  {
    id: "q3",
    prompt: "Seberapa sering kamu belajar secara terstruktur?",
    options: ["Jarang", "Mingguan", "Hampir tiap hari", "Sudah rutin"]
  }
];

export const dashboardSnapshot = {
  user: {
    name: "Alya Rahman",
    role: "Fullstack Explorer"
  },
  skillScore: 78,
  targetRole: "Junior Fullstack Developer",
  strengths: ["JavaScript", "React", "UI Building"],
  gaps: ["Node.js", "System Design", "SQL Joins"],
  roadmap: [
    "Build a Node.js CRUD API with authentication",
    "Practice SQL joins and schema design",
    "Ship one portfolio project with deployable backend"
  ]
};

export const skillKeywords = {
  javascript: ["javascript", "js", "ecmascript"],
  react: ["react", "next", "vite"],
  node: ["node", "express", "nestjs"],
  database: ["sql", "postgres", "mysql", "prisma"],
  ai: ["machine learning", "ml", "nlp", "ai", "python", "pytorch", "tensorflow"]
};
