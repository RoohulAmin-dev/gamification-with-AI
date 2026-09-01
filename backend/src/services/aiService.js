const axios = require("axios");
const { OPENROUTER_API_KEY } = require("../config/env");

const allowedLearningTypes = [
    "flashcards",
    "quiz",
    "timeline",
    "diagram",
    "visualization",
    "simulation"
];

const getLessonSchema = () => {
    const miniChallengeSchema = {
        type: "object",
        properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" }, minItems: 4 },
            answer: { type: "string" },
            explanation: { type: "string" }
        },
        required: ["question", "options", "answer", "explanation"],
        additionalProperties: false
    };

    const contentSchema = {
        type: "object",
        properties: {
            overview: { type: "string" },
            key_points: { type: "array", items: { type: "string" }, minItems: 5 },
            mini_challenge: miniChallengeSchema
        },
        required: ["overview", "key_points", "mini_challenge"],
        additionalProperties: true
    };

    return {
        type: "object",
        properties: {
            title: { type: "string" },
            learning_type: { type: "string", enum: ["flashcards", "quiz", "timeline", "diagram", "visualization", "simulation"] },
            subtype: { type: "string" },
            difficulty: { type: "string" },
            reason: { type: "string" },
            estimated_time: { type: "string" },
            content: contentSchema,
            nextTopic: { type: "string" },
            relatedTopics: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 5
            }
        },
        required: ["title", "learning_type", "subtype", "difficulty", "reason", "estimated_time", "content", "nextTopic", "relatedTopics"],
        additionalProperties: false
    };
};

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const redistributeQuizAnswers = (questions) => {
    if (!Array.isArray(questions)) return questions;
    questions.forEach((q, i) => {
        if (!isPlainObject(q) || !Array.isArray(q.options) || q.options.length !== 4) return;
        if (typeof q.answer !== "string") return;
        const currentIdx = q.options.indexOf(q.answer);
        if (currentIdx === -1) return;
        const targetPos = i % 4;
        if (currentIdx === targetPos) return;
        const opts = [...q.options];
        opts[currentIdx] = opts[targetPos];
        opts[targetPos] = q.answer;
        q.options = opts;
    });
    return questions;
};

const normalize = (p, topicHint = '') => {
    if (!p || typeof p !== 'object') p = {};
    p.title = (typeof p.title === 'string' && p.title.trim()) ? p.title.trim() : `Introduction to ${topicHint || 'Topic'}`;
    p.difficulty = (typeof p.difficulty === 'string' && p.difficulty.trim()) ? p.difficulty.trim() : 'Beginner';
    p.reason = (typeof p.reason === 'string' && p.reason.trim()) ? p.reason.trim() : `Learn about ${p.title}`;
    p.estimated_time = (typeof p.estimated_time === 'string' && p.estimated_time.trim()) ? p.estimated_time.trim() : '15 minutes';
    p.subtype = (typeof p.subtype === 'string') ? p.subtype : '';

    let lt = (p.learning_type || '').toString().trim().toLowerCase();
    if (!allowedLearningTypes.includes(lt)) lt = 'flashcards';
    p.learning_type = lt;

    if (!isPlainObject(p.content)) p.content = { overview: `Introduction to ${p.title || topicHint}` };
    if (typeof p.content.overview !== 'string' || !p.content.overview.trim()) p.content.overview = `${p.title || topicHint} — a concise introduction.`;

    if (!Array.isArray(p.content.key_points)) p.content.key_points = [];

    if (!p.content.mini_challenge && p.mini_challenge) {
        p.content.mini_challenge = p.mini_challenge;
        delete p.mini_challenge;
    }

    if (!p.nextTopic && p.content.nextTopic) {
        p.nextTopic = p.content.nextTopic;
        delete p.content.nextTopic;
    }
    if (!Array.isArray(p.relatedTopics) && Array.isArray(p.content.relatedTopics)) {
        p.relatedTopics = p.content.relatedTopics;
        delete p.content.relatedTopics;
    }

    if (p.learning_type === 'flashcards' && !Array.isArray(p.content.cards) && Array.isArray(p.content.flashcards)) {
        p.content.cards = p.content.flashcards;
        delete p.content.flashcards;
    }

    if (p.learning_type === 'quiz' && Array.isArray(p.content.questions)) {
        p.content.questions = redistributeQuizAnswers(p.content.questions);
    }

    delete p.content.mode_specific;

    if (!p.nextTopic || !p.nextTopic.trim()) {
        p.nextTopic = `Deep dive into ${p.title}`;
    }
    if (!Array.isArray(p.relatedTopics) || p.relatedTopics.length < 2) {
        p.relatedTopics = [
            `Advanced ${p.title}`,
            `Related concepts to ${p.title}`
        ];
    }

    return p;
};

