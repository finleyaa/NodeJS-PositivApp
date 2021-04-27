/*

Process
- Load opinion word list
- Load articles from news API
- Read through each article finding all words from word list and create sum sentiment ranking
- Store positive articles in file

*/

const request = require("request");
const fs = require("fs");
const HTMLParser = require("node-html-parser");
const APIKEY = "a5684ff069c74930beff5c4ccccbaa06";
const APIURL = "https://newsapi.org/v2/top-headlines?country=gb&apiKey=" + APIKEY;

class SentimentAnalysis {

    start() {
        if (fs.existsSync(`${__dirname}/last_sent_time.txt`)) {
            var lastTimeRan = fs.readFileSync(`${__dirname}/last_sent_time.txt`, "utf8");
            if ((Date.now() / 1000) - parseInt(lastTimeRan) < 3600) {
                return false;
            }
        }
        // "word": rating
        var opinionWords = this.loadOpinionWords(`${__dirname}/opinion_word_list.csv`);
        var articles;

        request(APIURL, {json: true}, (err, res, body) => {
            if (err) {return console.log(err);}
            articles = body.articles;
            console.log("Got articles from newsapi.org");
            this.analyseArticles(articles, opinionWords);
        });
        fs.writeFileSync(`${__dirname}/last_sent_time.txt`, (Date.now() / 1000).toString());
        return true;
    }

    // Load opinion word list
    loadOpinionWords(filepath) {
        var opinionWords = {}
        var wordListLines = fs.readFileSync(filepath, "utf8").split("\n");
        wordListLines.forEach(function(line) {
            let splitLine = line.split(",");
            if (splitLine[0] in opinionWords) {
                return;
            }
            opinionWords[splitLine[0]] = parseInt(splitLine[1]);
        });
        console.log("Opinion words loaded");
        return opinionWords;
    }

    analyseArticles(articles, opinionWords) {
        articles.forEach((a) => {
            if (a.url == null) {
                return;
            }
            request(a.url, (err, res, body) => {
                var articleText = "";
                var root = HTMLParser.parse(body);
                var pElements = root.querySelectorAll("p");
                pElements.forEach(function(p) {
                    articleText += p.innerText;
                });
                var sentiment = this.analyseText(articleText, opinionWords);
                console.log(sentiment);
                if (sentiment > 2) {
                    this.saveArticle(a, sentiment);
                }
            });
        });
    }

    analyseText(text, opinionWords) {
        var sentiment = 0;
        // clean the text
        text = text.replace(".", "");
        text = text.replace("\"", "");

        // calculate sentiment
        var splitText = text.split(" ");
        splitText.forEach(function(w) {
            if (w in opinionWords) {
                sentiment += opinionWords[w];
            }
        });
        return sentiment;
    }

    saveArticle(article, sentiment) {
        const articleDatabase = `${__dirname}/articles.json`;
        var articleJson;
        var rawText = "";

        if (fs.existsSync(articleDatabase)) {
            rawText = fs.readFileSync(articleDatabase);
        }

        if (rawText.length > 0) {
            articleJson = JSON.parse(rawText);
        } else {
            articleJson = {articles: []};
        }

        var alreadyInJson = false;

        articleJson.articles.forEach(function(data) {
            if (data.url == article.url) {
                alreadyInJson = true;
            }
        });
        
        if (alreadyInJson) {
            return;
        }

        var newArticleInfo = {
            source: article.source.name,
            author: article.author,
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.urlToImage,
            date: article.publishedAt,
            sentiment: sentiment
        };

        articleJson.articles.push(newArticleInfo);

        var toWrite = JSON.stringify(articleJson, null, 2);
        fs.writeFileSync(articleDatabase, toWrite);

    }

}

module.exports = SentimentAnalysis;