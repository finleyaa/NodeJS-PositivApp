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

    start() { // begins the whole sentiment analysis process
        if (fs.existsSync(`${__dirname}/last_sent_time.txt`)) { // check when we last ran sentiment analysis
            var lastTimeRan = fs.readFileSync(`${__dirname}/last_sent_time.txt`, "utf8");
            if ((Date.now() / 1000) - parseInt(lastTimeRan) < 3600) { // if it was less than 1 hour ago, cancel the process and return false
                return false;
            }
        }
        // "word": rating
        var opinionWords = this.loadOpinionWords(`${__dirname}/opinion_word_list.csv`); // load in the opinion word list
        var articles;

        request(APIURL, {json: true}, (err, res, body) => { // request the articles from the external API
            if (err) {return console.log(err);}
            articles = body.articles;
            console.log("Got articles from newsapi.org");
            this.analyseArticles(articles, opinionWords); // begin article analysis
        });
        fs.writeFileSync(`${__dirname}/last_sent_time.txt`, (Date.now() / 1000).toString()); // update the time
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

    // Analyse the articles using the opinion word list
    analyseArticles(articles, opinionWords) {
        articles.forEach((a) => {
            if (a.url == null) { // if there is no web link, return
                return;
            }
            request(a.url, (err, res, body) => { // send a request to the web link
                var articleText = "";
                var root = HTMLParser.parse(body);
                var pElements = root.querySelectorAll("p"); // get all text contained within <p></p> tags
                pElements.forEach(function(p) {
                    articleText += p.innerText;
                });
                var sentiment = this.analyseText(articleText, opinionWords); // analyse the text
                console.log(sentiment);
                if (sentiment > 2) {
                    this.saveArticle(a, sentiment); // save the article along with it's sentiment
                }
            });
        });
    }

    // Analyse text
    analyseText(text, opinionWords) {
        var sentiment = 0;
        // clean the text
        text = text.replace(".", "");
        text = text.replace("\"", "");

        // calculate sentiment
        var splitText = text.split(" ");
        splitText.forEach(function(w) { // find each word in the text and search for it in the opinion word list
            if (w in opinionWords) {
                sentiment += opinionWords[w]; // add the assigned sentiment for the word to the total text sentiment
            }
        });
        return sentiment;
    }

    // Save an articles to the json file
    saveArticle(article, sentiment) {
        const articleDatabase = `${__dirname}/articles.json`;
        var articleJson;
        var rawText = "";

        if (fs.existsSync(articleDatabase)) {
            rawText = fs.readFileSync(articleDatabase); // read in the existing json
        }

        if (rawText.length > 0) {
            articleJson = JSON.parse(rawText);
        } else {
            articleJson = {articles: []};
        }

        var alreadyInJson = false;

        articleJson.articles.forEach(function(data) {
            if (data.url == article.url) {
                alreadyInJson = true; // if the article is already in the json then skip it
            }
        });
        
        if (alreadyInJson) {
            return;
        }

        var newArticleInfo = { // format the json for the article
            source: article.source.name,
            author: article.author,
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.urlToImage,
            date: article.publishedAt,
            sentiment: sentiment
        };

        articleJson.articles.push(newArticleInfo); // add it to the json file

        var toWrite = JSON.stringify(articleJson, null, 2);
        fs.writeFileSync(articleDatabase, toWrite); // write back to the file

    }

}

module.exports = SentimentAnalysis;