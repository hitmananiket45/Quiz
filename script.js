let currentQuestionIndex = 0;
let score = 0;
let incorrectAnswers = 0; // Count of incorrect answers
let questions = [];
let timer;
let timeLeft = 30; // Time limit for each question
const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let hasAnswered = false; // Flag to prevent multiple selections

// Category mapping
const categoryNames = {
    9: "General Knowledge",
    10: "Entertainment: Books",
    11: "Entertainment: Film",
    12: "Entertainment: Music",
    13: "Entertainment: Musicals & Theatres",
    14: "Entertainment: Television",
    15: "Entertainment: Video Games",
    16: "Entertainment: Board Games",
    29: "Entertainment: Comics",
    31: "Entertainment: Japanese Anime & Manga",
    32: "Entertainment: Cartoon & Animations",
    17: "Science: Nature",
    18: "Science: Computers",
    19: "Science: Mathematics",
    30: "Science: Gadgets",
    20: "Mythology",
    21: "Sports",
    22: "Geography",
    23: "History",
    24: "Politics",
    25: "Art",
    26: "Celebrities",
    27: "Animals",
    28: "Vehicles",
};

// decode
function decodeHTMLEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Example usage
const question = "What&#039;s your favorite color?";
const decodedQuestion = decodeHTMLEntities(question);
console.log(decodedQuestion); // Output: What's your favorite color?


// Start quiz from setup page
document.getElementById('start-button')?.addEventListener('click', () => {
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value;
    const difficulty = document.getElementById('difficulty').value;

    // Check for required inputs
    if (!name || category === "" || difficulty === "") {
        alert('Please enter your name, select a category, and choose a difficulty level.');
        return;
    }

    localStorage.setItem('userName', name); // Save user name
    window.location.href = `quiz.html?category=${category}&difficulty=${difficulty}`; // Redirect to quiz page
});