const parseAIResponse = (rawText, topicHint = '') => {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error('Empty AI response');
    }

    const candidates = [];
    const trimmed = rawText.trim();
    candidates.push(trimmed);

    const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
    let mm;
    while ((mm = fenceRegex.exec(rawText)) !== null) candidates.push(mm[1].trim());

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
    }

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

    const repaired = trimmed
        .replace(/\n```[\s\S]*?```/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\t/g, ' ')
        .replace(/\r/g, '');
    if (repaired !== trimmed) candidates.push(repaired);

    for (const c of candidates) {
        const s = c.trim();
        if (!s) continue;
        try {
            const parsed = JSON.parse(s);
            return normalize(parsed, topicHint);
        } catch (e) {
            continue;
        }
    }

    throw new Error('AI response could not be parsed into valid JSON');
};

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

const buildSystemPrompt = (strict = false) => {
    let prompt = `You are an expert teacher who generates complete, lesson-ready educational content. Analyze the topic and choose the learning_type that best fits it: flashcards for definitions, quiz for knowledge checks, timeline for sequential concepts, diagram for relationships, visualization for comparisons, simulation for processes.

Every lesson must include: title, learning_type, subtype, difficulty, reason, estimated_time, content (with overview, key_points of 5 items, mode-specific fields, mini_challenge with question/options/answer/explanation), nextTopic, and relatedTopics (2-5 items).

All content must be topic-specific, meaningful, and non-empty. Every card, question, step, node, item, and option must help the learner understand the requested topic.`;

    if (strict) {
        prompt += '\n\nSTRICT: Output ONLY valid JSON with no surrounding text, markdown, or comments. If you cannot produce valid JSON, return {} only.';
    }

    return prompt;
};

const PRIMARY_MODEL = "liquid/lfm-2.5-2.6b:free";
const SECONDARY_MODEL = "minimax/minimax-m3:free";
const FALLBACK_ROUTER = "openrouter/free";

const callModel = async (systemPrompt, userPrompt, modelName, level, useStructuredOutput = true) => {
    const payload = {
        model: modelName,
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
    };

    if (useStructuredOutput) {
        payload.response_format = {
            type: "json_schema",
            json_schema: {
                name: "lesson_response",
                strict: true,
                schema: getLessonSchema()
            }
        };
    }

    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        payload,
        {
            timeout: 120000,
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5000",
                "X-OpenRouter-Title": "Interactive AI Learning"
            }
        }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content || "";

    if (!rawContent || rawContent.trim() === '') {
        throw new Error('Empty response from model');
    }

    return rawContent;
};

const generateAIResponse = async (prompt, level) => {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is not configured.");
    }

    const cleanPrompt = typeof prompt === 'string' ? prompt.trim() : '';
    const levelStr = level || 'Beginner';

    const models = [
        { name: PRIMARY_MODEL, structured: true, strict: false, label: 'primary' },
        { name: SECONDARY_MODEL, structured: false, strict: true, label: 'secondary (non-structured)' },
        { name: FALLBACK_ROUTER, structured: true, strict: true, label: 'fallback router' }
    ];

    for (let attempt = 0; attempt < models.length; attempt++) {
        const { name: modelName, structured, strict, label } = models[attempt];

        if (attempt > 0) {
            console.warn(`aiService.generateAIResponse: retrying with ${label} model after previous failure.`);
        }

        try {
            const systemPrompt = buildSystemPrompt(strict);
            const rawText = await callModel(systemPrompt, cleanPrompt, modelName, levelStr, structured);
            const parsed = parseAIResponse(rawText, cleanPrompt);
            ensureMiniChallenge(parsed, cleanPrompt);


            return parsed;
        } catch (err) {
            console.warn(`aiService.generateAIResponse: attempt ${attempt + 1} (${label}) failed.`, err.message);

            if (err.message.includes('429') || err.message.includes('rate')) {
                console.warn('Rate limited, waiting 10 seconds before next attempt...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            continue;
        }
    }

    throw new Error('All models failed to produce a valid lesson.');
};

module.exports = {
    generateAIResponse,
    parseAIResponse,
    getLessonSchema
};
