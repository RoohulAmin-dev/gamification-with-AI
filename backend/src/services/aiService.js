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

const placeholderPatterns = [
    /^continue learning/i,
    /^step\s*\d+$/i,
    /^component\s*\d+$/i,
    /^item\s*\d+$/i,
    /^example$/i,
    /^placeholder/i,
    /^todo$/i,
    /^tbd$/i,
    /^perform action/i,
    /^a step in/i,
    /^key point\s*\d+$/i,
    /^concept\s*\d+$/i,
    /^fact$/i,
    /^introduction$/i,
    /^context$/i,
    /^key stages$/i,
    /^practice$/i,
    /^reflection$/i,
    /^next steps$/i,
    /^stage\s*\d+$/i,
    /^a concise introduction/i,
    /^start by understanding/i,
    /^learn why/i,
    /^try a simple/i,
    /^consider common/i,
    /^use what you learned/i,
    /^identify the goal/i,
    /^gather the key/i,
    /^follow the main/i,
    /^watch for common/i,
    /^review the outcome/i,
    /^regenerate with/i,
    /^wrong\s*[a-d]/i,
    /^another wrong/i,
    /^none of the above$/i,
    /^application$/i,
    /^node\s*\d+$/i,
    /^relates$/i,
    /^illustrates$/i,
    /^applies to$/i
];

const isPlaceholderText = (text) => {
    if (!text || typeof text !== "string") return true;
    const t = text.trim();
    if (t.length < 5) return true;
    return placeholderPatterns.some((re) => re.test(t));
};

const hasMeaningfulContent = (text, minLen = 15) => {
    if (!text || typeof text !== "string") return false;
    const t = text.trim();
    return t.length >= minLen && !isPlaceholderText(t);
};

