const { generateAIResponse } = require("../services/aiService");

const generateContent = async (req, res) => {
    try {
        const { prompt, level } = req.body;
        const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";

        if (!normalizedPrompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required."
            });
        }

        const result = await generateAIResponse(normalizedPrompt, level);

        return res.status(200).json({
            success: true,
            data: result,
            isFallback: false
        });
    } catch (error) {
        console.error(error);

        const isDevelopment = process.env.NODE_ENV !== "production";
        const statusCode = error.response?.status || error.statusCode || 500;
        const message = isDevelopment ? error.message : "Internal Server Error";
        const details = isDevelopment
            ? {
                error: error.message,
                stack: error.stack
            }
            : {};

        return res.status(statusCode).json({
            success: false,
            message,
            ...details
        });
    }
};

module.exports = {
    generateContent
};
