const express = require("express");
const cookieParser = require('cookie-parser');
const e = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//generates a random string to act as key in URL database
//this could be done with math.random and a different base encode, but this allows for both upper and lower case letters to be used, as well as the option to use symbols, if added to the ALPHA_NUMS string
const generateRandomString = () => {
    //define the alpha-numeric chars that are allowed
    const ALPHA_NUMS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const ID_MAX_LENGTH = 10; //Max length the ID can be

    //variables for managing while loop
    let idString = '';

    //As long as the idString is less than the max length and doesn't randomly end, keep adding a random char to id
    while (idString.length < ID_MAX_LENGTH) {
        const newChar = ALPHA_NUMS[Math.floor(Math.random() * ALPHA_NUMS.length)];
        idString += newChar;

        //random chance to kill the while loop. Allows for random length for links between 5 & 10 chars
        if (Math.random() < 0.25 && idString.length > 4) {
            break;
        }
    }

    return idString;
}

const getUserByEmail = (userEmail) => {
    for (const userIDs in users) {
        if (users[userIDs].email === userEmail) {
            return users[userIDs];
        }
    }
}

/* const checkEmptyEmailPassword = (email, password) => {
    if (!password && !email) {
        return res.status(400).render('register', { user: users[req.cookies["user_id"]] || '', email: email, errorMsg: `Email and password cannot be empty` });
    } else if (!email || !password) {
        if (!password) {
            return res.status(400).render('register', { user: users[req.cookies["user_id"]] || '', email: email, errorMsg: `Password cannot be empty` });
        }
        return res.status(400).render('register', { user: users[req.cookies["user_id"]] || '', email: email, errorMsg: `Email cannot be empty` });
    }
} */

const urlDatabase = {
    b2xVn2: "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com",
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
        password: 'asdf'
    }
};

//SERVER ACTIONS (GET, POST)

app.get("/", (req, res) => {
    res.redirect("/urls");
});

// app.get("/urls.json", (req, res) => {
//     res.json(urlDatabase);
// });

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
    const templateVars = {
        urls: urlDatabase,
        user: users[req.cookies["user_id"]] || ''
    };
    res.render("urls_index", templateVars);
});

//CREATE OPERATION
app.post('/urls', (req, res) => {
    if(req.cookies["user_id"]){
        const newID = generateRandomString();
        if (!urlDatabase[newID]) {
            urlDatabase[newID] = req.body.longURL;
        } else {
            console.warn("This link has already been shortened!");
        }
        console.log(urlDatabase);
        
        res.redirect(`/urls/${newID}`);
    } else {
        return res.send("<html><body><p>Only Authorized users can create new short links</p></body></html>\n")
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
    if(req.cookies["user_id"]){
        const templateVars = { user: users[req.cookies["user_id"]] || '' }
        res.render('urls_new', templateVars);
    } else {
        res.redirect('/login');
    }
});

//Get individual URLs by ID, this is not the same as accessing a short link, which redirects to the appropriate site
app.get("/urls/:id", (req, res) => {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] || '' };
    res.render("urls_show", templateVars);
});

//DELETE OPERATION
app.post('/urls/:id/delete', (req, res) => {
    const linkID = req.params.id;
    // console.log(linkID);

    delete urlDatabase[linkID];
    console.log(urlDatabase);

    res.redirect('/urls');
});

//UPDATE OPERATION
app.post('/urls/:id/update', (req, res) => {
    const newLink = req.body.newURL;
    const linkID = req.params.id;

    // console.log(req.params, req.body);

    if (!req.body.newURL) {
        console.warn("No link was entered! Try again");
        res.redirect(`/urls/${linkID}`);
    } else {
        urlDatabase[linkID] = newLink;

        console.log(urlDatabase);

        res.redirect("/urls");
    }
});

//LOGIN OPERATION
app.get('/login', (req, res) => {
    res.render('login', { user: users[req.cookies["user_id"]] || '', errorMsg: '' })
})


app.post('/login', (req, res) => {
    const inputEmail = req.body.email;
    const inputPassword = req.body.password;
    const user = getUserByEmail(inputEmail);

    if (!inputPassword && !inputEmail) {
        return res.status(400).render('login', { user: '', email: inputEmail, errorMsg: `Email and password cannot be empty` });
    } else if (!inputEmail || !inputPassword) {
        if (!inputPassword) {
            return res.status(400).render('login', { user: '', email: inputEmail, errorMsg: `Password cannot be empty` });
        }
        return res.status(400).render('login', { user: '', email: inputEmail, errorMsg: `Email cannot be empty` });
    }

    if (user) { //email has to be present therefore correct
        if (user.password === inputPassword) {
            res.cookie("user_id", user.id);
            res.redirect('/urls');
        } else { //password is incorrect
            return res.status(403).render('login', { user: users[req.cookies["user_id"]] || '', errorMsg: 'Password is incorrect' })
        }
    } else { //user has no email associated
        return res.status(403).render('login', { user: users[req.cookies["user_id"]] || '', errorMsg: `The email ${inputEmail} has no account attached` })
    }
});

//LOGOUT OPERATION
app.post('/logout', (req, res) => {
    console.log("logged out", req.cookies['user_id']);
    res.clearCookie("user_id");
    res.redirect('/login');
});

//REGISTER OPERATION
app.get('/register', (req, res) => {
    //TODO: Allows users to create a new account while still logged in. Fix this so it can only work/be accessed when logged out
    const templateVars = { user: users[req.cookies["user_id"]] || '', email: '', errorMsg: '' }
    res.render('register', templateVars);
});

//create a new user and add it to the user object
//TODO: Modularize the validations
app.post('/register', (req, res) => {
    let userID = generateRandomString();
    const email = req.body.email;
    const password = req.body.password;
    // const username = req.body.username;

    if (getUserByEmail(email)) {
        console.warn("An account with this email already exists");
        return res.status(400).render('register', { user: users[req.cookies["user_id"]] || '', email: email, errorMsg: `The email ${email} is already associated with an account` });
    }

    if (!users[userID]) { //make sure the userID isn't already in use and we have an email and password
        //if password or email fields are empty. WOO!
        if (!password && !email) {
            return res.status(400).render('register', { user: users[req.cookies["user_id"]] || '', email: email, errorMsg: `Email and password cannot be empty` });
        } else if (!email || !password) {
            if (!password) {
                return res.status(400).render('register', { user: users[req.cookies["user_id"]] || '', email: email, errorMsg: `Password cannot be empty` });
            }
            return res.status(400).render('register', { user: users[req.cookies["user_id"]] || '', email: email, errorMsg: `Email cannot be empty` });
        }

        //create a new user
        const newUser = {
            id: userID,
            email,
            password
        };
        users[userID] = newUser;

        console.log(users);

        //log them in and set the cookie to user with id UserID
        if (users[userID].id) {
            res.cookie("user_id", users[userID].id);
            res.redirect("/urls");
        }
        else {
            console.warn("failed to add the cookie for a new user");
        }
    }

    if (users[userID]) { //generate a new id and try again
        userID = generateRandomString();
    }


});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});