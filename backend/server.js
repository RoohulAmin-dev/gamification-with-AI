const { app, PORT } = require("./src/app");

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;