# Project Audit

## 1. Current Architecture

### Frontend structure
- React + Vite app in `frontend/`.
- Entry points: `frontend/src/main.jsx`, `frontend/src/App.jsx`.
- Main page: `frontend/src/pages/Home.jsx`.
- Components for each learning type:
  - `frontend/src/components/Flashcards/Flashcards.jsx`
  - `frontend/src/components/Quiz/Quiz.jsx`
  - `frontend/src/components/Timeline/Timeline.jsx`
  - `frontend/src/components/Diagram/Diagram.jsx`
  - `frontend/src/components/Visualization/Visualization.jsx`
  - `frontend/src/components/Simulation/Simulation.jsx`
- Reusable layout wrapper: `frontend/src/components/LessonLayout/LessonLayout.jsx`.
- Local storage helpers and progress hook exist as `frontend/src/utils/progress.js` and `frontend/src/hooks/useProgress.js`.
- Global styling is centralized in `frontend/src/index.css` with CSS variables and utility classes.
- API client wrapper in `frontend/src/services/api.js` points to `http://localhost:5000/api`.

### Backend structure
- Node.js + Express backend in `backend/`.
- Server bootstrap: `backend/server.js` imports `backend/src/app.js`.
- Express app config in `backend/src/app.js`.
- Single API route mounted at `/api/generate` via `backend/src/routes/generateRoutes.js`.
- Controller `backend/src/controllers/generateController.js` handles request validation and response shaping.
- AI service lives in `backend/src/services/aiService.js` and performs the OpenRouter call plus JSON extraction/validation.
- Error handling middleware in `backend/src/middleware/errorHandler.js` is present but not crucial to core flow.
- Env loading is in `backend/src/config/env.js`.

### API flow
- Frontend calls `generateContent(prompt, level)` from `frontend/src/services/api.js`.
- That posts to backend endpoint `/api/generate`.
- `generateController.generateContent()` validates prompt, calls `generateAIResponse()`.
- Backend sends OpenRouter chat completion request, receives `response.data.choices[0].message.content`.
- `parseAIResponse()` in `backend/src/services/aiService.js` extracts/cleans JSON and validates structure.
- Backend returns `{ success: true, data: result }` where `result` is parsed AI output.
- Frontend renders `LessonLayout` with `result.data`, choosing one learning component based on `learning_type`.

### AI flow
- System prompt in backend requests structured JSON with an outer schema and content compatible with learning types.
- Allowed learning types are: `flashcards`, `quiz`, `timeline`, `diagram`, `visualization`, `simulation`.
- The user prompt is passed as `Topic: ${prompt}
Difficulty: ${level}`.
- The backend expects the AI to return only valid JSON and tries to parse fenced code blocks or raw JSON.
- The parser logs raw AI response, cleans markdown fences, extracts first JSON object, and validates content.

## 2. Current Features
- Topic input and difficulty selection UI.
- Generate button with loading overlay and animated spinner plus cycling messages.
- Example topic chips for quick input.
- Backend AI content generation via OpenRouter.
- AI result decision summary card inside `LessonLayout`.
- Support for six learning types with specialized interactive components:
  - Flashcards
  - Quiz
  - Timeline
  - Diagram
  - Visualization
  - Simulation
- Fallback UI for unsupported learning types.
- Mini challenge section in the lesson layout.
- Completion / reset controls inside `LessonLayout`.
- Centralized styling and utility classes in CSS.
- Progress helpers and hook exist, though not visibly wired into lesson completion in current code.
- Backend JSON parse logging and robust extraction from markdown/code-fence AI outputs.

## 3. Learning Types

### Flashcards
- Is it working? Yes, as long as AI provides `content.cards` or simple `content.front/back/hint` fallback.
- Is it interactive? Yes: flip card, previous/next, mark known, review again, restart.
- What is missing? No direct integration with `content.interactive`; edge cases if card indexing becomes invalid.
- Quality score: 7/10.

### Quiz
- Is it working? Yes, if AI provides `content.questions`.
- Is it interactive? Yes: select answers, instant correctness feedback, explanation display, navigation, final score.
- What is missing? No support for multiple correct answers or advanced input types; it assumes simple string comparison.
- Quality score: 7/10.

