const express = require("express");
const router = express.Router();

const { generateContent } = require("../controllers/generateController");

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend routing works."
    });
});

router.get("/health", (req, res) => {
    res.json({
        server: "running",
        ai: "connected",
        version: "1.0"
    });
});

router.post("/generate", generateContent);

module.exports = router;


