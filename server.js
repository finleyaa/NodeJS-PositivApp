const express = require("express");
const fs = require("fs");
const PORT = process.env.PORT || 8080;
const SentimentAnalysis = require("./sentiment_analysis");
const AccountManager = require("./account_manager");

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

app.get("/account/:command", (req, res) => {
    var accountManager = new AccountManager();
    var result;
    var returnJson;

    if (req.params.command == "login") {
        if (req.query.hasOwnProperty("username") && req.query.hasOwnProperty("password")) {
            result = accountManager.login(req.query.username, req.query.password);
            returnJson = {status: "200", body: {result: result}};
        } else {
            returnJson = {status: "400", body: {error: "Bad request (username and password required)"}};
        }
    } else if (req.params.command == "create") {
        if (req.query.hasOwnProperty("username") && req.query.hasOwnProperty("email") && req.query.hasOwnProperty("password") && req.query.hasOwnProperty("categories")) {
            result = accountManager.createAccount(req.query.username, req.query.email, req.query.password, req.query.categories);
            returnJson = {status: "200", body: {result: result.toString()}};
        } else {
            returnJson = {status: "400", body: {error: "Bad request (username, password, email and categories required)"}};
        }
    } else {
        returnJson = {status: "400", body: {error: "Bad request (access either /login or /create)"}};
    }

    res.json(returnJson);
})

app.get("/logo", (req, res) => {
    res.sendFile(`${__dirname}/logo.png`);
})

app.listen(PORT, () => console.log("Listening on port " + PORT));