### Timeline
- Is it working? Yes, if AI provides `content.steps`.
- Is it interactive? Moderately: next/previous, expand/collapse details.
- What is missing? No actual timeline visualization or scrollable timeline layout; it is step-by-step card view.
- Quality score: 6/10.

### Diagram
- Is it working? Yes, if AI provides `content.nodes` and `content.connections`.
- Is it interactive? Yes: selectable nodes, connection highlighting, detail panel.
- What is missing? No visual graph rendering; it is a textual node list with connections.
- Quality score: 6/10.

### Visualization
- Is it working? Yes, if AI provides `content.items`.
- Is it interactive? Yes: hover and select items reveal details.
- What is missing? No actual chart or graphical visualization; it is a list with hover effects.
- Quality score: 6/10.

### Simulation
- Is it working? Yes, if AI provides `content.steps`.
- Is it interactive? Yes: step navigation and reset.
- What is missing? No dynamic state model or simulation visuals; it is linear step playback.
- Quality score: 6/10.

## 4. AI Response

### Current JSON schema
The backend expects an object with:
- `title`
- `learning_type`
- `subtype`
- `difficulty`
- `reason`
- `estimated_time`
- `content` (object)

Learning-type-specific content examples are described in prompts:
- `flashcards`: `content.cards` array with `front`, `back`, optional `hint`
- `quiz`: `content.questions` array with `question`, `options`, `answer`, optional `explanation`
- `timeline`: `content.steps` array with `title`, `description`, optional `date`
- `diagram`: `content.nodes` and `content.connections`
- `visualization`: `content.items`
- `simulation`: `content.steps`

### Missing fields
- The frontend uses `result?.data?.mini_challenge`, but `LessonLayout` only renders it if present.
- There is no enforced schema for `content.summary`, `content.overview`, `content.interactive`, or other universal lesson fields in the parsed response.
- `learnining_type` values outside the allowed set are logged as unsupported but returned anyway.
- `content` can be any object if it passes minimal validator checks; many optional fields are not required or validated.

### Weaknesses
- Backend prompt and validation are out of sync: the system prompt suggests a richer `content` shape, but validation only checks minimal learning-type fields.
- The frontend expects `result.data` but also accepts `result` fallback, leading to inconsistent response handling.
- The parser is tolerant of unsupported learning types, which may mask AI misuse or prompt drift.
- There is no strong schema validation for required fields like `mini_challenge`, `overview`, or `interactive`, so the app may receive incomplete lessons.
- The generated UI is based on the learning type but lacks fallback for partial or malformed content within the chosen type.

### Why timeline is selected too often
- The system prompt asks the model to choose a teaching method from the allowed list without giving strong weighting.
- Timeline is a safe, general-purpose format for many topics and may be favored by the model when it cannot confidently choose a more structured interactive type.
- Because the backend does not enforce type-specific richness beyond minimal schema, the model can default to `timeline` and still satisfy the prompt.
- No prompt weighting or decision logic exists to discourage timeline overuse.

### Why mini_challenge is empty
- The frontend only displays `miniChallenge.instructions` or `miniChallenge.prompt`, but if the AI returns an empty object or no `mini_challenge` field, the lesson shows "No mini challenge provided.".
- The backend does not validate the presence of `mini_challenge` or its required keys.
- The AI prompt requests a mini challenge, but there is no structural enforcement and no fallback generation when it is missing.

## 5. Performance

### Possible reasons for slow responses
- AI response time is dominated by the external OpenRouter API call.
- The backend makes a single synchronous call to OpenRouter and waits for completion before responding.
- No caching layer is present.
- The frontend awaits the backend response in a blocking manner, showing only a loading overlay.

### Unnecessary renders
- `Home.jsx` uses a loading interval state update every second, which is fine, but the entire page re-renders when `loadingMessage` changes.
- `LessonLayout` and component state are local and do not appear to cause excessive re-renders.
- Some inline styles and anonymous handler functions may prevent memoization but are not a major performance issue in a small app.

### Slow API calls
- The only backend API call is to OpenRouter; this is the primary source of latency.
- `axios.post()` has no timeout configured; slow network or OpenRouter slowness can block the request indefinitely.
- No retry or fallback strategy is implemented.

### Bottlenecks
- AI call latency is the main bottleneck.
- JSON parsing is lightweight and should not be a bottleneck.
- Frontend route and component loading are minimal, so the backend AI call is the limiting factor.

