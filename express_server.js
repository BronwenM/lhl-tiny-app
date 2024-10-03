//Set up necessary requirements
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

//imports from local files
const { generateRandomString, getUserByEmail, getUserURLs, checkEmptyEmailPassword} = require('./helpers');
const SESSION_KEY = process.env.SESSION_KEY;
const PORT = process.env.PORT;

const app = express();
const salt = bcrypt.genSaltSync(10);

//App setup
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
    name: 'session',
    keys: [SESSION_KEY],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const urlDatabase = {
    b2xVn2: {
        longURL: "http://www.lighthouselabs.ca",
        userID: 'sillyBillyTester'
    },
    "9sm5xK": {
        longURL: "http://www.google.com",
        userID: 'sillyBillyTester'
    },
};

const users = {
    userRandomID: {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur",
    },
    user2RandomID: {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk",
    },
    'sillyBillyTester': {
        id: 'sillyBillyTester',
        email: 'test@tester.com',
        password: '$2a$10$SoJQKJNG3ncOEqiKmhwG8O9QXQxv60GpI3EgDv0XMNw9kNo5mq1KW'
    }
};

//SERVER ACTIONS (GET, POST)

app.get("/", (req, res) => {
    res.redirect("/urls");
});

app.get("/urls", (req, res) => {
    const userURLs = getUserURLs(urlDatabase, req.session.user_id);
    const templateVars = {
        urls: userURLs,
        user: users[req.session.user_id] || ''
    };
    res.render("urls_index", templateVars);
});

//CREATE OPERATION
app.post('/urls', (req, res) => {
    if (req.session.user_id) {
        const newID = generateRandomString();
        if (!urlDatabase[newID]) {
            urlDatabase[newID] = {
                longURL: req.body.longURL,
                userID: req.session.user_id
            };
        } else {
            console.warn("This link has already been shortened!");
        }

        res.redirect(`/urls/${newID}`);
    } else {
        return res.status(403).render('login', { user: '', errorMsg: 'You need to be logged in to create new short links' })
    }
});

//redirect user to link associated with the id
app.get('/u/:id', (req, res) => {
    if (Object.hasOwnProperty(req.params.id)) {
        res.redirect(urlDatabase[req.params.id]);
    } else {
        res.status(404).send('<h1>404 Page Not Found. Bad Link</h1>');
    }
});

//access the 'create urls' page
app.get('/urls/new', (req, res) => {
    if (req.session.user_id) {
        const templateVars = { user: users[req.session.user_id] || '' }
        res.render('urls_new', templateVars);
    } else {
        return res.status(403).render('login', { user: '', errorMsg: 'You need to be logged in to create new short links' })
    }
});

//Get individual URLs by ID, this is not the same as accessing a short link, which redirects to the appropriate site
app.get("/urls/:id", (req, res) => {
    if (!req.session.user_id) {
        return res.status(403).render('login', { user: '', errorMsg: 'You need to be logged in to edit url links' })
    }

    const userURLs = getUserURLs(urlDatabase, req.session.user_id);

    const templateVars = { id: req.params.id, longURL: userURLs[req.params.id], user: users[req.session.user_id] || '' };
    res.render("urls_show", templateVars);
});

//DELETE OPERATION
app.post('/urls/:id/delete', (req, res) => {
    if (!req.session.user_id) {
        return res.status(403).render('login', { user: '', errorMsg: 'You need to be logged in to delete url links' })
    }
    const userURLs = getUserURLs(urlDatabase, req.session.user_id);
    const linkID = req.params.id;

    if (Object.hasOwn(userURLs, linkID)) {
        delete urlDatabase[linkID];
        console.log(urlDatabase);

        res.redirect('/urls');
    } else {
        console.warn("you don't have access to that object");
    }
});

//UPDATE OPERATION
app.post('/urls/:id/update', (req, res) => {
    if (!req.session.user_id) {
        return res.status(403).render('login', { user: '', errorMsg: 'You need to be logged in to delete url links' })
    }

    const linkID = req.params.id;
    const newLink = req.body.newURL;

    if (!req.body.newURL) {
        console.warn("No link was entered! Try again");
        res.redirect(`/urls/${linkID}`); //TODO: Re-rout this to an error page/more cases to erroring
    } else {
        urlDatabase[linkID] = {
            longURL: newLink,
            userID: req.session.user_id
        };

        console.log(urlDatabase);

        res.redirect("/urls");
    }
});

