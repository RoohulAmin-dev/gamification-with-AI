# AGENTS.md

## Project Overview
Interactive AI Learning Platform - a React + Node/Express + OpenRouter AI platform that converts any topic into personalized interactive lessons (flashcards, quizzes, timelines, diagrams, visualizations, simulations) with gamification (XP, progress, mini-challenges).

## Commands

### Backend
```bash
cd backend
npm run dev         # Start with nodemon (auto-restart on file changes)
npm start           # Start server (node server.js)
```
Server runs on http://localhost:5000

### Frontend
```bash
cd frontend
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run lint        # Run ESLint
npm run preview     # Preview production build
```
Frontend runs on http://localhost:5173

## Test the API
```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"English Tenses","level":"beginner"}'
```

## Backend Architecture

### Model Fallback Chain (aiService.js)
1. **Primary**: `liquid/lfm-2.5-2.6b:free` (2.6B params, structured outputs, fast)
2. **Secondary**: `minimax/minimax-m3:free` (non-structured, larger context, handles grammar topics better)
3. **Fallback**: `openrouter/free` (auto-router, structured outputs as last resort)

Each model gets 10s delay on 429 rate limit errors before trying the next.

### API Flow
1. `POST /api/generate` → `generateController.js` → `generateAIResponse()` in `aiService.js`
2. AI generates structured JSON with: title, learning_type, content (mode-specific), nextTopic, relatedTopics
3. Response: `{ success: true, data: lesson, isFallback: false }`

### Key Files
- `backend/src/services/aiService.js` - AI service, schema, model cascade
- `backend/src/controllers/generateController.js` - API controller
- `backend/src/routes/generateRoutes.js` - Routes
- `frontend/src/services/api.js` - Frontend API client (points to Vercel deployed backend)
- `frontend/src/pages/Home.jsx` - Main page with topic input
- `frontend/src/components/LessonLayout/LessonLayout.jsx` - Lesson display with learning path

### Authentication
- **Auth flow**: `AuthContext.jsx` manages session via Supabase — supports email/password sign-up/in, Google OAuth, and password reset
- **Sign-up flow**: Collect email, password, and full name → `supabase.auth.signUp()` with `options.data.full_name` → profile upserted to `profiles` table
- **Password reset**: `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password` → `supabase.auth.exchangeCodeForPassword()` + `updateUser()` on the reset page
- **Google OAuth**: `supabase.auth.signInWithOAuth({ provider: 'google' })` — configured in Supabase dashboard under Authentication → Providers
- **Auth components**: `pages/Auth.jsx` (main login/signup form), `pages/ResetPassword.jsx` (password reset form)
- **AuthContext methods**: `signUp`, `signIn`, `signOut`, `resetPassword`, `signInWithGoogle`, `updateProfile`

### Supabase Progress Sync (useProgress.js)
- `user_progress` table: `xp` (int), `completed_lessons` (int), `streak` (int), `total_study_seconds` (int)
- Local state stores `streak` as `{ lastActive, current }` object — must extract `.current` before syncing to integer column
- `total_study_seconds` must be explicitly included in sync payload
- `profiles` table: `id`, `full_name`, `created_at` — populated via `options.data.full_name` on signup

### Frontend Improvements (Wave 1-3)
- **Study time tracking**: `LessonLayout` records session duration on mount/unmount and on lesson completion, syncing to Supabase via `addStudyTime`
- **XP animation**: Smooth count-up animation when XP changes (requestAnimationFrame), plus floating "+10 XP" badge on lesson completion
- **Lesson completion results card**: Shows XP earned, study time, and streak count with celebration animation
- **Persistent progress in navbar**: XP and streak badges visible on every page
- **Streak visualization**: Progress page shows streak tier (cold/warm/hot/blazing) with flame color and flicker animation
- **Mini-challenge safe failure design**: Correct answers highlighted in green, wrong answers in red, explanation shown, "GOT IT" button to continue
- **Achievement badges system**: 12 badges across XP, lessons completed, streak, and study time tiers (bronze/silver/gold), with unlock notifications
- **Lesson difficulty indicator**: Color-coded difficulty badge in lesson header (green/yellow/red)
- **Dead code cleanup**: Removed unused CSS for learning mode selector (removed from Home.jsx) and `aiService.tmp.js` from git
