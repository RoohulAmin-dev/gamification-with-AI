const express = require("express");
const cors = require("cors");

const generateRoutes = require("./routes/generateRoutes");
const errorHandler = require("./middleware/errorHandler");
const { PORT } = require("./config/env");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", generateRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Interactive AI Learning Backend is running 🚀"
    });
});

app.use(errorHandler);

module.exports =  app;