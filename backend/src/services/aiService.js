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

const generateAIResponse = async (prompt, level) => {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is not configured.");
    }

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert teacher who generates complete, lesson-ready educational content.

First decide the BEST learning_type based on the topic:
- Definitions → flashcards
- Facts → flashcards
- Algorithms → timeline
- Step-by-step processes → simulation
- Relationships → diagram
- Comparisons → visualization
- Revision/Test → quiz

Never overuse timeline; choose it only for truly sequential or historical topics.

Choose exactly one learning_type from:
- flashcards
- quiz
- timeline
- diagram
- visualization
- simulation

You must always return ONLY valid JSON with this exact schema:
{
  "title":"",
  "learning_type":"",
  "subtype":"",
  "difficulty":"",
  "reason":"",
  "estimated_time":"",
  "content":{}
}

Every lesson MUST include in the top-level content object:
- overview: 2-4 sentences.
- key_points: 5 concise bullet points.
- estimated_time: a realistic duration string.
- reason: a short explanation for choosing the learning_type.
- mini_challenge: an object with question, options, answer, explanation.

Generate richer content:
- flashcards: 5-8 cards.
- quiz: 5-10 questions.
- timeline: 6-10 steps.
- simulation: realistic actions in each step.
- diagram: meaningful nodes and connections.
- visualization: useful comparisons.

Mini_challenge MUST be complete and never empty:
{
  "question":"",
  "options":[""],
  "answer":"",
  "explanation":""
}

Rules:
- Never return markdown.
- Never wrap the JSON inside \`\`\`json.
- Never include any text outside the JSON.
- Do not explain your reasoning.
- Output only the JSON object.

Important:
- The content field must match the selected learning_type.
- Use the exact keys shown above.
- Fill content with rich, educational material related to the topic.`
                    },
                    {
                        role: "user",
                        content: `Topic: ${prompt}\nDifficulty: ${level || "Beginner"}`
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

        const rawText = response.data?.choices?.[0]?.message?.content || "";
        return parseAIResponse(rawText);
    } catch (error) {
        const statusCode = error.response?.status || "N/A";
        const errorBody = error.response?.data;
        const errorMessage = errorBody?.error?.message || error.message;

        console.error(`OpenRouter API request failed. Status: ${statusCode}`);
        console.error("OpenRouter full error response:");
        console.error(JSON.stringify(errorBody, null, 2));
        console.error(`OpenRouter API error: ${errorMessage}`);

        throw error;
    }
};

module.exports = {
    generateAIResponse,
    parseAIResponse
};