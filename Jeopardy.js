'use strict';
const JeopardyURL = "https://jservice.io/api/" //API URL
function getRandomInt(min, max) {
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
async function getCategory() {
    const offset = getRandomInt(0,18435);
    const category = await get(`categories?offset=${offset}`);
    return category;
}
async function getCategoryQuestions() {
    const categories = []; // an array of categories and questions.
    while (categories.length < 5) { //A category can fail, so we may have to get >5 categories.
        const category = await getCategory(); //Pulls a random category
        const questions = await get(`clues?category=${category[0]['id']}`); //Pulls the question for a category.
        const values = questions.map(question => question['value']) //Pulls the values of those questions.
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
        categories.push(category)//Adds the selected question to the category that is returned.
        }
    }
    return categories
}
function fillBoard(board,tableData) { //This function fills the table with the data.
    clearBoard(board);
    const categoryRow = document.createElement('tr');
    categoryRow.setAttribute('class', 'questionRow');
    for (const category of tableData) {//Populates the category names in the table
        const categoryName = document.createElement('th');
        categoryName.textContent = category[0]['title'];
        categoryRow.appendChild(categoryName);
    }
    board.appendChild(categoryRow);
    for (let i = 1; i < 6; i++) {//Iterates over rows in the table, adding the relevant questions
        const row = document.createElement('tr');
        row.id = i * 100;
        row.setAttribute('class', 'questionRow');
        for (const category in tableData) {
            const questionBox = document.createElement('td');
            questionBox.id = category;
            if (tableData[category][i]['used'] !== undefined) {
                questionBox.classList = tableData[category][i]['used'];
                questionBox.textContent = tableData[category][i]['question'];
            }
            else {
            questionBox.textContent = row.id;
            questionBox.onclick = function stupitity() {askQuestion(questionBox, board, tableData);} // I have know idea why I need to put my function in a function.
            }
            row.appendChild(questionBox);
        }
        board.appendChild(row);
    }
}
function clearBoard(board) {
    const heading = board.firstElementChild;
    board.replaceChildren(heading);
}
function isTrue(givenAnswer, correctAnswer) {
    var givenAnswer = givenAnswer.toLocaleLowerCase('en-US').replace(/\s+/g, '').replace('?', '');//Shifts all answers to english characters and removes spaces.
    var correctAnswer = correctAnswer.toLocaleLowerCase('en-US').replace(/\s+/g, '');
    const wwwwwh = ['who','what','when','where', 'why', 'how'];
    const connectors = ['is', 'was','are'];
    var isACorrectQuestion = false;
    for (const prefix of wwwwwh) {
        if (givenAnswer.startsWith(prefix)) {
            givenAnswer = givenAnswer.slice(prefix.length);
            for (const connector of connectors) {
                if(givenAnswer.startsWith(connector)){
                    givenAnswer = givenAnswer.slice(connector.length);
                    if (givenAnswer == correctAnswer) {
                        isACorrectQuestion = true;
                        break;
                    }

                }
            }
        }
    }
    return isACorrectQuestion;
}
function askQuestion(box, board, tableData) {
    const value = box.textContent;
    const category = box.id;
    const question = tableData[category][value / 100]
    const row = document.createElement('tr');
    const qBox = document.createElement('td');
    row.appendChild(qBox);
    qBox.setAttribute('colspan', 5);
    qBox.textContent = question['question'];
    clearBoard(board);
    board.appendChild(row);
    qBox.onclick = function whyDoesThisNeedToBeAFunction(){
        const answer = prompt(question['question']);
        if (isTrue(answer, question['answer'])) {
            question['used'] = 'correct';
        }
        else {
            question['used'] = 'incorrect';
        }
        fillBoard(board,tableData);
    }
}
async function game() {
    const board = document.getElementById('board');
    const tableData = await getCategoryQuestions();
    console.log(tableData);
    await fillBoard(board, tableData);
}
game();