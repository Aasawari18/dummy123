const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;   // ✅ FIX 1
const API_KEY = "069fa03c38004a28bbcae3d3f8c1d443";

async function checkFakeNews(newsText) {

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt =
        "Tell if the following news is FAKE or REAL. Answer in 1 short sentence: " +
        newsText;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
}

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

app.post("/check", async (req, res) => {

    try {

        const { title, description } = req.body;

        const newsText = title + " " + description;

        const result = await checkFakeNews(newsText);

        res.json({ result: result });

    } catch (error) {

        console.log(error.message);

        res.status(500).json({ error: "AI check failed" });

    }

});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});