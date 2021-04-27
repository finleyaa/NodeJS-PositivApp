const fs = require("fs");
const bcrypt = require("bcrypt");
const saltRounds = 10;

class AccountManager {

    login(username, password) {
        if (!fs.existsSync(`${__dirname}/users.json`)) { return false }

        var users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf8"));

        if (!username in users) { return false }
        bcrypt.compareSync(password, users[username], function(err, res) {
            if (res == true) {
                return true;
            }
            return false;
        })
    }

    createAccount(username, email, password, categories) {
        if (!fs.existsSync(`${__dirname}/users.json`)) {
            var users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf8"));
            if (username in users) { return false } // cannot have same username as another account
        }

        var passwordHash = bcrypt.hashSync(password, saltRounds);
        
        users[username] = {email: email, password: passwordHash, categories: categories.split(",")};
        fs.writeFileSync(`${__dirname}/users.json`, JSON.stringify(users, null, 2));

        return true; // account created successfully
    }

}

module.exports = AccountManager;