//LOGIN OPERATION
app.get('/login', (req, res) => {
    res.render('login', { user: users[req.session.user_id] || '', email: '', errorMsg: '' })
})


app.post('/login', (req, res) => {
    const inputEmail = req.body.email;
    const inputPassword = req.body.password;
    const user = getUserByEmail(users, inputEmail);

    if (!inputPassword && !inputEmail) {
        return res.status(400).render('login', { user: '', email: inputEmail, errorMsg: `Email and password cannot be empty` });
    } else if (!inputEmail || !inputPassword) {
        if (!inputPassword) {
            return res.status(400).render('login', { user: '', email: inputEmail, errorMsg: `Password cannot be empty` });
        }
        return res.status(400).render('login', { user: '', email: inputEmail, errorMsg: `Email cannot be empty` });
    }

    if (user) { //email has to be present therefore correct
        // if (user.password === inputPassword) {
        if (bcrypt.compareSync(inputPassword, user.password)) {
            req.session.user_id = user.id;
            res.redirect('/urls');
        } else { //password is incorrect
            return res.status(401).render('login', { user: users[req.session.user_id] || '', email: inputEmail, errorMsg: 'Password is incorrect' })
        }
    } else { //user has no email associated
        return res.status(401).render('login', { user: users[req.session.user_id] || '', email: inputEmail, errorMsg: `The email ${inputEmail} has no account attached` })
    }
});

//LOGOUT OPERATION
app.post('/logout', (req, res) => {
    console.log("logged out", req.session.user_id);
    req.session.user_id = null;
    res.redirect('/login');
});

//REGISTER OPERATION
app.get('/register', (req, res) => {
    //DONE: Allows users to create a new account while still logged in. Fix this so it can only work/be accessed when logged out
    if (!req.session.user_id) {
        const templateVars = { user: users[req.session.user_id] || '', email: '', errorMsg: '' }
        res.render('register', templateVars);
    } else {
        res.redirect('/urls'); //This could redirect to a profile page to change password or something
    }
});

//create a new user and add it to the user object
//TODO: Modularize the validations
app.post('/register', (req, res) => {
    let userID = generateRandomString();
    const email = req.body.email;
    const password = req.body.password;
    // const username = req.body.username;

    if (getUserByEmail(users, email)) {
        console.warn("An account with this email already exists");
        return res.status(400).render('register', { user: users[req.session.user_id] || '', email: email, errorMsg: `The email ${email} is already associated with an account` });
    }

    if (!users[userID]) { //make sure the userID isn't already in use and we have an email and password
        //if password or email fields are empty. WOO!
        if (!password && !email) {
            return res.status(400).render('register', { user: users[req.session.user_id] || '', email: email, errorMsg: `Email and password cannot be empty` });
        } else if (!email || !password) {
            if (!password) {
                return res.status(400).render('register', { user: users[req.session.user_id] || '', email: email, errorMsg: `Password cannot be empty` });
            }
            return res.status(400).render('register', { user: users[req.session.user_id] || '', email: email, errorMsg: `Email cannot be empty` });
        }

        //create a new user
        const newUser = {
            id: userID,
            email,
            // password
            password: bcrypt.hashSync(password, salt)
        };

        users[userID] = newUser;

        console.log(users);

        //log them in and set the cookie to user with id UserID
        if (users[userID].id) {
            req.session.user_id = users[userID].id;
            res.redirect("/urls");
        }
        else {
            console.warn("failed to add the cookie for a new user");
        }
    }

    if (users[userID]) { //generate a new id and try again
        //FEEDBACK: Rework how to make a new id, just generating a new id could lead to an infinite loop
        //NOTE: With 62 (A-Z + a-z + 0-9) characters available, there is n! / (n-r)! * r! unique combinations
        //Therefore, there would have to be 107,518,933,731 (107.5 billion) ids already generated for this to loop infinitely... still best practices and all
        //(not to mention that the ids can have a random length from 5-10 characters, which further ups the number of unique keys available)
        // tbf the more we loop to find an undused id, the longer we wait.. not good
        userID = generateRandomString();
    }


});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});