const contentValidators = {
    flashcards: (content) => {
        if (!Array.isArray(content.cards) || content.cards.length < 5) return false;
        const seen = new Set();
        return content.cards.every((card) => {
            if (!isPlainObject(card)) return false;
            if (typeof card.front !== "string" || !card.front.trim()) return false;
            if (typeof card.back !== "string" || !card.back.trim()) return false;
            if (!hasMeaningfulContent(card.front) || !hasMeaningfulContent(card.back)) return false;
            const key = card.front.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return card.hint === undefined || typeof card.hint === "string";
        });
    },
    quiz: (content) => {
        if (!Array.isArray(content.questions) || content.questions.length < 5) return false;
        return content.questions.every((q) => {
            if (!isPlainObject(q)) return false;
            if (typeof q.question !== "string" || !q.question.trim()) return false;
            if (!hasMeaningfulContent(q.question)) return false;
            if (!Array.isArray(q.options) || q.options.length !== 4) return false;
            if (!q.options.every((opt) => typeof opt === "string" && opt.trim() && hasMeaningfulContent(opt))) return false;
            if (typeof q.answer !== "string" || !q.answer.trim()) return false;
            if (!q.options.includes(q.answer)) return false;
            const uniqueOpts = new Set(q.options.map((o) => o.trim().toLowerCase()));
            return uniqueOpts.size === 4;
        });
    },
    timeline: (content) => {
        if (!Array.isArray(content.steps) || content.steps.length < 6) return false;
        const seen = new Set();
        return content.steps.every((step) => {
            if (!isPlainObject(step)) return false;
            if (typeof step.title !== "string" || !step.title.trim()) return false;
            if (typeof step.description !== "string" || !step.description.trim()) return false;
            if (!hasMeaningfulContent(step.title) || !hasMeaningfulContent(step.description)) return false;
            const key = (step.title + step.description).trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },
    diagram: (content) => {
        if (!Array.isArray(content.nodes) || content.nodes.length < 3) return false;
        if (!Array.isArray(content.connections) || content.connections.length < 2) return false;
        const validNodes = content.nodes.filter((n) => isPlainObject(n)
            && typeof n.id === "string" && n.id.trim()
            && typeof n.label === "string" && n.label.trim()
            && hasMeaningfulContent(n.label));
        if (validNodes.length < 3) return false;
        const nodeIds = new Set(validNodes.map((n) => n.id.trim()));
        const validConns = content.connections.filter((c) => isPlainObject(c)
            && typeof c.from === "string" && typeof c.to === "string"
            && nodeIds.has(c.from) && nodeIds.has(c.to) && c.from !== c.to);
        return validConns.length >= 2;
    },
    visualization: (content) => {
        if (!Array.isArray(content.items) || content.items.length < 5) return false;
        const seen = new Set();
        return content.items.every((item) => {
            if (!isPlainObject(item)) return false;
            if (typeof item.label !== "string" || !item.label.trim()) return false;
            if (!hasMeaningfulContent(item.label)) return false;
            const key = item.label.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },
    simulation: (content) => {
        if (!Array.isArray(content.steps) || content.steps.length < 5) return false;
        const seen = new Set();
        return content.steps.every((step) => {
            if (!isPlainObject(step)) return false;
            if (typeof step.title !== "string" || !step.title.trim()) return false;
            if (typeof step.description !== "string" || !step.description.trim()) return false;
            if (!hasMeaningfulContent(step.title) || !hasMeaningfulContent(step.description)) return false;
            const key = (step.title + step.description).trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
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

const isValidMiniChallenge = (mc) => {
    return mc
        && typeof mc.question === 'string'
        && Array.isArray(mc.options)
        && mc.options.length >= 4
        && mc.options.every((option) => typeof option === 'string')
        && typeof mc.answer === 'string'
        && typeof mc.explanation === 'string';
};

// Helper: create a local fallback lesson matching the existing schema
const createFallbackLesson = (topic, level, forcedMode = null) => {
    const learning_type = forcedMode && allowedLearningTypes.includes(forcedMode) ? forcedMode : 'flashcards';
    const title = `Introduction to ${topic}`;
    const overview = `${topic} is a fundamental concept that encompasses key principles, terminology, and practical applications essential for ${level || 'Beginner'} learners to understand.`;
    const key_points = [
        `Definition and core meaning of ${topic}`,
        `Key terminology and concepts related to ${topic}`,
        `Practical applications and real-world uses of ${topic}`,
        `Common misconceptions and mistakes to avoid with ${topic}`,
        `Best practices and strategies for mastering ${topic}`
    ];
    const mini_challenge = {
        question: `Which of the following best describes the primary purpose of ${topic}?`,
        options: [
            `It provides a framework for understanding and applying key concepts`,
            `It is primarily used for entertainment purposes`,
            `It has no practical real-world applications`,
            `It is only relevant to advanced researchers`
        ],
        answer: `It provides a framework for understanding and applying key concepts`,
        explanation: `${topic} serves as a foundational concept that helps learners organize knowledge and solve problems effectively.`
    };

    const content = {
        overview,
        key_points,
        estimated_time: '10 minutes',
        reason: `Fallback content generated locally for ${learning_type}`,
        mini_challenge
    };

    if (learning_type === 'flashcards') {
        content.cards = [
            { front: `What is ${topic}?`, back: `${topic} is a concept that involves specific principles and terminology essential to its domain.` },
            { front: `Key term within ${topic}`, back: `A fundamental term that describes a core aspect of ${topic} and its function.` },
            { front: `How is ${topic} applied?`, back: `${topic} is applied in practical scenarios to solve real-world problems.` },
            { front: `Common mistake with ${topic}`, back: `A frequent misunderstanding is oversimplifying ${topic} without considering its full context.` },
            { front: `Best practice for ${topic}`, back: `Understanding the foundational principles of ${topic} before applying them in practice.` }
        ];
    } else if (learning_type === 'quiz') {
        content.questions = [
            { question: `What is the primary focus of ${topic}?`, options: ['Understanding core principles', 'Memorizing random facts', 'Avoiding practical application', 'Ignoring fundamentals'], answer: 'Understanding core principles' },
            { question: `Which statement best describes ${topic}?`, options: ['It is irrelevant to modern practice', 'It provides a structured approach to problem-solving', 'It has no defined terminology', 'It is only theoretical'], answer: 'It provides a structured approach to problem-solving' },
            { question: `Why is ${topic} important for learners?`, options: ['It complicates understanding', 'It builds foundational knowledge', 'It discourages critical thinking', 'It limits practical skills'], answer: 'It builds foundational knowledge' },
            { question: `What is a common misconception about ${topic}?`, options: ['It requires no prior knowledge', 'It is only for experts', 'It has no real-world value', 'It is a static, unchanging field'], answer: 'It has no real-world value' },
            { question: `How should one approach learning ${topic}?`, options: ['Skip fundamentals', 'Build understanding progressively', 'Avoid practice', 'Focus only on theory'], answer: 'Build understanding progressively' }
        ];
    } else if (learning_type === 'timeline') {
        content.steps = [
            { title: `Origins of ${topic}`, description: `The early development and initial conceptualization of ${topic} began with foundational research and discovery.` },
            { title: `Key Milestone in ${topic}`, description: `A significant breakthrough or event that shaped the modern understanding of ${topic}.` },
            { title: `Evolution of ${topic}`, description: `How ${topic} transformed over time through new discoveries, theories, and methodologies.` },
            { title: `Modern Developments in ${topic}`, description: `Recent advances and contemporary approaches that define current practice in ${topic}.` },
            { title: `Practical Application of ${topic}`, description: `How ${topic} is applied in real-world scenarios and industries today.` },
            { title: `Future Directions for ${topic}`, description: `Emerging trends and potential future developments in the field of ${topic}.` }
        ];
    } else if (learning_type === 'diagram') {
        content.nodes = [
            { id: 'core', label: `Core Concept of ${topic}` },
            { id: 'principle', label: `Key Principle of ${topic}` },
            { id: 'application', label: `Application of ${topic}` },
            { id: 'outcome', label: `Outcome of ${topic}` }
        ];
        content.connections = [
            { from: 'core', to: 'principle', label: 'defines' },
            { from: 'principle', to: 'application', label: 'enables' },
            { from: 'application', to: 'outcome', label: 'produces' }
        ];
    } else if (learning_type === 'visualization') {
        content.items = [
            { label: `Core Principles of ${topic}`, value: 8 },
            { label: `Practical Applications of ${topic}`, value: 6 },
            { label: `Common Misconceptions about ${topic}`, value: 4 },
            { label: `Best Practices for ${topic}`, value: 7 },
            { label: `Advanced Concepts in ${topic}`, value: 5 }
        ];
    } else if (learning_type === 'simulation') {
        content.steps = [
            { title: `Define the Objective for ${topic}`, description: `Identify what you want to achieve by applying ${topic} in this scenario.` },
            { title: `Gather Required Information for ${topic}`, description: `Collect the necessary data, context, and resources relevant to ${topic}.` },
            { title: `Apply ${topic} Principles`, description: `Use the core principles of ${topic} to analyze the situation and make decisions.` },
            { title: `Evaluate Results of ${topic}`, description: `Assess the outcomes of applying ${topic} and identify what worked or needs adjustment.` },
            { title: `Refine Approach to ${topic}`, description: `Based on evaluation, adjust your understanding and application of ${topic} for better results.` }
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

    console.log('=== AI DIAGNOSTIC START ===');
    console.log(`[DIAG] User prompt: ${cleanPrompt}`);
    console.log(`[DIAG] forcedMode: ${forcedMode}`);
    console.log(`[DIAG] Requested level: ${level || 'Beginner'}`);

    const buildSystemPrompt = (strict = false, forcedMode = null) => {
        const base = `You are an expert teacher who generates complete, lesson-ready educational content.\n\nEvery lesson must include the following top-level fields exactly: title, learning_type, subtype, difficulty, reason, estimated_time, content.\n\nThe content object must include: overview (2-4 sentences), key_points (an array of five concise points), rich learning content, a real-world example, common mistakes, a practical tip, and a mini_challenge object with question, options (array), answer, explanation.\n\nCRITICAL CONTENT RULES:\n- All generated content MUST be topic-specific, meaningful, educational, and non-empty.\n- Every card, question, step, node, item, and option must directly help the learner understand the requested topic.\n- NEVER generate placeholder or generic text such as: "Continue learning...", "Step 1", "Step 2", "Component 1", "Example", "Item 1", "Introduction", "Context", "Key stages", "Practice", "Reflection", "Next steps", "Identify the goal", "Gather the key information", "Follow the main process", "Watch for common mistakes", "Review the outcome", "Wrong A", "Wrong B", "Another wrong option", "None of the above", "Application", "Node 1", "Concept".\n- Every description must contain at least one concrete fact, term, or concept related to the topic.\n- Titles must be descriptive and specific, not generic labels.\n\nQUIZ SPECIFIC RULES:\n- Each question must have EXACTLY 4 options.\n- Distribute correct answers across positions A, B, C, and D. Do not always put the correct answer first.\n- All 4 options must be similar in length and quality.\n- Distractors must be plausible and topic-specific, not obviously wrong.\n- The correct answer should NOT be noticeably longer than the distractors.\n\nDIAGRAM SPECIFIC RULES:\n- Generate at least 3 nodes with meaningful, topic-specific labels (not "Example", "Application", "Component 1").\n- Generate at least 2 connections that reference real node IDs.\n- Every node label should describe a real concept, component, or entity from the topic.\n\nTIMELINE SPECIFIC RULES:\n- Generate at least 6 steps with meaningful titles and descriptions.\n- Each step must contain specific historical events, dates, or chronological details.\n- Do NOT use generic titles like "Introduction", "Context", "Practice", "Reflection", "Next steps".\n\nSIMULATION SPECIFIC RULES:\n- Generate at least 5 steps that describe actual actions, decisions, inputs, outputs, or state changes.\n- Each step must be directly related to the topic and contain specific details.\n- Do NOT use generic instructions like "Identify the goal", "Gather information", "Review the outcome".\n\nVISUALIZATION SPECIFIC RULES:\n- Generate at least 5 items with meaningful, topic-specific labels.\n- Items should represent actual comparable aspects of the topic.\n\nFLASHCARD SPECIFIC RULES:\n- Generate at least 5 cards that teach distinct topic-specific concepts.\n- Every front and back must contain meaningful content, not generic labels.\n\nWhen deciding learning_type prefer these mappings but choose what fits best: Definitions → flashcards; Facts → flashcards; Algorithms → timeline; Step-by-step processes → simulation; Relationships → diagram; Comparisons → visualization; Revision/Test → quiz.\n\nReturn ONLY valid JSON that exactly matches the schema. Do not include any explanation, markdown, or text outside the JSON object.`;

        let prompt = base;

        if (forcedMode) {
            prompt += `\n\nHARD REQUIREMENT: The user explicitly requested the "${forcedMode}" learning type. You MUST set learning_type="${forcedMode}" and generate ONLY the content structure required for "${forcedMode}". Do NOT choose flashcards, quiz, or any other learning type. Return the exact schema for "${forcedMode}" — no cards, no questions, no other type's fields as primary content. Every element must be topic-specific and meaningful — no placeholders.`;
        }

        if (strict) {
            prompt += '\n\nSTRICT INSTRUCTIONS: Output must be a single JSON object, with no surrounding text, no markdown fences, no comments. If you cannot produce the requested JSON, return an empty JSON object `{}` (which will trigger fallback on the server). Ensure `mini_challenge` is present and non-empty.';
        } else {
            prompt += '\n\nMake sure `mini_challenge` is included and non-empty. Use the topic and difficulty to tailor examples and tips.';
        }

        return prompt;
    };

    const callModel = async (systemPrompt, userPrompt) => {
        const modelName = "meta-llama/llama-3.1-8b-instruct";
        console.log(`[DIAG] Model: ${modelName}`);

        let response;
        try {
            response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
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
        } catch (axiosErr) {
            console.log('[DIAG] OpenRouter request failed:', axiosErr.message);
            if (axiosErr.response) {
                console.log(`[DIAG] HTTP status: ${axiosErr.response.status}`);
                console.log('[DIAG] Response body:', JSON.stringify(axiosErr.response.data, null, 2));
            }
            throw axiosErr;
        }

        console.log(`[DIAG] HTTP status: ${response.status}`);
        console.log('[DIAG] Raw response structure:', JSON.stringify({
            id: response.data?.id,
            model: response.data?.model,
            choices_count: response.data?.choices?.length,
            usage: response.data?.usage
        }, null, 2));

        const rawContent = response.data?.choices?.[0]?.message?.content || "";
        console.log('=== RAW OPENROUTER CONTENT ===');
        console.log(rawContent);
        console.log('=== END RAW OPENROUTER CONTENT ===');

        return rawContent;
    };

    let lastError = null;
    let retryFeedback = '';
    const attemptCount = 3;
    for (let index = 0; index < attemptCount; index += 1) {
        const label = index === 0 ? 'initial attempt' : `strict retry${index > 1 ? ' ' + index : ''}`;
        let systemPrompt;
        if (index === 0) {
            systemPrompt = buildSystemPrompt(false, forcedMode);
        } else {
            systemPrompt = buildSystemPrompt(true, forcedMode) + retryFeedback;
        }
        try {
            console.log(`aiService.generateAIResponse: ${label}`);
            const rawText = await callModel(systemPrompt, cleanPrompt);
            const parsed = parseAIResponseV2(rawText, cleanPrompt);

            ensureMiniChallenge(parsed, cleanPrompt);
            if (forcedMode && allowedLearningTypes.includes(forcedMode)) {
                const content = parsed.content;
                const isCompatible = (() => {
                    switch (forcedMode) {
                        case 'flashcards': return Array.isArray(content.cards) && content.cards.length >= 5;
                        case 'quiz': return Array.isArray(content.questions) && content.questions.length >= 5;
                        case 'timeline': return Array.isArray(content.steps) && content.steps.length >= 6;
                        case 'diagram': return Array.isArray(content.nodes) && content.nodes.length >= 3 && Array.isArray(content.connections) && content.connections.length >= 2;
                        case 'visualization': return Array.isArray(content.items) && content.items.length >= 5;
                        case 'simulation': return Array.isArray(content.steps) && content.steps.length >= 5;
                        default: return false;
                    }
                })();
                if (isCompatible) {
                    try {
                        validateContentSchema(forcedMode, content);
                        console.log(`[DIAG] Forced mode "${forcedMode}" validation PASSED`);
                        parsed.learning_type = forcedMode;
                    } catch (valErr) {
                        console.log(`[DIAG] Forced mode "${forcedMode}" validation FAILED: ${valErr.message}`);
                        throw new Error(`Forced mode "${forcedMode}" content failed quality validation: ${valErr.message}`);
                    }
                } else {
                    console.log(`[DIAG] Forced mode "${forcedMode}" content structure INCOMPATIBLE`);
                    console.log(`[DIAG] Content keys: ${Object.keys(content).join(', ')}`);
                    throw new Error(`Forced mode "${forcedMode}" but AI returned incompatible content structure.`);
                }
            }

            console.log('=== FINAL RESPONSE ===');
            console.log(JSON.stringify(parsed, null, 2));
            console.log('=== END FINAL RESPONSE ===');
            console.log('=== AI DIAGNOSTIC END ===');
            return parsed;
        } catch (err) {
            lastError = err;
            console.warn(`aiService.generateAIResponse: ${label} failed.`, err.message);
            if (index < attemptCount - 1) {
                console.log(`=== RETRY ${index + 1} ===`);
                console.log(`[DIAG] Retry number: ${index + 1}`);
                console.log(`[DIAG] Requested mode: ${forcedMode || 'auto'}`);
                console.log(`[DIAG] Validation failure: ${err.message}`);
                if (forcedMode && err.message && (err.message.includes('incompatible content structure') || err.message.includes('failed quality validation'))) {
                    retryFeedback = `\n\nPREVIOUS ATTEMPT FAILED: ${err.message} Regenerate the "${forcedMode}" content with meaningful, topic-specific elements. No placeholders such as "Step 1", "Continue learning", "Example", or "Item 1". Every element must contain real educational content about the topic. Return only valid JSON.`;
                } else {
                    retryFeedback = '\n\nThe previous output was invalid. Try again and return only the JSON object with no surrounding text or markdown.';
                }
            }
        }
    }

    console.error('aiService.generateAIResponse: all retries failed, falling back to local content.', lastError?.message);
    try {
        const fallback = createFallbackLesson(cleanPrompt || 'Topic', level, forcedMode);
        console.log('[DIAG] Using FALLBACK content');
        console.log('=== FINAL RESPONSE (FALLBACK) ===');
        console.log(JSON.stringify(fallback, null, 2));
        console.log('=== END FINAL RESPONSE ===');
        console.log('=== AI DIAGNOSTIC END ===');
        return fallback;
    } catch (fallbackErr) {
        console.error('aiService.generateAIResponse: failed to create fallback lesson.', fallbackErr.message);
        console.log('=== AI DIAGNOSTIC END ===');
        throw fallbackErr;
    }
};

const parseAIResponseV2 = (rawText, topicHint = '', options = { allowFallback: false }) => {
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

        if (p.learning_type === 'quiz' && Array.isArray(p.content.questions)) {
            p.content.questions = redistributeQuizAnswers(p.content.questions);
        }

        ensureMiniChallenge(p, p.title || topicHint);

        return p;
    };

    const errors = [];
    for (const c of candidates) {
        const s = c.trim(); if (!s) continue;
        console.log('Trying candidate snippet for JSON parse');
        const parsed = tryParse(s);
        if (!parsed) { errors.push('parse failed'); continue; }
        try {
            console.log('=== PARSED RESPONSE (BEFORE NORMALIZATION) ===');
            console.log(JSON.stringify(parsed, null, 2));
            console.log('=== END PARSED RESPONSE ===');
            const normalized = normalize(parsed);
            console.log('=== NORMALIZED RESPONSE (AFTER NORMALIZATION) ===');
            console.log(JSON.stringify(normalized, null, 2));
            console.log('=== END NORMALIZED RESPONSE ===');
            try {
                validateContentSchema(normalized.learning_type, normalized.content);
                console.log(`=== VALIDATION RESULT: PASSED for "${normalized.learning_type}" ===`);
            } catch (valErr) {
                console.log(`=== VALIDATION RESULT: FAILED for "${normalized.learning_type}" ===`);
                console.log(`[DIAG] Validation failure reason: ${valErr.message}`);
                throw valErr;
            }
            console.log('Returning normalized lesson');
            return normalized;
        } catch (e) { errors.push(e.message || 'normalize error'); }
    }

    if (options.allowFallback) {
        console.warn('parseAIResponseV2: no valid candidate, returning fallback');
        return createFallbackLesson(topicHint || 'Topic', 'Beginner');
    }

    const reason = errors.length ? errors.join(' | ') : 'No valid JSON candidates were parsed.';
    throw new Error(`AI response could not be parsed into a valid lesson. ${reason}`);
};

module.exports = {
    generateAIResponse,
    parseAIResponse: parseAIResponseV2,
    createFallbackLesson
};