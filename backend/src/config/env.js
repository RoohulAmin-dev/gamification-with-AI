const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
    PORT: process.env.PORT || 5000,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
};
