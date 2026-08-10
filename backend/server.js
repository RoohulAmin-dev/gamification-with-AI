const app = require("./src/app");
const { PORT } = require("./src/config/env");

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;