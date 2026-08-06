const axios = require("axios");
const { OPENROUTER_API_KEY } = require("../config/env");

console.log(`OPENROUTER_API_KEY loaded: ${OPENROUTER_API_KEY ? "YES" : "NO"}`);

const allowedLearningTypes = [
    "flashcards",
    "quiz",
    "timeline",
    "diagram",
    "visualization",
    "simulation"
];

const learningTypeMap = {
    'revision/test': 'quiz',
    'revision': 'quiz',
    'test': 'quiz',
    'comparison': 'visualization',
    'comparisons': 'visualization',
    'architecture': 'diagram',
    'relationship': 'diagram',
    'relationships': 'diagram',
    'process': 'simulation',
    'processes': 'simulation',
    'workflow': 'simulation',
    'workflows': 'simulation',
    'algorithm': 'timeline',
    'algorithms': 'timeline',
    'history': 'timeline',
    'definitions': 'flashcards',
    'definition': 'flashcards',
    'facts': 'flashcards',
    'practice': 'quiz'
};

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const contentValidators = {
    flashcards: (content) => {
        return Array.isArray(content.cards)
            && content.cards.length >= 5
            && content.cards.every((card) => isPlainObject(card)
                && typeof card.front === "string"
                && typeof card.back === "string"
                && (card.hint === undefined || typeof card.hint === "string"));
    },
    quiz: (content) => {
        return Array.isArray(content.questions)
            && content.questions.length >= 5
            && content.questions.every((question) => isPlainObject(question)
                && typeof question.question === "string"
                && Array.isArray(question.options)
                && question.options.length >= 2
                && question.options.every((option) => typeof option === "string")
                && typeof question.answer === "string");
    },
    timeline: (content) => {
        return Array.isArray(content.steps)
            && content.steps.length >= 6
            && content.steps.every((step) => isPlainObject(step)
                && typeof step.title === "string"
                && typeof step.description === "string");
    },
    diagram: (content) => {
        return Array.isArray(content.nodes)
            && Array.isArray(content.connections)
            && content.nodes.length >= 2
            && content.connections.length >= 1;
    },
    visualization: (content) => {
        return Array.isArray(content.items)
            && content.items.length >= 5;
    },
    simulation: (content) => {
        return Array.isArray(content.steps)
            && content.steps.length >= 5
            && content.steps.every((step) => isPlainObject(step)
                && typeof step.title === "string"
                && typeof step.description === "string");
    }
};

const validateContentSchema = (learningType, content) => {
    const validator = contentValidators[learningType];
    if (typeof validator === 'function') {
        const ok = validator(content);
        if (!ok) {
            throw new Error(`Content for learning_type "${learningType}" did not pass the validator.`);
        }
    }
};

const isValidMiniChallenge = (mc) => {
    return mc
        && typeof mc.question === 'string'
        && Array.isArray(mc.options)
        && mc.options.length >= 4
        && mc.options.every((option) => typeof option === 'string')
        && typeof mc.answer === 'string'
        && typeof mc.explanation === 'string';
};

