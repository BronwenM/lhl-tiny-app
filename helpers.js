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

const getUserByEmail = (userList, userEmail) => {
    for (const userIDs in userList) {
        if (userList[userIDs].email === userEmail) {
            return userList[userIDs];
        }
    }
}

const getUserURLs = (database, uid) => {
    const userURLs = {};
    for(urlID in database){
        if(database[urlID].userID === uid){
            userURLs[urlID] = database[urlID].longURL;
        }
    }

    return userURLs;
}

//TODO: Figure out a way to make this work

const checkEmptyEmailPassword = (emailInput, passwordInput, callback) => {
    let errorMsg = '';

    if (!passwordInput && !emailInput) {
        errorMsg = `Email and password cannot be empty`;
        callback(errorMsg)
    } else if (!emailInput || !passwordInput) {
        if (!passwordInput) {
            errorMsg = `Password cannot be empty`;
            callback(errorMsg)
        }
        errorMsg = `Email cannot be empty`;
        callback(errorMsg)
    }
}

/* const checkEmptyEmailPassword = (emailInput, passwordInput, renderPage, result) => {

    if (!passwordInput && !emailInput) {
        return result.status(400).render(renderPage, { user: '', email: emailInput, password: passwordInput, errorMsg: `Email and password cannot be empty` });
    } else if (!emailInput || !passwordInput) {
        if (!passwordInput) {
            return result.status(400).render(renderPage, { user: '', email: emailInput, password: passwordInput, errorMsg: `Password cannot be empty` });
        }
        return result.status(400).render(renderPage, { user: '', email: emailInput, password: passwordInput, errorMsg: `Email cannot be empty` });
    }
} */

module.exports = {generateRandomString, getUserByEmail, getUserURLs, checkEmptyEmailPassword}