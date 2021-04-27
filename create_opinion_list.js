const fs = require("fs");

// load WordNet files
var dataAdjRaw = fs.readFileSync(`${__dirname}/WordNet/dict/data.adj`, "utf8");
var dataAdjLines = dataAdjRaw.split("\n");

var dataAdj = {};

dataAdjLines.splice(0, 29);

dataAdjLines.forEach(function(line) {
    let tempSplitArray = line.split(" ");
    let adjObject = {words: [], synonyms: [], antonyms: []};

    let wordAmountInSet = parseInt(tempSplitArray[3], 16);

    let startCounter = 4;
    let endCounter = startCounter + ((wordAmountInSet - 1) * 2)
    if (wordAmountInSet > 1) {
        for (let x = startCounter; x <= endCounter; x += 2) {
            let word = tempSplitArray[x];
            if (word.includes("(")) {
                word = word.substr(0, word.length - 3);
            }
            adjObject.words.push(word);
        }
    } else {
        adjObject.words.push(tempSplitArray[startCounter]);
    }

    let linkAmountInSet = parseInt(tempSplitArray[endCounter + 2], 16);

    let linkStartCounter = endCounter + 3;
    let linkEndCounter = linkStartCounter + ((linkAmountInSet - 1) * 4);
    for (let x = linkStartCounter; x <= linkEndCounter; x += 4) {
        let pointer = tempSplitArray[x];
        let linkId = tempSplitArray[x + 1];
        if (pointer == "&") {
            adjObject.synonyms.push(linkId);
        } else if (pointer == "!") {
            adjObject.antonyms.push(linkId);
        }
    }

    //console.log(adjObject);
    dataAdj[tempSplitArray[0]] = adjObject;
})

var originalAdjSet = fs.readFileSync(`${__dirname}/original_adj_set.csv`, "utf8").split("\n");
var originalOpinionWords = {};

var opinionWords = [];

originalAdjSet.forEach(function(line) {
    let splitLine = line.split(",");
    let tempObject = {word: splitLine[1], rating: parseInt(splitLine[2])};
    originalOpinionWords[splitLine[0]] = tempObject;
})

//var fileWriter = fs.createWriteStream("opinion_word_list.csv", {flags: "a"});
var completedIds = [];

Object.keys(originalOpinionWords).forEach(function(id) {
    recursiveWordSearch(id, originalOpinionWords[id].rating);
})

function recursiveWordSearch(id, sentiment) {
    if (completedIds.includes(id)) {
        return;
    }
    completedIds.push(id);
    let words = dataAdj[id].words;
    words.forEach(function(w) {
        fs.appendFileSync(`${__dirname}/opinion_word_list.csv`, w + "," + sentiment + "\n");
    });
    let synonyms = dataAdj[id].synonyms;
    let antonyms = dataAdj[id].antonyms;
    synonyms.forEach(function(sId) {
        recursiveWordSearch(sId, sentiment);
    });
    antonyms.forEach(function(aId) {
        recursiveWordSearch(aId, -sentiment);
    });
}

// var fileWriter = fs.createWriteStream("opinion_word_list.csv", {flags: "a"});

// opinionWords.forEach(function(item) {
//     fileWriter.write(item.word + "," + item.rating + "\n");
// });

// fileWriter.close();