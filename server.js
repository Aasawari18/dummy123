require("dotenv").config();

const natural = require('natural');
const csv = require('csv-parser');
const fs = require('fs');

const classifier = new natural.BayesClassifier();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const API_KEY = process.env.NEWS_API_KEY;

console.log("GEMINI API KEY:",process.env.GEMINI_API_KEY);
console.log("News API KEY:",process.env.NEWS_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function loadFile(filePath, label, callback) {

    console.log("Loading file:", filePath); // 👈 ADD THIS

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const text = row.text || row.title;
            if (text) {
                classifier.addDocument(text, label);
            }
        })
        .on('end', callback);
}

function trainModel(callback) {
    loadFile(__dirname + '/fake.csv', 'fake', () => {
        loadFile(__dirname + '/true.csv', 'real', () => {
            classifier.train();
            console.log("ML Model Trained!");
            callback();
        });
    });
}

async function checkFakeNews(newsText) {

    try {

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt =
            "Tell if the following news is FAKE or REAL. Answer in one short sentence only:\n\n" +
            newsText;

        const result = await model.generateContent(prompt);

        const response = await result.response;

        return response.text();

    } catch (error) {

        console.log("AI Error:", error.message);

        return "AI analysis failed";

    }
}


app.get("/news", async (req, res) => {

    try {

        const response = await axios.get(
            `https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${API_KEY}`
        );

        const articles = response.data.articles.slice(0,3);

        for (let article of articles) {

            try {

                const newsText = (article.title || "") + " " + (article.description || "");

                const mlResult = classifier.classify(newsText);
                article.ml_verdict = mlResult;

                const result = await checkFakeNews(newsText);
                article.ai_verdict = result;
                if (result === "AI analysis failed") {

                   article.ai_verdict = "Using ML fallback";
                } else {
                
                    article.ai_verdict = result;
               }

            } catch (err) {

                article.ml_verdict = "ML analysis failed";

            }

        }

        res.json({
            status: "ok",
            totalResults: articles.length,
            articles: articles
        });

    } catch (error) {

        console.log("News Fetch Error:", error.message);

        res.status(500).json({
            error: "Failed to fetch news"
        });

    }

});

app.post("/chat", async (req,res)=>{

    console.log("Chat API HIT"); // 👈 ADDED THIS

 try{

  const {message}=req.body;

const model=genAI.getGenerativeModel({
model:"gemini-2.0-flash"
});

const result=await model.generateContent(message);

const response=await result.response;

res.json({
reply:response.text()
});

}

catch(error){

console.log(error);

res.status(500).json({
reply:"AI failed"
});

}

});

app.get("/test-ai", async (req, res) => {

    try {

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent("Say hello in one sentence.");

        const response = await result.response;

        res.json({
            message: response.text()
        });

    } catch (error) {

        console.log("Test AI Error:", error.message);

        res.status(500).json({
            error: error.message
        });

    }

});

app.post("/analyze", async (req, res) => {

    try {

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "No text provided" });
        }

        // ✅ ML prediction
        const mlResult = classifier.classify(text);
       
        // ✅ AI prediction
        let aiResult = "";
        try {
            aiResult = await checkFakeNews(text);
        } catch (err) {
            aiResult = "AI failed";
        }

        res.json({
            ml_verdict: mlResult,
            ai_verdict: aiResult === "AI analysis failed" 
                 ? "AI unavailable, using ML result"
                : aiResult
        });

    } catch (error) {
        console.log("Analyze Error:", error.message);

        res.status(500).json({
            error: "Analysis failed"
        });
    }
});

trainModel(() => {
    console.log("ML Ready!");

  app.listen(PORT, () => {

     console.log("Server running on port " + PORT);

 });

});