// Fetch quiz questions from the API
async function fetchQuestions(category = 9, difficulty = 'easy') {
    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`);
        const data = await response.json();
        questions = data.results;
        startQuiz();
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to load questions. Please try again later.');
    }
}

// Start the quiz
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    incorrectAnswers = 0; // Reset incorrect answers
    document.querySelector('.score-container').classList.add('hidden');
    document.querySelector('.quiz-container').classList.remove('hidden');
    showQuestion();
}

// Show the current question and options
function showQuestion() {
    clearInterval(timer);
    timeLeft = 30;
    hasAnswered = false; // Reset the answer flag
    const timerElement = document.getElementById('timer');
    const timeLeftElement = document.getElementById('time-left');
    timerElement.classList.remove('hidden'); // Show timer during the quiz
    timeLeftElement.textContent = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        timeLeftElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById('feedback').textContent = 'Time is up!'; // Display feedback
            selectAnswer(null); // Handle as if the user selected no answer
            nextQuestion(); // Automatically go to the next question
        }
    }, 1000);

    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const nextButton = document.getElementById('next-button');
    const feedbackElement = document.getElementById('feedback');
    const questionNumberElement = document.getElementById('question-number');
    const progressElement = document.getElementById('progress'); // Get progress element

    optionsElement.innerHTML = ''; // Clear previous options
    feedbackElement.classList.add('hidden'); // Hide feedback initially

    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;

    // Show the current question number
    questionNumberElement.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;

    const answers = [...currentQuestion.incorrect_answers, currentQuestion.correct_answer];
    const shuffledAnswers = answers.sort(() => Math.random() - 0.5); // Shuffle answers

    shuffledAnswers.forEach(answer => {
        const li = document.createElement('li');
        li.textContent = answer;
        li.addEventListener('click', () => selectAnswer(answer));
        optionsElement.appendChild(li);
    });

    nextButton.classList.add('hidden'); // Hide the next button initially
}

// Handle answer selection
function selectAnswer(answer) {
    if (hasAnswered) return; // Prevent multiple selections

    const currentQuestion = questions[currentQuestionIndex];
    const nextButton = document.getElementById('next-button');
    const options = document.querySelectorAll('.options li');
    const feedbackElement = document.getElementById('feedback');
    const progressElement = document.getElementById('progress'); // Get progress element

    clearInterval(timer); // Stop the timer
    hasAnswered = true; // Set the answer flag

    options.forEach(option => {
        if (option.textContent === currentQuestion.correct_answer) {
            option.classList.add('correct'); // Highlight correct answer
        }
        if (option.textContent === answer) {
            if (answer === currentQuestion.correct_answer) {
                score++;
                feedbackElement.textContent = 'Correct!'; // Show correct feedback
            } else {
                option.classList.add('wrong'); // Highlight wrong answer
                feedbackElement.textContent = `Wrong! The correct answer is: ${currentQuestion.correct_answer}`; // Show correct answer
                incorrectAnswers++;
            }
        }
    });

    feedbackElement.classList.remove('hidden'); // Show feedback
    nextButton.classList.remove('hidden'); // Show next button

    // Update the progress display
    const remainingQuestions = questions.length - currentQuestionIndex - 1;
    progressElement.textContent = `Correct: ${score}, Wrong: ${incorrectAnswers}, Remaining: ${remainingQuestions}`;
}

// Handle next question
function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showScore();
    }
}

document.getElementById('next-button')?.addEventListener('click', nextQuestion);

// Show score after quiz is completed
function showScore() {
    clearInterval(timer); // Stop the timer when quiz is completed
    document.querySelector('.quiz-container').classList.add('hidden');
    
    // Display final score and performance message
    const scoreElement = document.getElementById('final-score');
    const performanceMessage = document.getElementById('performance-message');

    scoreElement.textContent = `Your Score: ${score} out of ${questions.length}`;
    
    if (score <= 4) {
        performanceMessage.textContent = 'Better luck next time!';
    } else if (score <= 7) {
        performanceMessage.textContent = 'Good Job, you did well!';
    } else {
        performanceMessage.textContent = 'Fantastic job, you nailed it!';
    }

    document.querySelector('.score-container').classList.remove('hidden');
    saveHighScore();
}

// Save high score to local storage
function saveHighScore() {
    const name = localStorage.getItem('userName');
    const category = new URLSearchParams(window.location.search).get('category');
    const difficulty = new URLSearchParams(window.location.search).get('difficulty');

    const currentHighScore = {
        name,
        score,
        category: categoryNames[category] || 'Unknown Category', // Get the category name
        difficulty
    };

    highScores.push(currentHighScore);
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Show scores with name, difficulty, and category
function displayHighScores() {
    const highscoresList = document.getElementById('highscores-list');
    highscoresList.innerHTML = ''; // Clear the existing list

    // Sort scores in descending order
    highScores.sort((a, b) => b.score - a.score);
    
    highScores.forEach(h => {
        const card = document.createElement('div');
        card.className = 'highscore-card'; // Use card class for styling
        
        // Create the content for the card
        card.innerHTML = `
            <h3>${h.name}</h3>
            <p>Score: <strong>${h.score}</strong></p>
            <p>Category: ${h.category}</p>
            <p>Difficulty: ${h.difficulty}</p>
        `;

        highscoresList.appendChild(card); // Append the card to the highscores list
    });
}

// Show scores button
document.getElementById('highscores-button')?.addEventListener('click', () => {
    window.location.href = 'scores.html'; // Redirect to scores page
});

// Back button to setup
document.getElementById('back-button')?.addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect back to setup page
});

// Restart quiz functionality
document.getElementById('restart-button')?.addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect to setup page
});

// Run on scores page load
if (window.location.pathname.includes('scores.html')) {
    displayHighScores();
}

// Run on quiz page load
if (window.location.pathname.includes('quiz.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const difficulty = urlParams.get('difficulty');
    fetchQuestions(category, difficulty); // Fetch questions based on parameters
}

// Initialize the quiz on page load
function initializeQuiz() {
    const name = localStorage.getItem('userName');
    if (name) {
        document.getElementById('name').value = name;
    }
}

initializeQuiz();