const parseAIResponse = (rawText) => {
    console.log('----- aiService.parseAIResponse: raw AI response -----');
    console.log(rawText);
    console.log('---------------------------------------------------');

    if (!rawText || typeof rawText !== 'string') {
        throw new Error('Empty AI response');
    }

    const cleanedCandidates = [];
    const trimmed = rawText.trim();

    // Case 1: raw text is already valid JSON
    cleanedCandidates.push(trimmed);

    // Case 2: remove markdown fences if present
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
    let m;
    while ((m = fenceRegex.exec(rawText)) !== null) {
        cleanedCandidates.push(m[1].trim());
    }

    // Case 3: extract first JSON object between the first '{' and matching '}'
    const firstOpening = rawText.indexOf('{');
    if (firstOpening !== -1) {
        let braceDepth = 0;
        let closingIndex = -1;
        for (let i = firstOpening; i < rawText.length; i += 1) {
            const char = rawText[i];
            if (char === '{') braceDepth += 1;
            if (char === '}') braceDepth -= 1;
            if (braceDepth === 0) {
                closingIndex = i;
                break;
            }
        }
        if (closingIndex !== -1) {
            cleanedCandidates.push(rawText.slice(firstOpening, closingIndex + 1).trim());
        }
    }

    // Case 4: repair quotes and trailing commas
    const repairText = trimmed
        .replace(/\n```[\s\S]*?```/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/\t/g, ' ')
        .replace(/\r/g, '');
    if (repairText !== trimmed) {
        cleanedCandidates.push(repairText);
    }

    const errors = [];
    for (const candidate of cleanedCandidates) {
        const cleaned = candidate.trim();
        if (!cleaned) continue;

        console.log('----- aiService.parseAIResponse: trying cleaned candidate -----');
        console.log(cleaned);
        console.log('--------------------------------------------------------------');

        try {
            const parsed = JSON.parse(cleaned);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                errors.push('Parsed value is not a JSON object.');
                continue;
            }

            if (typeof parsed.title !== 'string' || !parsed.title.trim()) {
                errors.push('Missing or invalid title.');
                continue;
            }

            if (typeof parsed.difficulty !== 'string' || !parsed.difficulty.trim()) {
                errors.push('Missing or invalid difficulty.');
                continue;
            }

            if (typeof parsed.reason !== 'string' || !parsed.reason.trim()) {
                errors.push('Missing or invalid reason.');
                continue;
            }

            if (typeof parsed.estimated_time !== 'string' || !parsed.estimated_time.trim()) {
                errors.push('Missing or invalid estimated_time.');
                continue;
            }

            let learningType = parsed.learning_type;
            if (typeof learningType !== 'string' || !learningType.trim()) {
                errors.push('Missing or invalid learning_type.');
                continue;
            }

            const normalizedLearningType = learningType.toString().trim().toLowerCase();
            if (!allowedLearningTypes.includes(normalizedLearningType)) {
                const remapped = learningTypeMap[normalizedLearningType];
                if (remapped) {
                    learningType = remapped;
                    parsed.learning_type = remapped;
                } else {
                    console.warn(`aiService.parseAIResponse: unsupported learning_type "${learningType}". Falling back to flashcards.`);
                    learningType = 'flashcards';
                    parsed.learning_type = 'flashcards';
                }
            }

            if (!isPlainObject(parsed.content)) {
                errors.push('The response content must be an object.');
                continue;
            }

            if (typeof parsed.content.overview !== 'string' || !parsed.content.overview.trim()) {
                errors.push('Missing or invalid content.overview.');
                continue;
            }

            if (!Array.isArray(parsed.content.key_points) || parsed.content.key_points.length < 5) {
                errors.push('Missing or invalid content.key_points.');
                continue;
            }

            validateContentSchema(learningType, parsed.content);

            console.log('----- aiService.parseAIResponse: parsing success -----');
            console.log(JSON.stringify(parsed, null, 2));
            console.log('------------------------------------------------------');
            return parsed;
        } catch (err) {
            errors.push(err.message || 'Unknown JSON parse error');
        }
    }

    throw new Error(`AI response could not be parsed as valid JSON. Reasons: ${errors.join(' | ')}`);
};

