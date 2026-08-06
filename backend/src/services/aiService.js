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

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const contentValidators = {
    flashcards: (content) => {
        return Array.isArray(content.cards)
            && content.cards.every((card) => isPlainObject(card)
                && typeof card.front === "string"
                && typeof card.back === "string"
                && (card.hint === undefined || typeof card.hint === "string"));
    },
    quiz: (content) => {
        return Array.isArray(content.questions)
            && content.questions.every((question) => isPlainObject(question)
                && typeof question.question === "string"
                && Array.isArray(question.options)
                && question.options.every((option) => typeof option === "string")
                && typeof question.answer === "string");
    },
    timeline: (content) => {
        return Array.isArray(content.steps)
            && content.steps.every((step) => isPlainObject(step)
                && typeof step.title === "string"
                && typeof step.description === "string");
    },
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

            const learningType = parsed.learning_type;
            if (typeof learningType !== 'string' || !learningType.trim()) {
                errors.push('Missing or invalid learning_type.');
                continue;
            }

            if (!allowedLearningTypes.includes(learningType)) {
                console.warn(`aiService.parseAIResponse: unsupported learning_type "${learningType}". The response will still be returned for frontend fallback.`);
            }

            if (!isPlainObject(parsed.content)) {
                errors.push('The response content must be an object.');
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
            { front: `${topic} — tip`, back: `A practical tip related to ${topic}.` }
        ];
    } else if (learning_type === 'quiz') {
        content.questions = [
            { question: `What is ${topic}?`, options: ['A concept', 'An animal', 'A number'], answer: 'A concept' },
            { question: `Why use ${topic}?`, options: ['To confuse', 'To clarify', 'To ignore'], answer: 'To clarify' }
        ];
    } else if (learning_type === 'timeline') {
        content.steps = [
            { title: 'Step 1', description: `Begin by understanding ${topic}.` },
            { title: 'Step 2', description: `Practice core ideas of ${topic}.` }
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
    const isValid = mc && typeof mc.question === 'string' && Array.isArray(mc.options) && mc.options.length >= 2 && typeof mc.answer === 'string';
    if (isValid) return parsed;

    const fallback = {
        question: parsed.content.overview ? `Which of the following best summarizes the overview?` : `Quick question about ${topic}`,
        options: ['A', 'B', 'C'].slice(0, 3),
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
        const parsed = parseAIResponse(rawText);

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
            const parsed2 = parseAIResponse(rawText2);

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

module.exports = {
    generateAIResponse,
    parseAIResponse
};