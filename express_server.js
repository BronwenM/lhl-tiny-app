const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));

//generates a random string to act as key in URL database
function generateRandomString() {
    //define the alpha-numeric chars that are allowed
    const ALPHA_NUMS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const ID_MAX_LENGTH = 8; //Max length the ID can be

    //variables for managing while loop
    let idString = '';

    //As long as the idString is less than the max length and doesn't randomly end, keep adding a random char to id
    while(idString.length < ID_MAX_LENGTH){
        const newChar = ALPHA_NUMS[Math.floor(Math.random() * ALPHA_NUMS.length)];
        idString += newChar;
        
        //random chance to kill the while loop
        if(Math.random() < 0.25 && idString.length > 3) {
            break;
        }   
    }

    return idString;
}


const urlDatabase = {
    b2xVn2: "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
    res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
    const templateVars = {urls: urlDatabase};
    res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
    console.log(req.body);
    const newID = generateRandomString()
    urlDatabase[newID] = req.body.longURL;
    console.log(urlDatabase);
    
    res.redirect(`/urls/${newID}`);
})

app.get('/u/:id', (req, res) => {
    if(Object.keys(urlDatabase).includes(req.params.id)){ 
        res.redirect(urlDatabase[req.params.id]);
    }
    else {
        res.send('<h1>404 Page Not Found. Bad Link</h1>')
    }
})

app.get('/urls/new', (req, res) => {
    res.render('urls_new');
});

app.get("/urls/:id", (req, res) => {
    const templateVars = {id: req.params.id, longURL: urlDatabase[req.params.id]};
    res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});