// Helper: create a local fallback lesson matching the existing schema
const createFallbackLesson = (topic, level, forcedMode = null) => {
    const learning_type = forcedMode && allowedLearningTypes.includes(forcedMode) ? forcedMode : 'flashcards';
    const title = `Intro to ${topic}`;
    const overview = `A concise introduction to ${topic} for ${level || 'Beginner'} learners.`;
    const key_points = [
        `Core idea of ${topic}`,
        `Important terminology`,
        `How it is used in practice`,
        `Common pitfalls`,
        `Next steps to practice`
    ];
    const mini_challenge = {
        question: `Which statement about ${topic} is most accurate?`,
        options: [
            `It's primarily used for practice`,
            `It's unrelated to the topic`,
            `It helps illustrate a key concept`,
            `None of the above`
        ],
        answer: `It helps illustrate a key concept`,
        explanation: `This is a safe fallback challenge highlighting the practical role of the topic.`
    };

    const content = {
        overview,
        key_points,
        estimated_time: '10 minutes',
        reason: `Fallback content generated locally for ${learning_type}`,
        mini_challenge
    };

    // Provide simple content shapes for known types
    if (learning_type === 'flashcards') {
        content.cards = [
            { front: `${topic} — definition`, back: `A brief definition of ${topic}.` },
            { front: `${topic} — use`, back: `A short note on how ${topic} is used.` },
            { front: `${topic} — example`, back: `A real-world example of ${topic}.` },
            { front: `${topic} — common mistake`, back: `A common misunderstanding about ${topic}.` },
            { front: `${topic} — tip`, back: `A practical tip related to ${topic}.` }
        ];
    } else if (learning_type === 'quiz') {
        content.questions = [
            { question: `What is ${topic}?`, options: ['A concept', 'An animal', 'A number', 'A device'], answer: 'A concept' },
            { question: `Why is ${topic} useful?`, options: ['To confuse people', 'To solve problems', 'To waste time', 'To ignore data'], answer: 'To solve problems' },
            { question: `Which field commonly uses ${topic}?`, options: ['Cooking', 'Software', 'Fashion', 'Sports'], answer: 'Software' },
            { question: `What should you avoid when working with ${topic}?`, options: ['Skipping basics', 'Practicing regularly', 'Asking questions', 'Using examples'], answer: 'Skipping basics' },
            { question: `A good first step when learning ${topic} is to:`, options: ['Memorize rules', 'Understand the concept', 'Ignore it', 'Copy blindly'], answer: 'Understand the concept' }
        ];
    } else if (learning_type === 'timeline') {
        content.steps = [
            { title: 'Introduction', description: `Start by understanding the core concept of ${topic}.` },
            { title: 'Context', description: `Learn why ${topic} matters and where it is used.` },
            { title: 'Key stages', description: `Review the main stages or events related to ${topic}.` },
            { title: 'Practice', description: `Try a simple example that uses ${topic}.` },
            { title: 'Reflection', description: `Consider common mistakes and how to avoid them.` },
            { title: 'Next steps', description: `Use what you learned in a real-world scenario.` }
        ];
    } else if (learning_type === 'diagram') {
        content.nodes = [
            { id: 'concept', label: `${topic} concept` },
            { id: 'example', label: 'Example' },
            { id: 'application', label: 'Application' }
        ];
        content.connections = [
            { from: 'concept', to: 'example', label: 'illustrates' },
            { from: 'concept', to: 'application', label: 'applies to' }
        ];
    } else if (learning_type === 'visualization') {
        content.items = [
            { label: `${topic} basics`, value: 1 },
            { label: `${topic} use cases`, value: 2 },
            { label: `Common mistakes`, value: 1 },
            { label: `Best practices`, value: 2 },
            { label: `Real-world example`, value: 1 }
        ];
    } else if (learning_type === 'simulation') {
        content.steps = [
            { title: 'Step 1', description: `Identify the goal of ${topic}.` },
            { title: 'Step 2', description: `Gather the key information and inputs.` },
            { title: 'Step 3', description: `Follow the main process for ${topic}.` },
            { title: 'Step 4', description: `Watch for common mistakes and adjust.` },
            { title: 'Step 5', description: `Review the outcome and lessons learned.` }
        ];
    }

    return {
        title,
        learning_type,
        subtype: '',
        difficulty: level || 'Beginner',
        reason: content.reason,
        estimated_time: content.estimated_time,
        content
    };
};

