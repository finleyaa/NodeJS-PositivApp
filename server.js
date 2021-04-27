const express = require("express");
const fs = require("fs");
const PORT = process.env.PORT || 8080;
const SentimentAnalysis = require("./sentiment_analysis")

const app = express();

app.get("/articles", (req, res) => {
    var sentimentAnalysis = new SentimentAnalysis();
    var result = sentimentAnalysis.start();

    var count = req.query.count || 30;

    var returnJson;
    
    if (fs.existsSync(`${__dirname}/articles.json`)) {
        var articlesJson = JSON.parse(fs.readFileSync(`${__dirname}/articles.json`, "utf8"));
        returnJson = {status: "200", body: {articles: []}};
        var articleAmount = count;
        if (articlesJson.articles.length < count) { articleAmount = articlesJson.articles.length }
        
        for (var x = 0; x < articleAmount; x++) {
            returnJson.body.articles.push(articlesJson.articles[x]);
        }
    } else {
        returnJson = {status: "500", body: {error: "Error getting articles from JSON file"}};
    }

    res.json(returnJson);
});

app.get("/logo", (req, res) => {
    res.sendFile(`${__dirname}/logo.png`);
})

app.listen(PORT, () => console.log("Listening on port " + PORT));