## 6. UI/UX

### Layout issues
- The app is desktop-first and uses fixed max widths, which may feel narrow on large screens but acceptable.
- The `LessonLayout` content is visually separated, but the mini challenge and completion sections are generic and may feel disconnected.
- The `Timeline` component is not a true timeline visualization; it reads more like a paginated step card.
- The `Diagram` component is not a visual node graph, it is a node list with details.

### Color issues
- Dark glassmorphism theme is consistent.
- The use of white/gray on dark background is readable, but some text inside translucent cards may lack contrast.
- Error text uses hardcoded pink and not the same CSS variable system.

### Typography
- Fonts are consistent and legible.
- Heading scales are good, but many text blocks rely on default font sizes rather than CSS utility classes.
- Some buttons and cards use inline text sizes instead of reusable classes.

### Responsiveness
- The `glass-shell` and form layout likely work on smaller widths, but there is no explicit mobile media query observed.
- The `column-group` layout uses `grid-template-columns: 1fr auto`, which may break on small screens without a responsive fallback.
- Components use fixed `max-width` values but not responsive width adaptation beyond centering.

### Accessibility
- Buttons are styled but there is no explicit focus outline handling; default browser focus may still be present.
- `textarea` and `select` are accessible, but the prompt input has no label element.
- No ARIA attributes or semantic landmarks beyond basic HTML tags.
- Color-only feedback in quiz and flashcards may not be sufficient for color-blind users.

## 7. Bugs
- Backend `aiService.js` previously contained invalid JavaScript due to an accidental prompt block insertion, but that has been fixed.
- `Home.jsx` uses `result?.data?.learning_type || result?.learning_type`, which may produce inconsistent type detection if the API shape varies.
- `LessonLayout` displays `miniChallenge.instructions || miniChallenge.prompt || JSON.stringify(miniChallenge)`, which can render raw JSON if `mini_challenge` is not an object with expected keys.
- `Flashcards` `handleReviewAgain` and `handleKnow` mutate queue state and may leave `currentIndex` pointing outside the new array before cleanup.
- `Quiz` `handleSelect` ignores further clicks after selecting once, which is intended, but there is no feedback if re-clicking the same option.
- `Diagram` uses identifier fallback with index, so duplicate or missing node IDs may create collisions.
- `Visualization` treats `item` as string or object inconsistently; some items may render poorly if data is not normalized.
- `Simulation` and `Timeline` both require `content.steps`, but `content.steps` shape differs per type and is only minimally validated.
- No progress state is wired into actual lesson completion or XP tracking, so progress helpers are currently unused.

## 8. Technical Debt
- Sync backend prompt schema with validator logic; the system prompt requests richer content than current validation enforces.
- Introduce a strict JSON schema validator (e.g. Joi, Zod) for AI response shape instead of ad hoc checks.
- Consolidate frontend response normalization so components share parsed data consistently.
- Replace inline styles in components with reusable CSS classes or styled system.
- Add mobile-first responsive design and media query support.
- Improve accessibility with labels, focus states, keyboard support, and ARIA roles.
- Add robust error handling for unsupported or partial AI responses.
- Add caching or request timeout handling for the AI backend.
- Integrate `useProgress` into lesson completion / reward flow.
- Add unit tests for backend parser, API controller, and frontend component rendering.

## 9. Top 10 Improvements
1. Add strict AI response schema validation and enforce required fields such as `mini_challenge`, `overview`, and `interactive`.
2. Improve prompt engineering to reduce timeline over-selection and ensure consistent learning-type choice.
3. Wire `useProgress` into the UI so completed lessons update XP/streak/time.
4. Add mobile-responsive layout rules for the form, controls, and lesson components.
5. Replace plain `Diagram` and `Visualization` lists with actual graphical renderings or richer visual layouts.
6. Introduce backend request timeouts and retry handling for OpenRouter API calls.
7. Normalize API response handling in frontend to avoid dual `result.data` / `result` usage.
8. Convert inline style objects into reusable CSS utility classes or styled components.
9. Add accessibility improvements: proper labels, focus rings, keyboard navigation, and color contrast checks.
10. Add unit/integration tests for parser behavior, route responses, and learning component rendering.
