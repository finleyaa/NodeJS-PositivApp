const express = require("express");
const fs = require("fs");
const PORT = process.env.PORT || 8080; // allow heroku to define the port
const SentimentAnalysis = require("./sentiment_analysis");
const AccountManager = require("./account_manager");

const app = express();

// articles request
app.get("/articles", (req, res) => {
    var sentimentAnalysis = new SentimentAnalysis();
    var result = sentimentAnalysis.start(); // begin sentiment analysis process

    var count = req.query.count || 30;

    var returnJson;
    
    if (fs.existsSync(`${__dirname}/articles.json`)) { // if the articles.json file exists
        var articlesJson = JSON.parse(fs.readFileSync(`${__dirname}/articles.json`, "utf8")); // read the json
        returnJson = {status: "200", body: {articles: []}}; // form the response
        var articleAmount = count;
        if (articlesJson.articles.length < count) { articleAmount = articlesJson.articles.length }
        
        // loop through the json backwards until the count is reached, add each article to the response json
        for (var x = articlesJson.articles.length - 1; x > articlesJson.articles.length - articleAmount; x--) {
            returnJson.body.articles.push(articlesJson.articles[x]);
        }
    } else {
        returnJson = {status: "500", body: {error: "Error getting articles from JSON file"}}; // return a 500 error if the file doesn't exist
    }

    res.json(returnJson); // send the response
});

// account request
app.get("/account/:command", (req, res) => {
    var accountManager = new AccountManager();
    var result;
    var returnJson;

    if (req.params.command == "login") { // login request
        if (req.query.hasOwnProperty("username") && req.query.hasOwnProperty("password")) { // check that a username and password were supplied
            if (req.query.username == "" || req.query.password == "") {
                returnJson = {status: "400", body: {error: "Bad request (username and password required)"}}; // 400 error for bad request
            } else {
                result = accountManager.login(req.query.username, req.query.password); // use the AccountManager to login
                if (!result) {
                    returnJson = {status: "200", body: {result: result}}; // login failed
                } else {
                    returnJson = {status: "200", body: {result: true, categories: result}}; // login successful
                }
            }
        } else {
            returnJson = {status: "400", body: {error: "Bad request (username and password required)"}}; // 400 error for bad request
        }
    } else if (req.params.command == "create") { // signup request
        // check that all parameters are supplied
        if (req.query.hasOwnProperty("username") && req.query.hasOwnProperty("email") && req.query.hasOwnProperty("password") && req.query.hasOwnProperty("categories")) {
            if (req.query.username == "" || req.query.password == "" || req.query.email == "" || req.query.categories == "") {
                returnJson = {status: "400", body: {error: "Bad request (username, password, email and categories required)"}}; // 400 error for bad request
            } else {
                result = accountManager.createAccount(req.query.username, req.query.email, req.query.password, req.query.categories); // create an account with the AccountManager
                returnJson = {status: "200", body: {result: result}}; // store the result in the response json
            }
        } else {
            returnJson = {status: "400", body: {error: "Bad request (username, password, email and categories required)"}}; // 400 error for bad request
        }
    } else {
        returnJson = {status: "400", body: {error: "Bad request (access either /login or /create)"}}; // 400 error for bad request if the user hasn't used the login or create path
    }

    res.json(returnJson); // send the response
})

app.get("/logo", (req, res) => { // logo request
    res.sendFile(`${__dirname}/logo.png`); // return the logo file
})

app.listen(PORT, () => console.log("Listening on port " + PORT)); // begin listening on the PORT