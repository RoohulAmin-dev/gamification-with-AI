<div align="center">

# 🧠 Gamification With AI

### AI-Powered Adaptive Learning Platform

> An AI that doesn't just answer your question — it decides **how** to teach it. Flashcards, quizzes, timelines, diagrams, visualizations, or simulations, chosen automatically for whatever you're trying to learn.

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-00C7B7?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0d0d0d)](https://gamification-with-ai-by-roohulamin.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white&labelColor=0d0d0d)](https://github.com/RoohulAmin-dev/gamification-with-ai)
[![Backend API](https://img.shields.io/badge/API-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0d0d0d)](https://your-backend-url.vercel.app)

<br/>

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-8B5CF6?style=flat-square&logo=openai&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white)

</div>

---

## 🌟 Why Interactive AI Learning?

Most AI study tools do the same thing: you ask, they answer with a wall of text. That works for looking something up — it doesn't work for actually learning it.

Interactive AI Learning flips that. The AI reads the *type* of topic you're asking about and picks the teaching format that actually fits it — a definition becomes flashcards, an algorithm becomes a timeline, a process becomes a simulation.

- 🎯 **Adaptive** — the AI chooses flashcards, quiz, timeline, diagram, visualization, or simulation based on the topic itself.
- 🎮 **Gamified** — XP, progress tracking, and a mini-challenge at the end of every lesson.
- ⚡ **Resilient** — a local fallback layer keeps lessons generating even if the AI response is incomplete or invalid.
- 📱 **Responsive** — built to work as well on a phone as it does on a desktop.

> The goal isn't another AI chatbot. It's a system where an AI decision engine, structured content, and an interactive UI work together as one product.

---

## ✨ Features

### 🧭 AI-Driven Format Selection
The AI analyzes each topic and returns structured JSON — including the chosen `learning_type`, difficulty, and reasoning — which the frontend uses to render the right experience automatically.

### 🎓 Six Interactive Learning Modes
| Mode | Best for |
|---|---|
| 🃏 Flashcards | Definitions, facts, terminology |
| 🧠 Quiz | Revision, knowledge checks |
| 🧭 Timeline | Sequential concepts, algorithms |
| 🔗 Diagram | Relationships, architecture |
| 📊 Visualization | Comparisons, structured data |
| 🎮 Simulation | Processes, hands-on workflows |

### 🧩 Mini Challenges
Every generated lesson ends with a short, AI-generated challenge — question, options, answer, and explanation — turning passive reading into active recall.

### 🏆 Progress & XP System
Lessons track completion from 0% to 100%, awarding XP on completion to keep the experience feeling like a game rather than a document.

### 🛡️ Validation & Fallback Layer
AI responses are parsed, validated, and — if anything comes back malformed or incomplete — backed by a local fallback generator, so a flaky AI response never breaks the lesson.

### 🕘 Learning History
The homepage surfaces your recent topics instead of static example prompts, so the app feels like it remembers what you've been studying.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React · Vite · Axios |
| **Backend** | Node.js · Express |
| **AI** | OpenRouter (Llama model) |
| **Architecture** | REST API · Structured JSON contracts · Component-mapped rendering |
| **Deployment** | Vercel (frontend & backend deployed as separate projects) |
| **Version Control** | Git · GitHub |

---

## 🚀 Local Development

### Prerequisites
- **Node.js** 18+ and **npm**
- An [OpenRouter API key](https://openrouter.ai)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/RoohuAmin-dev/gamification-with-ai.git
cd gamification-with-ai
```

### 2️⃣ Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file inside `backend/` (see the [table below](#-environment-variables)).

### 4️⃣ Start the backend

```bash
cd backend
npm run dev
```

### 5️⃣ Start the frontend

```bash
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** and start learning. 🎉

---

## 🔑 Environment Variables

### Backend — `backend/.env`

| Variable | Description | Required |
|---|---|---|
| `OPENROUTER_API_KEY` | API key from [openrouter.ai](https://openrouter.ai) | ✅ |
| `PORT` | Port the Express server runs on locally | ⚠️ |

### Frontend — `frontend/.env`

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API (`http://localhost:5000/api` locally, your deployed backend URL in production) | ✅ |

---

## 📂 Project Structure

```
gamification-with-ai/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── config/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # Flashcards, Quiz, Timeline, Diagram, Visualization, Simulation
    │   ├── pages/
    │   ├── services/        # API layer
    │   ├── hooks/           # useProgress, etc.
    │   └── utils/
    └── package.json
```

---

## ☁️ Deployment

Frontend and backend are deployed as **separate Vercel projects**.

### Backend
1. Import the `backend/` directory as a Vercel project.
2. Add `OPENROUTER_API_KEY` as an environment variable.
3. Deploy — Vercel builds the Express app as a serverless function.

### Frontend
1. Import the `frontend/` directory as a separate Vercel project.
2. Set `VITE_API_URL` to your deployed backend's URL.
3. Deploy.

> 🔐 **Note:** If Vercel's deployment protection is enabled on the backend project, disable it (or configure bypass access) so the frontend can reach the API in production.

---

## 🤝 Contributing

1. 🍴 **Fork** the repository
2. 🌿 Create a branch — `git checkout -b feature/your-idea`
3. ✍️ **Commit** your changes — `git commit -m "feat: add something great"`
4. 📤 **Push** — `git push origin feature/your-idea`
5. 🔁 Open a **Pull Request**

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">

### Built with curiosity. Powered by AI. 🚀

[![Try It Live](https://img.shields.io/badge/Try_It_Live-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://gamification-with-ai-by-roohulamin.vercel.app)

</div>