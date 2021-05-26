const fs = require("fs");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

class AccountManager {

    login(username, password) { // login request
        if (!fs.existsSync(`${__dirname}/users.json`)) { return false } // if there are no users then return false

        var users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf8")); // load the users json file

        if (!users.hasOwnProperty(username)) { return false }
        var comparison = bcrypt.compareSync(password, users[username].password); // use bcrypt to check the password hash
        if (comparison) { // if the passwords are the same log the user in
            return users[username].categories;
        } else { // otherwise return false
            return false;
        }
    }

    createAccount(username, email, password, categories) { // sign up request
        var users = {};
        if (fs.existsSync(`${__dirname}/users.json`)) { // if the users json file already exists
            users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf8")); // load the json
            if (username in users) { return false } // cannot have same username as another account so return false if so
        }

        var passwordHash = bcrypt.hashSync(password, saltRounds); // create the password hash using bcrypt
        
        users[username] = {email: email, password: passwordHash, categories: categories.split(",")}; // format the users json
        fs.writeFileSync(`${__dirname}/users.json`, JSON.stringify(users, null, 2)); // write the json back to the users json file

        return true; // account created successfully
    }

}

module.exports = AccountManager;