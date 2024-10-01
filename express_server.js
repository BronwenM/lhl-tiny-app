const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));

//generates a random string to act as key in URL database
//this could be done with math.random and a different base encode, but this allows for both upper and lower case letters to be used, as well as the option to use symbols, if added to the ALPHA_NUMS string
function generateRandomString() {
    //define the alpha-numeric chars that are allowed
    const ALPHA_NUMS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const ID_MAX_LENGTH = 10; //Max length the ID can be

    //variables for managing while loop
    let idString = '';

    //As long as the idString is less than the max length and doesn't randomly end, keep adding a random char to id
    while(idString.length < ID_MAX_LENGTH){
        const newChar = ALPHA_NUMS[Math.floor(Math.random() * ALPHA_NUMS.length)];
        idString += newChar;
        
        //random chance to kill the while loop. Allows for random length for links between 5 & 10 chars
        if(Math.random() < 0.25 && idString.length > 4) {
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
    res.redirect("/urls");
});

// app.get("/urls.json", (req, res) => {
//     res.json(urlDatabase);
// });

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
    const templateVars = {urls: urlDatabase};
    res.render("urls_index", templateVars);
});

//CREATE OPERATION
app.post('/urls', (req, res) => {

    const newID = generateRandomString();
    if(!urlDatabase[newID]){
        urlDatabase[newID] = req.body.longURL;
    }
    else {
        alert("This link has already been shortened!");
    }
    console.log(urlDatabase);
    
    res.redirect(`/urls/${newID}`);
})

//redirect user to link associated with the id
app.get('/u/:id', (req, res) => {
    if(Object.hasOwnProperty(req.params.id)){ 
        res.redirect(urlDatabase[req.params.id]);
    }
    else {
        res.send('<h1>404 Page Not Found. Bad Link</h1>')
    }
})

//access the 'create urls' page
app.get('/urls/new', (req, res) => {
    res.render('urls_new');
});

//Get individual URLs by ID, this is not the same as accessing a short link, which redirects to the appropriate site
app.get("/urls/:id", (req, res) => {
    const templateVars = {id: req.params.id, longURL: urlDatabase[req.params.id]};
    res.render("urls_show", templateVars);
});

//DELETE OPERATION
app.post('/urls/:id/delete', (req, res) => {
    const linkID = req.params.id;
    console.log(linkID);

    delete urlDatabase[linkID];
    console.log(urlDatabase);

    res.redirect('/urls');
})

//UPDATE OPERATION
app.post('/urls/:id/update', (req, res) => {
    const newLink = req.body.newURL;
    const linkID = req.params.id;

    console.log(req.params, req.body);
    
    if(!req.body.newURL){
        console.warn("No link was entered! Try again");
        res.redirect(`/urls/${linkID}`);
    } else {
        urlDatabase[linkID] = newLink;
    
        console.log(urlDatabase);
        
        res.redirect("/urls");
    }
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});