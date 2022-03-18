'use strict';
const JeopardyURL = "https://jservice.io/api/" //API URL
var find = function(name){return document.getElementById(name)}
function getRandomInt(min, max) { // A function that returns a random integer
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}  
async function get(specifiers) { //Constructed with the help of discord user 190n#1979.
    try {
        const fetchcategories = await fetch(JeopardyURL + specifiers);
        const categories = await fetchcategories.json();
        return categories;
    } catch (error) {
        console.log("Encountered an error!\n"+error);
        alert('Error getting questions');
    }
}
async function getCategory() { // Returns a random category.
    const offset = getRandomInt(0,18435);
    const category = await get(`categories?offset=${offset}`);
    return category;
}
async function getCategoryQuestions() {
    const categories = []; // an array of categories and questions.
    while (categories.length < 5) { //A category can fail, so we may have to look up >5 categories.
        const category = await getCategory(); //Pulls a random category
        const questions = await get(`clues?category=${category[0]['id']}`); //Pulls the questions for a category.
        const values = questions.map(question => question['value']); //Pulls the values of those questions.
        if (!values.includes(null)) {
            /*If a question was a daily double, it has no value in the DB, and I can't use it
            without a lot of extra logic, it's easier to just ignore categories with daily doubles.*/
            const startingValue = Math.min.apply(null, values);
            /*The value of Jeapordy questions changes, the above code
            finds the lowest value question, which then helps find the right
            difficulty curve, even if the questions are from different seasons.*/
            for(let i = 1; i < 6; i++) {//Finds 1 question for each value in the category.
                const questionChoices = questions.filter(question => question['value'] == (i * startingValue));
                /*Above code finds all questions with the right value.*/
                const question = questionChoices[Math.floor(Math.random() * questionChoices.length)];
                /*Randomly chooses a question from the options.*/
                category[i] = question;
                /*Category[0] is the category info, 1-6 is the questions*/
            }
            categories.push(category);//Adds the selected question to the category that is returned.
        }
    }
    return categories;
}
function fillBoard(board,tableData) { //This function fills the table with the data.
    const categoryRow = document.getElementById('categories');
    for (const category of tableData) { //Populates the category names in the table
        const categoryName = document.createElement('th'); //Heading row for the table
        categoryName.textContent = category[0]['title']; // Puts category name in the row
        categoryRow.appendChild(categoryName);
    }
    for (let i = 1; i < 6; i++) {//Iterates over rows in the table, adding the relevant questions
        const row = document.getElementById(`${i * 100}`)
        for (const category in tableData) {
            const questionBox = document.createElement('td'); // New box in row
            if (tableData[category][i]['answeredCorrectly'] !== undefined) { // Checks what if this question was asked earlier.
                questionBox.classList = tableData[category][i]['answeredCorrectly']; // Sets class for the purposes of CSS.
                questionBox.textContent = tableData[category][i]['question'];
                // If the question was answered, this puts the question in the box rather than the value.
            }
            else {
                questionBox.textContent = row.id; // Sets the contents of the box to the questions value.
                questionBox.id = category; //Stores the category that the question comes from for later
                questionBox.onclick = () => {askQuestion(questionBox, tableData);} // I have know idea why I need to put my function in a function.
            }
            row.appendChild(questionBox);
        }
    }
}
function clearBoard(board) { // Clears the board with the execption of the Jeopardy! heading, used by other functions.
    const heading = board.firstElementChild;
    board.replaceChildren(heading); // Removes everything but the heading
}
function massageAnswer(answer) {
    /*There are unicode diacritics, punctuation marks, captialization, and italiciation in the jeapardy answers.
    As an english speaker, I want to be incredibily forgiving, so this massages the answers so they are more likely to match up.*/
    const marksToRemove = /[?,!."-]|(<\/?i>)|[\u0300-\u036f]/gu;
    /*The above regular expression looks for any of the punctuation, either <i> or </i>, or any unicode diacritics 
    because I really don't want to look for the exact diacritics to use.*/
    const massagedAnswer = answer.toLocaleLowerCase('en-US').normalize("NFD").replaceAll(marksToRemove, '');
    // Converts to lowercase english characters, expands unicode characters to their max size, then replaces based on the regexp.
    return massagedAnswer;
}
function checkAnswer(givenAnswer, correctAnswer) { //Checks if the answer is correct.
    const givenAnswerArray = massageAnswer(givenAnswer).split(' '); //Splits the answer into words
    const wwwwwh = ['who','what','when','where', 'why', 'how']; //Valid question starters
    const connectors = ['is','was','are','were']; // connecting verbs so 'what is ...' is a valid question.
    if (wwwwwh.indexOf(givenAnswerArray[0]) == -1) {return false;}
    if (connectors.indexOf(givenAnswerArray[1]) == -1) {return false;}
    const correctAnswerString = massageAnswer(correctAnswer).replace(/\s+/g, '') //Massages the answer in preperation for comparison.
    const givenAnswerString = givenAnswerArray.slice(2).join(''); // Removes the first 2 words, then concatinates.
    if (givenAnswerString == correctAnswerString) {return true;} // Checks whether the answer is correct
    else {return false;}
}
async function askQuestion(box, tableData) { //This function changes the board to one with the just the question being asked, checks the answer, and then repaints the
    // Setting things that need to be done before we go back to the main board.
    box.onclick = () => {}
    // Getting elements on the page that we need for later.
    const mainBoard = document.getElementById('mainBoard');
    const questionBody = document.getElementById('askQuestion');
    const questionText = document.getElementById('questionText');
    const inputField = document.getElementById('answerInputField');
    const inputButton = document.getElementById('answerInputButton');
    const showCorrectAnswer = document.getElementById('correctAnswer');
    const showGivenAnswer = document.getElementById('givenAnswer');
    // Setting up variables used later
    const value = box.textContent; // The value of the question being asked.
    const category = box.id; // The id of a box matches up with the position of it's category in tableData[]
    const question = tableData[await category][await value / 100]; // Uses the value of the box clicked on to derive the question being asked.
    questionText.textContent = 'Question:\n'+question['question']; // Puts the question on screen.
    mainBoard.hidden = true; // Hides the main board
    questionBody.hidden = false; // Shows the question
    inputButton.onclick = () => { //Once the answer has been submitted.
        inputButton.hidden = inputField.hidden = true; // Hides the inputs
        const givenAnswer = inputField.value;
        const answerIsCorrect = checkAnswer(givenAnswer, question['answer']); // Checks the answer
        questionBody.classList = box.classList = answerIsCorrect;
        //The above colors the box on the main board, and the Question screen red or green based on whether answer was correct.
        showCorrectAnswer.textContent = 'Correct answer:\n'+question['answer']; // Puts correct answer on the screen.
        showCorrectAnswer.hidden = false;
        if (!answerIsCorrect) {
            showGivenAnswer.textContent = 'Your answer: '+givenAnswer; // Only show your answer if it didn't match correct.
            const overrideButton = document.getElementById('overrideWasRight'); // Allows you to override the check if it didn't catch it.
            overrideButton.hidden = showGivenAnswer.hidden = false;
            overrideButton.onclick = () => {questionBody.classList = box.classList = overrideButton.hidden = true;}
        }
        const continueButton = document.getElementById('continueButton');
        continueButton.hidden = false;
        continueButton.onclick = () => {
            questionBody.hidden = showCorrectAnswer.hidden = showGivenAnswer.hidden = continueButton.hidden = true;
            mainBoard.hidden = inputButton.hidden = inputField.hidden = false;
            inputField.value = ''; // Reseting this for later.
            questionBody.removeAttribute('class');
        }
    }
}
async function game() { //Wraps ansync functions
    const tableData = await getCategoryQuestions();
    const startButton = document.getElementById('startButton');
    fillBoard(board, tableData);
    console.log(tableData);
    startButton.onclick = () => {
        const startScreen = document.getElementById('startScreen');
        const mainBoard = document.getElementById('mainBoard');
        startScreen.hidden = true;
        mainBoard.hidden = false;
    }
}
game();