const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = 3000;
const API_KEY = "069fa03c38004a28bbcae3d3f8c1d443";

app.get("/news", async (req, res) => {
    try {
        const response = await axios.get(
            `https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${API_KEY}`
        );

        res.json(response.data);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});