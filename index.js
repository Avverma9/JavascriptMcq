const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = "mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/JsMCQ";
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB se सफलतापूर्वक connect ho gaye!'))
  .catch(err => console.error('Connection mein error:', err));

const mcqSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswerIndex: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Mcq = mongoose.model('Mcq', mcqSchema);

app.post('/api/mcqs', async (req, res) => {
    try {
        const { questionText, options, correctAnswerIndex } = req.body;
        if (!questionText || !options || options.length < 2 || correctAnswerIndex == null) {
            return res.status(400).json({ message: "Zaroori fields missing." });
        }
        const newMcq = new Mcq({ questionText, options, correctAnswerIndex });
        const savedMcq = await newMcq.save();
        res.status(201).json(savedMcq);
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});

app.get('/', async (req, res) => {
    try {
        const mcqs = await Mcq.find().sort({ createdAt: -1 });

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>JavaScript MCQ Quiz</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; }
                    .quiz-container { display: block; }
                    .result-container { display: none; }
                    .question-card { display: none; }
                    .question-card.active { display: block; }
                    .option { cursor: pointer; transition: all 0.2s ease-in-out; }
                    .option:hover { background-color: #f0f4ff; }
                    .option.selected { pointer-events: none; }
                    .option.correct { background-color: #d1fae5; border-color: #10b981; color: #065f46; }
                    .option.incorrect { background-color: #fee2e2; border-color: #ef4444; color: #991b1b; }
                    .option.reveal-correct { background-color: #d1fae5; border-color: #10b981; }
                </style>
            </head>
            <body class="bg-gray-100 dark:bg-gray-900 flex items-center justify-center min-h-screen p-4">
                <div class="w-full max-w-2xl mx-auto">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8">
                        
                        <div class="quiz-container">
                            <div class="flex justify-between items-center mb-4">
                                <h1 class="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">JavaScript Quiz</h1>
                                <div class="text-lg font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg">
                                    Score: <span id="score">0</span>
                                </div>
                            </div>
                            <div id="questions-wrapper">
                                ${mcqs.map((mcq, index) => `
                                    <div class="question-card ${index === 0 ? 'active' : ''}" data-correct-index="${mcq.correctAnswerIndex}">
                                        <p class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                            <span class="question-number">${index + 1}</span>/${mcqs.length}: ${escapeHTML(mcq.questionText)}
                                        </p>
                                        <div class="options-list space-y-3">
                                            ${mcq.options.map((option, optionIndex) => `
                                                <div class="option border-2 border-gray-300 dark:border-gray-600 p-4 rounded-lg flex items-center" onclick="selectAnswer(this, ${optionIndex})">
                                                    <span class="font-medium text-gray-700 dark:text-gray-300">${escapeHTML(option)}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <button id="next-btn-${index}" class="hidden w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300" onclick="nextQuestion()">Next Question</button>
                                    </div>
                                `).join('')}
                                ${mcqs.length === 0 ? '<p>Admin panel mein sawaal jodein.</p>' : ''}
                            </div>
                        </div>

                        <div class="result-container text-center">
                            <h1 class="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">Quiz Pura Hua!</h1>
                            <p class="text-xl text-gray-700 dark:text-gray-300 mb-6">Aapka Final Score Hai:</p>
                            <div class="text-6xl font-bold text-gray-800 dark:text-white mb-8">
                                <span id="final-score">0</span> / ${mcqs.length}
                            </div>
                            <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg" onclick="window.location.reload()">Dobara Khele?</button>
                        </div>
                    </div>
                    <div class="text-center mt-4">
                        <a href="/admin" class="text-sm text-gray-500 hover:text-blue-500">Admin Panel</a>
                    </div>
                </div>

                <script>
                    let currentQuestionIndex = 0;
                    let score = 0;
                    const questions = document.querySelectorAll('.question-card');
                    const totalQuestions = questions.length;

                    function selectAnswer(element, selectedOptionIndex) {
                        const questionCard = questions[currentQuestionIndex];
                        const correctIndex = parseInt(questionCard.getAttribute('data-correct-index'));
                        const options = questionCard.querySelectorAll('.option');

                        options.forEach(opt => opt.classList.add('selected'));

                        if (selectedOptionIndex === correctIndex) {
                            element.classList.add('correct');
                            score++;
                            document.getElementById('score').innerText = score;
                        } else {
                            element.classList.add('incorrect');
                            options[correctIndex].classList.add('reveal-correct');
                        }

                        if (currentQuestionIndex < totalQuestions - 1) {
                           document.getElementById('next-btn-' + currentQuestionIndex).style.display = 'block';
                        } else {
                            setTimeout(showResult, 1000);
                        }
                    }

                    function nextQuestion() {
                        questions[currentQuestionIndex].classList.remove('active');
                        currentQuestionIndex++;
                        if (currentQuestionIndex < totalQuestions) {
                            questions[currentQuestionIndex].classList.add('active');
                        }
                    }

                    function showResult() {
                        document.querySelector('.quiz-container').style.display = 'none';
                        document.querySelector('.result-container').style.display = 'block';
                        document.getElementById('final-score').innerText = score;
                    }

                    function escapeHTML(str) {
                        const p = document.createElement('p');
                        p.appendChild(document.createTextNode(str));
                        return p.innerHTML;
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send("<h1>Error</h1><p>Quiz load nahi ho paya.</p>");
    }
});

app.get('/admin', async (req, res) => {
    try {
        const mcqs = await Mcq.find().sort({ createdAt: -1 });
        const mcqsHtml = mcqs.map((mcq, index) => `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-4">
                <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-3">${index + 1}. ${escapeHTML(mcq.questionText)}</h3>
                <ul class="space-y-2">
                    ${mcq.options.map((option, optionIndex) => `
                        <li class="p-3 rounded-md ${optionIndex === mcq.correctAnswerIndex ? 'bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500' : 'bg-gray-50 dark:bg-gray-700/50'}">
                            <span class="font-medium text-gray-700 dark:text-gray-300">${escapeHTML(option)}</span>
                            ${optionIndex === mcq.correctAnswerIndex ? '<span class="text-green-600 dark:text-green-400 font-semibold float-right">Sahi Jawab ✓</span>' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Panel</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body class="bg-gray-100 dark:bg-gray-900">
                <div class="container mx-auto max-w-4xl p-4 sm:p-6">
                    <header class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h1 class="text-3xl font-bold text-blue-600 dark:text-blue-400">Admin Panel</h1>
                            <p class="text-gray-500 dark:text-gray-400">Naye sawaal yahan jodein.</p>
                        </div>
                        <a href="/" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Quiz Khele</a>
                    </header>
                    <main>
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                            <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Naya Sawaal Banayein</h2>
                            <form id="mcqForm">
                                <div class="mb-4">
                                    <label for="questionText" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sawaal Likhein</label>
                                    <textarea id="questionText" rows="3" required class="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"></textarea>
                                </div>
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options (Sahi jawab chunein)</label>
                                    <div class="space-y-2">
                                        ${[...Array(4)].map((_, i) => `
                                            <div class="flex items-center space-x-2">
                                                <input type="radio" name="correctAnswer" value="${i}" ${i === 0 ? 'checked' : ''} class="form-radio h-4 w-4 text-blue-600">
                                                <input type="text" name="option" required placeholder="Option ${i + 1}" class="flex-grow p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md">Sawaal Save Karein</button>
                            </form>
                        </div>
                        <div>
                            <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Aapke Sawaal</h2>
                            <div id="mcqsList">${mcqsHtml.length > 0 ? mcqsHtml : '<p>Abhi koi sawaal nahi hai.</p>'}</div>
                        </div>
                    </main>
                </div>
                <script>
                    document.getElementById('mcqForm').addEventListener('submit', async (event) => {
                        event.preventDefault();
                        const questionText = document.getElementById('questionText').value;
                        const options = Array.from(document.querySelectorAll('input[name="option"]')).map(input => input.value);
                        const correctAnswerIndex = document.querySelector('input[name="correctAnswer"]:checked').value;
                        
                        const response = await fetch('/api/mcqs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ questionText, options, correctAnswerIndex: parseInt(correctAnswerIndex) }),
                        });
                        if (response.ok) {
                            window.location.reload();
                        } else {
                            alert('Sawaal save nahi ho paya.');
                        }
                    });
                     function escapeHTML(str) {
                        const p = document.createElement('p');
                        p.appendChild(document.createTextNode(str));
                        return p.innerHTML;
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send("<h1>Error</h1><p>Admin page load nahi ho paya.</p>");
    }
});

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} par chal raha hai`);
});