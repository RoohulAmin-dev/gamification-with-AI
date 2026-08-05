# PROJECT CONTEXT

## Project Name

Interactive AI Learning Platform

---

## Project Goal

This platform transforms AI-generated text into engaging learning experiences instead of showing long paragraphs.

The AI receives a topic and difficulty level, decides the best teaching strategy, generates structured JSON, and the frontend renders an interactive lesson.

The goal is NOT to build another chatbot.

The goal is to improve learning.

---

# Tech Stack

Frontend
- React
- Vite
- Axios
- CSS

Backend
- Node.js
- Express
- OpenRouter API

Deployment
- Vercel

---

# Architecture

Frontend

↓

POST /api/generate

↓

Express Backend

↓

OpenRouter LLM

↓

JSON Parser

↓

React Components

---

# Current Learning Types

1. Flashcards
2. Quiz
3. Timeline
4. Diagram
5. Visualization
6. Simulation

Every learning type has its own React component.

---

# Current Backend Status

Backend is COMPLETE.

The backend is stable.

Do NOT modify:

- API routes
- Express structure
- Controller logic
- JSON parser
- AI system prompt
- Validation
- OpenRouter integration

Unless explicitly requested.

---

# Current Frontend Status

The application works correctly.

Users can:

- Enter topic
- Select difficulty
- Generate lesson
- View interactive lesson
- Complete lesson

---

# Current Problems

Do NOT redesign backend.

Focus ONLY on frontend improvements.

Current issues:

- UI looks basic
- Layout needs premium appearance
- Better spacing
- Better typography
- Better glassmorphism
- Better animations

---

# Current Design Goal

Style:

- Apple
- Linear
- Premium SaaS
- Glassmorphism
- Soft Neumorphism

Theme:

Light Theme

Use:

- Frosted glass
- Soft shadows
- Large border radius
- Smooth transitions
- Premium spacing
- Excellent readability

Avoid:

- Neon colors
- Dark theme
- Heavy gradients
- Low contrast
- Tiny fonts

---

# Rules

Never change:

Backend

System Prompt

AI logic

Learning Flow

API

JSON schema

Only improve:

UI

UX

Animations

Responsiveness

Accessibility

Visual hierarchy

---

# Coding Style

Keep components modular.

Avoid duplicated CSS.

Use reusable styles.

Keep code clean.

Do not rewrite working code.

Improve instead of replacing.

---

# Priority

1. Preserve functionality.
2. Improve UI.
3. Improve UX.
4. Keep project stable.