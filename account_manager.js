const fs = require("fs");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

class AccountManager {

    login(username, password) {
        if (!fs.existsSync(`${__dirname}/users.json`)) { return false }

        var users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf8"));

        if (!username in users) { return false }
        var comparison = bcrypt.compareSync(password, users[username].password);
        if (comparison) {
            return users[username].categories;
        } else {
            return false;
        }
    }

    createAccount(username, email, password, categories) {
        var users = {};
        if (fs.existsSync(`${__dirname}/users.json`)) {
            users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf8"));
            if (username in users) { return false } // cannot have same username as another account
        }

        var passwordHash = bcrypt.hashSync(password, saltRounds);
        
        users[username] = {email: email, password: passwordHash, categories: categories.split(",")};
        fs.writeFileSync(`${__dirname}/users.json`, JSON.stringify(users, null, 2));

        return true; // account created successfully
    }

}

module.exports = AccountManager;