// Ensure mini_challenge exists and is valid; if missing, synthesize a simple one.
const ensureMiniChallenge = (parsed, topic) => {
    if (!parsed || !parsed.content) return parsed;
    const mc = parsed.content.mini_challenge;
    const isValid = mc && typeof mc.question === 'string' && Array.isArray(mc.options) && mc.options.length >= 4 && mc.options.every((opt) => typeof opt === 'string') && typeof mc.answer === 'string' && typeof mc.explanation === 'string';
    if (isValid) return parsed;

    const fallback = {
        question: parsed.content.overview ? `Which of the following best summarizes the overview?` : `Quick question about ${topic}`,
        options: ['A', 'B', 'C', 'D'],
        answer: 'A',
        explanation: 'Fallback mini-challenge generated locally.'
    };

    parsed.content.mini_challenge = fallback;
    return parsed;
};

const generateAIResponse = async (prompt, level) => {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is not configured.");
    }

    // Detect forced learning mode embedded in prompt: special prefix `FORCE_LEARNING_MODE:mode`
    let forcedMode = null;
    let cleanPrompt = prompt;
    const forcePrefix = 'FORCE_LEARNING_MODE:';
    if (typeof prompt === 'string' && prompt.startsWith(forcePrefix)) {
        const firstLineEnd = prompt.indexOf('\n');
        const header = firstLineEnd === -1 ? prompt : prompt.slice(0, firstLineEnd);
        forcedMode = header.slice(forcePrefix.length).trim().toLowerCase();
        cleanPrompt = firstLineEnd === -1 ? '' : prompt.slice(firstLineEnd + 1).trim();
    }

    const buildSystemPrompt = (strict = false) => {
        const base = `You are an expert teacher who generates complete, lesson-ready educational content.\n\nEvery lesson must include the following top-level fields exactly: title, learning_type, subtype, difficulty, reason, estimated_time, content.\n\nThe content object must include: overview (2-4 sentences), key_points (an array of five concise points), rich learning content, a real-world example, common mistakes, a practical tip, and a mini_challenge object with question, options (array), answer, explanation.\n\nWhen deciding learning_type prefer these mappings but choose what fits best: Definitions → flashcards; Facts → flashcards; Algorithms → timeline; Step-by-step processes → simulation; Relationships → diagram; Comparisons → visualization; Revision/Test → quiz.\n\nReturn ONLY valid JSON that exactly matches the schema. Do not include any explanation, markdown, or text outside the JSON object.`;

        if (strict) {
            return base + '\n\nSTRICT INSTRUCTIONS: Output must be a single JSON object, with no surrounding text, no markdown fences, no comments. If you cannot produce the requested JSON, return an empty JSON object `{}` (which will trigger fallback on the server). Ensure `mini_challenge` is present and non-empty.';
        }

        return base + '\n\nMake sure `mini_challenge` is included and non-empty. Use the topic and difficulty to tailor examples and tips.';
    };

    const callModel = async (systemPrompt, userPrompt) => {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Topic: ${userPrompt}\nDifficulty: ${level || "Beginner"}`
                    }
                ]
            },
            {
                timeout: 60000,
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5000",
                    "X-OpenRouter-Title": "Interactive AI Learning"
                }
            }
        );

        return response.data?.choices?.[0]?.message?.content || "";
    };

    try {
        // 1) First attempt with improved system prompt
        const systemPrompt = buildSystemPrompt(false);
        const rawText = await callModel(systemPrompt, cleanPrompt);
        const parsed = parseAIResponseV2(rawText, cleanPrompt);

        // Ensure mini_challenge exists
        ensureMiniChallenge(parsed, cleanPrompt);

        // If forcedMode supplied, override learning_type
        if (forcedMode && allowedLearningTypes.includes(forcedMode)) {
            parsed.learning_type = forcedMode;
        }

        return parsed;
    } catch (err) {
        console.warn('aiService.generateAIResponse: first attempt failed, trying strict JSON retry.', err.message);

        // Retry once with a stricter instruction
        try {
            const strictPrompt = buildSystemPrompt(true);
            const rawText2 = await callModel(strictPrompt, cleanPrompt);
            const parsed2 = parseAIResponseV2(rawText2, cleanPrompt);

            ensureMiniChallenge(parsed2, cleanPrompt);

            if (forcedMode && allowedLearningTypes.includes(forcedMode)) {
                parsed2.learning_type = forcedMode;
            }

            return parsed2;
        } catch (err2) {
            console.error('aiService.generateAIResponse: strict retry failed, falling back to local content.', err2.message);

            // Final fallback: return locally generated lesson
            try {
                const fallback = createFallbackLesson(cleanPrompt || 'Topic', level, forcedMode);
                return fallback;
            } catch (fallbackErr) {
                console.error('aiService.generateAIResponse: failed to create fallback lesson.', fallbackErr.message);
                throw fallbackErr;
            }
        }
    }
};

const parseAIResponseV2 = (rawText, topicHint = '') => {
    console.log('----- aiService.parseAIResponseV2: raw AI response -----');
    console.log(rawText);
    console.log('---------------------------------------------------');

    if (!rawText || typeof rawText !== 'string') {
        throw new Error('Empty AI response');
    }

    const candidates = [];
    const trimmed = rawText.trim();
    candidates.push(trimmed);

    const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
    let mm;
    while ((mm = fenceRegex.exec(rawText)) !== null) candidates.push(mm[1].trim());

    // extract first balanced JSON-like object
    const firstOpening = rawText.indexOf('{');
    if (firstOpening !== -1) {
        let depth = 0;
        let closeIdx = -1;
        for (let i = firstOpening; i < rawText.length; i++) {
            const c = rawText[i];
            if (c === '{') depth++;
            if (c === '}') depth--;
            if (depth === 0) { closeIdx = i; break; }
        }
        if (closeIdx !== -1) candidates.push(rawText.slice(firstOpening, closeIdx + 1).trim());
    }

    // common repairs
    const repaired = trimmed
        .replace(/\n```[\s\S]*?```/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\t/g, ' ')
        .replace(/\r/g, '');
    if (repaired !== trimmed) candidates.push(repaired);

    const tryParse = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };

    const normalize = (p) => {
        if (!p || typeof p !== 'object') p = {};
        p.title = (typeof p.title === 'string' && p.title.trim()) ? p.title.trim() : (p.content?.overview ? `Intro: ${p.content.overview.slice(0,50)}` : `Lesson`);
        p.difficulty = (typeof p.difficulty === 'string' && p.difficulty.trim()) ? p.difficulty.trim() : 'Beginner';
        p.reason = (typeof p.reason === 'string' && p.reason.trim()) ? p.reason.trim() : `Overview of ${p.title}`;
        p.estimated_time = (typeof p.estimated_time === 'string' && p.estimated_time.trim()) ? p.estimated_time.trim() : '15 minutes';

        let lt = (p.learning_type || '').toString().trim().toLowerCase();
        if (!allowedLearningTypes.includes(lt)) {
            const rem = learningTypeMap[lt];
            if (rem) lt = rem;
            else {
                const st = (p.subtype || '').toString().toLowerCase();
                if (st.includes('quiz') || st.includes('test')) lt = 'quiz';
                else if (st.includes('flash') || st.includes('card') || st.includes('definition')) lt = 'flashcards';
                else if (st.includes('timeline') || st.includes('history') || st.includes('algorithm')) lt = 'timeline';
                else if (st.includes('diagram') || st.includes('architecture') || st.includes('relationship')) lt = 'diagram';
                else if (st.includes('visual') || st.includes('compare')) lt = 'visualization';
                else if (st.includes('simulation') || st.includes('process') || st.includes('workflow')) lt = 'simulation';
                else lt = 'flashcards';
            }
        }
        p.learning_type = lt;

        if (!isPlainObject(p.content)) p.content = { overview: p.content ? String(p.content) : `Introduction to ${p.title || topicHint}` };
        if (typeof p.content.overview !== 'string' || !p.content.overview.trim()) p.content.overview = `${p.title || topicHint} — a concise introduction.`;

        if (!Array.isArray(p.content.key_points)) p.content.key_points = [];
        if (p.content.key_points.length < 5) {
            const sents = p.content.overview.split(/\.\s+/).map(x=>x.trim()).filter(Boolean);
            for (let i=0;i<sents.length && p.content.key_points.length<5;i++) if (!p.content.key_points.includes(sents[i])) p.content.key_points.push(sents[i]);
            while (p.content.key_points.length < 5) p.content.key_points.push(`Key point ${p.content.key_points.length+1} about ${p.title || topicHint}`);
        }

        ensureMiniChallenge(p, p.title || topicHint);

        const ltfill = p.learning_type;
        if (ltfill === 'flashcards') { if (!Array.isArray(p.content.cards)) p.content.cards = []; while (p.content.cards.length < 5) { const k = p.content.key_points[p.content.cards.length] || `Fact`; p.content.cards.push({ front: k, back: `Explanation: ${k}` }); } }
        if (ltfill === 'quiz') { if (!Array.isArray(p.content.questions)) p.content.questions = []; while (p.content.questions.length < 5) { const idx = p.content.questions.length; const kp = p.content.key_points[idx] || `Concept ${idx+1}`; p.content.questions.push({ question: `Which statement best describes: ${kp}?`, options: [kp, 'Wrong A', 'Wrong B', 'None of the above'], answer: kp }); } }
        if (ltfill === 'timeline') { if (!Array.isArray(p.content.steps)) p.content.steps = []; while (p.content.steps.length < 6) p.content.steps.push({ title: `Stage ${p.content.steps.length+1}`, description: `A step in ${p.title}` }); }
        if (ltfill === 'diagram') { if (!Array.isArray(p.content.nodes)) p.content.nodes = []; if (!Array.isArray(p.content.connections)) p.content.connections = []; if (p.content.nodes.length < 2) { p.content.nodes.push({ id: 'n1', label: p.title || 'Concept' }); p.content.nodes.push({ id: 'n2', label: 'Example' }); } if (p.content.connections.length < 1) p.content.connections.push({ from: p.content.nodes[0].id, to: p.content.nodes[1].id, label: 'relates' }); }
        if (ltfill === 'visualization') { if (!Array.isArray(p.content.items)) p.content.items = []; while (p.content.items.length < 5) p.content.items.push({ label: `Item ${p.content.items.length+1}`, value: p.content.items.length+1 }); }
        if (ltfill === 'simulation') { if (!Array.isArray(p.content.steps)) p.content.steps = []; while (p.content.steps.length < 5) p.content.steps.push({ title: `Step ${p.content.steps.length+1}`, description: `Perform action for ${p.title}` }); }

        return p;
    };

    const errors = [];
    for (const c of candidates) {
        const s = c.trim(); if (!s) continue;
        console.log('Trying candidate snippet for JSON parse');
        const parsed = tryParse(s);
        if (!parsed) { errors.push('parse failed'); continue; }
        try {
            const normalized = normalize(parsed);
            try { validateContentSchema(normalized.learning_type, normalized.content); } catch (v) { console.warn('Validation warning after normalization', v.message); }
            console.log('Returning normalized lesson');
            return normalized;
        } catch (e) { errors.push(e.message || 'normalize error'); }
    }

    console.warn('parseAIResponseV2: no valid candidate, returning fallback');
    return createFallbackLesson(topicHint || 'Topic', 'Beginner');
};

module.exports = {
    generateAIResponse,
    parseAIResponse: parseAIResponseV2,
    createFallbackLesson
};