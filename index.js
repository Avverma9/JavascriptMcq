const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const pdf = require('pdf-parse');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'a-very-secret-and-long-key-for-session',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const upload = multer({ storage: multer.memoryStorage() });

const ADMIN_EMAIL = "anv9576@gmail.com";
const ADMIN_PASSWORD = "Avverma@1";

const MONGO_URI = "mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/JsMCQ";

const mcqSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    normalizedQuestion: { type: String, required: true, unique: true, index: true },
    options: { type: [String], required: true },
    correctAnswerIndex: { type: Number, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
const Mcq = mongoose.model('Mcq', mcqSchema);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true }
});
const User = mongoose.model('User', userSchema);

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match]));
}

function normalizeQuestionText(text) {
    return text.trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');
}

const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

const requireAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).send("<h1>Access Denied</h1><p>You do not have permission to view this page.</p>");
    }
};

const renderHeader = (req) => {
    let navLinks = `
        <a href="/login" class="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 font-medium">Login</a>
        <a href="/register" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1.5 px-3 rounded-full text-xs sm:text-sm transition-colors">Register</a>
    `;

    if (req.session.isAdmin) {
        navLinks = `
            <a href="/admin" class="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-indigo-500 font-medium">Admin Panel</a>
            <a href="/logout" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-full text-xs sm:text-sm">Logout</a>
        `;
    } else if (req.session.userId) {
        navLinks = `
            <a href="/quiz" class="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-indigo-500 font-medium">Public Quiz</a>
            <a href="/my-quiz-book" class="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-indigo-500 font-medium">My Quiz Book</a>
            <a href="/logout" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-full text-xs sm:text-sm">Logout</a>
        `;
    }

    return `
    <header class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <nav class="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
            <a href="/" class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                QuizMaster
            </a>
            <div class="flex items-center space-x-3 sm:space-x-4">
                ${navLinks}
            </div>
        </nav>
    </header>`;
};


const renderFooter = () => `
    <footer class="text-center py-5 mt-10">
        <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            © ${new Date().getFullYear()} QuizMaster. All Rights Reserved.
        </p>
    </footer>`;

app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/quiz');
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to QuizMaster</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; } .dark body { background-color: #111827; }</style>
        </head>
        <body>
            ${renderHeader(req)}
            <main class="flex items-center justify-center min-h-[calc(100vh-120px)] p-4 text-center">
                <div class="w-full max-w-2xl mx-auto">
                    <h1 class="text-4xl sm:text-6xl font-extrabold text-gray-800 dark:text-white mb-4">Welcome to QuizMaster</h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">Your ultimate destination for creating, sharing, and playing quizzes.</p>
                    <div class="flex justify-center items-center space-x-4">
                        <a href="/login" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105">Login</a>
                        <a href="/register" class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105">Register</a>
                        <a href="/quiz" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Skip for now &raquo;</a>
                    </div>
                </div>
            </main>
            ${renderFooter()}
        </body>
        </html>
    `);
});


app.get('/register', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Register</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; } .dark body { background-color: #111827; }</style>
        </head>
        <body>
            ${renderHeader(req)}
            <main class="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
                <div class="w-full max-w-sm mx-auto p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <h1 class="text-2xl font-bold text-center mb-1 text-gray-800 dark:text-white">Create Account</h1>
                    <p class="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">Join to start your quiz journey.</p>
                    <form method="POST" action="/register" class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input type="email" id="email" name="email" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input type="password" id="password" name="password" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                        </div>
                        <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2.5 px-4 rounded-md">Register</button>
                    </form>
                </div>
            </main>
            ${renderFooter()}
        </body>
        </html>
    `);
});

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("User already exists with this email.");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        req.session.userId = user._id;
        res.redirect('/my-quiz-book');
    } catch (error) {
        res.status(500).send("Error registering user.");
    }
});

app.get('/login', (req, res) => {
    const errorMessage = req.query.error || '';
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; } .dark body { background-color: #111827; }</style>
        </head>
        <body>
            ${renderHeader(req)}
            <main class="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
                <div class="w-full max-w-sm mx-auto p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <h1 class="text-2xl font-bold text-center mb-1 text-gray-800 dark:text-white">Welcome Back</h1>
                    <p class="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">Login to your account.</p>
                    ${errorMessage ? `<p class="text-red-500 text-center mb-4 text-sm">${decodeURIComponent(errorMessage)}</p>` : ''}
                    <form method="POST" action="/login" class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input type="email" id="email" name="email" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input type="password" id="password" name="password" required class="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                        </div>
                        <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2.5 px-4 rounded-md">Login</button>
                    </form>
                </div>
            </main>
            ${renderFooter()}
        </body>
        </html>
    `);
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.session.userId = 'admin';
        return res.redirect('/admin');
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect('/login?error=' + encodeURIComponent('Invalid credentials.'));
        }
        if (!user.isActive) {
            return res.redirect('/login?error=' + encodeURIComponent('Your account has been disabled.'));
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            req.session.userId = user._id;
            req.session.isAdmin = false;
            res.redirect('/my-quiz-book');
        } else {
            res.redirect('/login?error=' + encodeURIComponent('Invalid credentials.'));
        }
    } catch (error) {
        res.status(500).send("Login error.");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

const renderQuizPage = async (req, res) => {
    try {
        const mcqs = await Mcq.find({ author: null }).sort({ createdAt: -1 });
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Public Quiz</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; } .dark body { background-color: #111827; }
                    .question-card, .result-container { display: none; }
                    .question-card.active { display: block; animation: fadeIn 0.5s ease-in-out; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .option { cursor: pointer; transition: all 0.2s ease-in-out; }
                    .option:hover { background-color: #eef2ff; border-color: #6366f1; }
                    .dark .option:hover { background-color: #312e81; border-color: #818cf8; }
                    .option.selected { pointer-events: none; }
                    .option.correct { background-color: #dcfce7; border-color: #22c55e; color: #15803d; }
                    .dark .option.correct { background-color: #166534; border-color: #4ade80; color: #dcfce7; }
                    .option.incorrect { background-color: #fee2e2; border-color: #ef4444; color: #b91c1c; }
                    .dark .option.incorrect { background-color: #991b1b; border-color: #f87171; color: #fee2e2; }
                </style>
            </head>
            <body>
                ${renderHeader(req)}
                <main class="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
                    <div class="w-full max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div class="quiz-container block"></div>
                        <div class="result-container"></div>
                    </div>
                </main>
                ${renderFooter()}
                <script>
                    const mcqs = ${JSON.stringify(mcqs)};
                    let currentQuestionIndex = 0;
                    let score = 0;
                    const quizContainer = document.querySelector('.quiz-container');
                    const resultContainer = document.querySelector('.result-container');

                    function renderQuestion() {
                        if (mcqs.length === 0) {
                            quizContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No public questions available right now.</p>';
                            return;
                        }
                        if (currentQuestionIndex >= mcqs.length) {
                            showResult();
                            return;
                        }
                        const mcq = mcqs[currentQuestionIndex];
                        quizContainer.innerHTML = \`
                            <div class="flex justify-between items-center mb-4">
                                <h1 class="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">Public Quiz</h1>
                                <div class="text-sm sm:text-base font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 px-3 py-1.5 rounded-md">
                                    Score: <span id="score">\${score}</span>
                                </div>
                            </div>
                            <div id="questions-wrapper">
                                <div class="question-card active" data-correct-index="\${mcq.correctAnswerIndex}">
                                    <p class="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        <span class="question-number">\${currentQuestionIndex + 1}</span>/\${mcqs.length}: \${mcq.questionText}
                                    </p>
                                    <div class="options-list space-y-3">
                                        \${mcq.options.map((option, optionIndex) => \`
                                            <div class="option border-2 border-black-300 dark:border-black-600 p-3 rounded-lg flex items-center" onclick="selectAnswer(this, \${optionIndex})">
                                                <span class="font-medium text-black-700 dark:text-red-300 text-sm sm:text-base">\${option}</span>
                                            </div>
                                        \`).join('')}
                                    </div>
                                    <button id="next-btn" class="hidden w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition" onclick="nextQuestion()">Next Question</button>
                                </div>
                            </div>
                        \`;
                    }

                    function selectAnswer(element, selectedOptionIndex) {
                        const correctIndex = mcqs[currentQuestionIndex].correctAnswerIndex;
                        const options = document.querySelectorAll('.option');
                        options.forEach(opt => opt.classList.add('selected'));

                        if (selectedOptionIndex === correctIndex) {
                            element.classList.add('correct');
                            score++;
                            document.getElementById('score').innerText = score;
                        } else {
                            element.classList.add('incorrect');
                            options[correctIndex].classList.add('correct');
                        }
                        document.getElementById('next-btn').style.display = 'block';
                    }

                    function nextQuestion() {
                        currentQuestionIndex++;
                        renderQuestion();
                    }

                    function showResult() {
                        quizContainer.style.display = 'none';
                        resultContainer.style.display = 'block';
                        resultContainer.innerHTML = \`
                            <div class="text-center">
                                <h1 class="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Quiz Complete!</h1>
                                <p class="text-base text-gray-700 dark:text-gray-300 mb-4">Your final score is:</p>
                                <div class="text-5xl font-bold text-gray-800 dark:text-white mb-6">
                                    <span id="final-score">\${score}</span> / \${mcqs.length}
                                </div>
                                <button class="w-full sm:w-auto inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg" onclick="window.location.reload()">Play Again</button>
                            </div>
                        \`;
                    }
                    
                    renderQuestion();
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Error loading quiz page:", error);
        res.status(500).send("<h1>Error</h1><p>Quiz could not be loaded.</p>");
    }
};

app.get('/quiz', renderQuizPage);

app.get('/my-quiz-book', requireAuth, async (req, res) => {
    try {
        const userQuizzes = await Mcq.find({ author: req.session.userId }).sort({ createdAt: -1 });
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>My Quiz Book</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; } .dark body { background-color: #111827; }</style>
            </head>
            <body>
                ${renderHeader(req)}
                <div class="container mx-auto max-w-4xl p-4">
                    <main class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Create Your Own Question</h2>
                            <form id="mcqForm" class="space-y-4">
                                <div>
                                    <label for="questionText" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
                                    <textarea id="questionText" rows="2" required class="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"></textarea>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options (select correct answer)</label>
                                    <div class="space-y-2">
                                        ${[...Array(4)].map((_, i) => `
                                            <div class="flex items-center space-x-2">
                                                <input type="radio" name="correctAnswer" value="${i}" ${i === 0 ? 'checked' : ''} class="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500">
                                                <input type="text" name="option" required placeholder="Option ${i + 1}" class="flex-grow p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md">Save Question</button>
                            </form>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Your Created Quizzes</h2>
                            <div class="space-y-4">
                                ${userQuizzes.length > 0 ? userQuizzes.map(quiz => `
                                    <div class="p-4 border dark:border-gray-700 rounded-lg">
                                        <p class="font-semibold text-gray-800 dark:text-gray-200">${escapeHTML(quiz.questionText)}</p>
                                    </div>
                                `).join('') : '<p class="text-center text-gray-500 dark:text-gray-400">You have not created any quizzes yet.</p>'}
                            </div>
                        </div>
                    </main>
                </div>
                ${renderFooter()}
                <script>
                    document.getElementById('mcqForm').addEventListener('submit', async (event) => {
                        event.preventDefault();
                        const btn = event.target.querySelector('button[type="submit"]');
                        btn.disabled = true;
                        btn.textContent = 'Saving...';
                        const questionText = document.getElementById('questionText').value;
                        const options = Array.from(document.querySelectorAll('input[name="option"]')).map(input => input.value);
                        const correctAnswerIndex = document.querySelector('input[name="correctAnswer"]:checked').value;
                        
                        const response = await fetch('/api/mcqs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ questionText, options, correctAnswerIndex: parseInt(correctAnswerIndex) }),
                        });
                        if (response.ok) {
                            alert('Question saved successfully!');
                            window.location.reload();
                        } else {
                            const error = await response.json();
                            alert('Failed to save question: ' + error.message);
                            btn.disabled = false;
                            btn.textContent = 'Save Question';
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send("Error loading your quiz book.");
    }
});


app.get('/admin', requireAdmin, async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        const userFilter = {};
        if (searchQuery) {
            userFilter.email = { $regex: searchQuery, $options: 'i' };
        }
        const users = await User.find(userFilter);
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Panel</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; } .dark body { background-color: #111827; }</style>
            </head>
            <body>
                ${renderHeader(req)}
                <div class="container mx-auto max-w-7xl p-4">
                    <main class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-1 space-y-6">
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Upload Public Questions</h2>
                                <form id="pdfUploadForm" class="space-y-4">
                                    <div>
                                        <label for="pdfFile" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select PDF File</label>
                                        <input type="file" id="pdfFile" name="pdfFile" accept=".pdf" required class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900"/>
                                    </div>
                                    <button type="submit" id="pdfUploadBtn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-md">Upload PDF</button>
                                    <div id="pdf-message" class="mt-3 text-center text-sm"></div>
                                </form>
                            </div>
                             <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Create a Public Question</h2>
                                <form id="mcqForm" class="space-y-4">
                                    <div>
                                        <label for="questionText" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
                                        <textarea id="questionText" rows="2" required class="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options (select correct answer)</label>
                                        <div class="space-y-2">
                                            ${[...Array(4)].map((_, i) => `
                                                <div class="flex items-center space-x-2">
                                                    <input type="radio" name="correctAnswer" value="${i}" ${i === 0 ? 'checked' : ''} class="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500">
                                                    <input type="text" name="option" required placeholder="Option ${i + 1}" class="flex-grow p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md">Save Public Question</button>
                                </form>
                            </div>
                             <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Database Maintenance</h2>
                                <button id="cleanupBtn" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-md">Cleanup Duplicate Questions</button>
                                <div id="cleanup-message" class="mt-3 text-center text-sm"></div>
                            </div>
                        </div>
                        <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                             <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">User Management</h2>
                                <form action="/admin" method="GET" class="flex-grow sm:max-w-xs w-full">
                                    <div class="flex">
                                        <input type="text" name="search" placeholder="Search by email..." value="${escapeHTML(searchQuery)}" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-700 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <button type="submit" class="bg-indigo-600 text-white px-4 rounded-r-md hover:bg-indigo-700">Search</button>
                                    </div>
                                </form>
                            </div>
                            <button id="disableSelectedBtn" class="mb-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md text-sm">Disable Selected</button>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"><input type="checkbox" id="selectAllCheckbox"></th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        ${users.map(user => `
                                            <tr>
                                                <td class="px-6 py-4 whitespace-nowrap"><input type="checkbox" class="user-checkbox" value="${user._id}"></td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${escapeHTML(user.email)}</td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                                        ${user.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button onclick="toggleStatus('${user._id}', ${user.isActive})" class="${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}">
                                                        ${user.isActive ? 'Disable' : 'Enable'}
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
                ${renderFooter()}
                <script>
                    async function toggleStatus(userId, currentStatus) {
                        const action = currentStatus ? 'disable' : 'enable';
                        if (confirm(\`Are you sure you want to \${action} this user?\`)) {
                            try {
                                const response = await fetch(\`/api/users/\${userId}/toggle-status\`, { method: 'POST' });
                                if (response.ok) {
                                    window.location.reload();
                                } else {
                                    alert('Failed to update status.');
                                }
                            } catch (error) {
                                alert('An error occurred.');
                            }
                        }
                    }

                    document.getElementById('selectAllCheckbox').addEventListener('change', function(event) {
                        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
                            checkbox.checked = event.target.checked;
                        });
                    });

                    document.getElementById('disableSelectedBtn').addEventListener('click', async () => {
                        const selectedIds = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
                        if (selectedIds.length === 0) {
                            alert('Please select users to disable.');
                            return;
                        }
                        if (confirm(\`Are you sure you want to disable \${selectedIds.length} selected users?\`)) {
                             try {
                                const response = await fetch('/api/users/bulk-disable', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userIds: selectedIds })
                                });
                                if (response.ok) {
                                    window.location.reload();
                                } else {
                                    alert('Failed to disable selected users.');
                                }
                            } catch (error) {
                                alert('An error occurred during bulk action.');
                            }
                        }
                    });
                    
                    document.getElementById('mcqForm').addEventListener('submit', async (event) => {
                        event.preventDefault();
                        const btn = event.target.querySelector('button[type="submit"]');
                        btn.disabled = true;
                        btn.textContent = 'Saving...';
                        const questionText = document.getElementById('questionText').value;
                        const options = Array.from(document.querySelectorAll('input[name="option"]')).map(input => input.value);
                        const correctAnswerIndex = document.querySelector('input[name="correctAnswer"]:checked').value;
                        
                        const response = await fetch('/api/mcqs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ questionText, options, correctAnswerIndex: parseInt(correctAnswerIndex) }),
                        });
                        if (response.ok) {
                            alert('Public question saved successfully!');
                            document.getElementById('mcqForm').reset();
                        } else {
                            const error = await response.json();
                            alert('Failed to save question: ' + error.message);
                        }
                        btn.disabled = false;
                        btn.textContent = 'Save Public Question';
                    });

                    const pdfForm = document.getElementById('pdfUploadForm');
                    const pdfMessage = document.getElementById('pdf-message');
                    const pdfUploadBtn = document.getElementById('pdfUploadBtn');

                    pdfForm.addEventListener('submit', async (event) => {
                        event.preventDefault();
                        const pdfFile = document.getElementById('pdfFile').files[0];
                        if(!pdfFile) {
                            pdfMessage.textContent = 'Please select a PDF file.';
                            pdfMessage.className = 'mt-3 text-center text-sm text-red-500';
                            return;
                        }
                        const formData = new FormData();
                        formData.append('pdfFile', pdfFile);
                        
                        pdfMessage.textContent = 'Uploading and processing...';
                        pdfMessage.className = 'mt-3 text-center text-sm text-blue-500';
                        pdfUploadBtn.disabled = true;
                        pdfUploadBtn.textContent = 'Processing...';

                        try {
                            const response = await fetch('/api/upload-pdf', { method: 'POST', body: formData });
                            const result = await response.json();
                            if (response.ok) {
                                pdfMessage.textContent = result.message;
                                pdfMessage.className = 'mt-3 text-center text-sm text-green-500';
                                setTimeout(() => { pdfMessage.textContent = ''; }, 3000);
                            } else {
                                throw new Error(result.message);
                            }
                        } catch (error) {
                            pdfMessage.textContent = 'Error: ' + error.message;
                            pdfMessage.className = 'mt-3 text-center text-sm text-red-500';
                        } finally {
                           pdfUploadBtn.disabled = false;
                           pdfUploadBtn.textContent = 'Upload PDF';
                        }
                    });
                    
                    const cleanupBtn = document.getElementById('cleanupBtn');
                    const cleanupMessage = document.getElementById('cleanup-message');
                    cleanupBtn.addEventListener('click', async () => {
                        if (confirm('Are you sure you want to find and remove all duplicate questions? This action cannot be undone.')) {
                            cleanupBtn.disabled = true;
                            cleanupBtn.textContent = 'Cleaning...';
                            cleanupMessage.textContent = 'Processing...';
                            cleanupMessage.className = 'mt-3 text-center text-sm text-blue-500';
                             try {
                                const response = await fetch('/api/mcqs/cleanup-duplicates', { method: 'POST' });
                                const result = await response.json();
                                if (response.ok) {
                                    cleanupMessage.textContent = result.message;
                                    cleanupMessage.className = 'mt-3 text-center text-sm text-green-500';
                                } else {
                                    throw new Error(result.message);
                                }
                            } catch (error) {
                                cleanupMessage.textContent = 'Error: ' + error.message;
                                cleanupMessage.className = 'mt-3 text-center text-sm text-red-500';
                            } finally {
                                cleanupBtn.disabled = false;
                                cleanupBtn.textContent = 'Cleanup Duplicate Questions';
                            }
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Error loading admin page:", error);
        res.status(500).send("<h1>Error</h1><p>Admin page could not be loaded.</p>");
    }
});

app.post('/api/users/:id/toggle-status', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isActive = !user.isActive;
            await user.save();
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.status(500).send("Server error.");
    }
});

app.post('/api/users/bulk-disable', requireAdmin, async (req, res) => {
    try {
        const { userIds } = req.body;
        await User.updateMany({ _id: { $in: userIds } }, { isActive: false });
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send("Server error during bulk update.");
    }
});


app.post('/api/mcqs', requireAuth, async (req, res) => {
    try {
        const { questionText, options, correctAnswerIndex } = req.body;
        if (!questionText || !options || !options.every(opt => opt.trim() !== '') || options.length < 2 || correctAnswerIndex == null) {
            return res.status(400).json({ message: "Required fields are missing or invalid." });
        }
        
        const normalizedText = normalizeQuestionText(questionText);
        
        const newMcqData = {
            questionText,
            normalizedQuestion: normalizedText,
            options,
            correctAnswerIndex,
            author: req.session.isAdmin ? null : req.session.userId
        };

        const newMcq = new Mcq(newMcqData);
        await newMcq.save();
        res.status(201).json({ message: "Question added successfully." });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "This question already exists." });
        }
        res.status(500).json({ message: "Server error." });
    }
});

function parseTextToMcqs(text) {
    const mcqs = [];
    const regex = /^\s*(?:\d+\.|\w+\.)\s*([\s\S]+?)\n\s*A\)\s*(.+?)\n\s*B\)\s*(.+?)\n\s*C\)\s*(.+?)\n\s*D\)\s*(.+?)\n\s*Answer:\s*([A-D])/gmi;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
        const questionText = match[1].trim();
        const options = [
            match[2].trim(),
            match[3].trim(),
            match[4].trim(),
            match[5].trim()
        ];
        const answerLetter = match[6].trim().toUpperCase();
        const correctAnswerIndex = 'ABCD'.indexOf(answerLetter);

        if (questionText && options.length === 4 && correctAnswerIndex !== -1) {
            mcqs.push({
                questionText,
                options,
                correctAnswerIndex
            });
        }
    }
    return mcqs;
}

app.post('/api/upload-pdf', requireAdmin, upload.single('pdfFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file was uploaded.' });
    }

    try {
        const data = await pdf(req.file.buffer);
        const text = data.text;
        const parsedMcqs = parseTextToMcqs(text);

        if (parsedMcqs.length === 0) {
            return res.status(400).json({ message: 'No valid MCQs found in this PDF.' });
        }
        
        let addedCount = 0;
        let skippedCount = 0;
        
        for (const mcq of parsedMcqs) {
            try {
                const normalizedText = normalizeQuestionText(mcq.questionText);
                const newMcq = new Mcq({
                    ...mcq,
                    normalizedQuestion: normalizedText,
                    author: null
                });
                await newMcq.save();
                addedCount++;
            } catch (error) {
                if (error.code === 11000) {
                    skippedCount++;
                } else {
                    console.error("Error saving a specific MCQ from PDF:", error);
                }
            }
        }

        res.status(201).json({ message: `Process complete. Added: ${addedCount}. Skipped (duplicates): ${skippedCount}.` });

    } catch (error) {
        console.error('PDF parse error:', error);
        res.status(500).json({ message: 'Error processing PDF.' });
    }
});

app.post('/api/mcqs/cleanup-duplicates', requireAdmin, async (req, res) => {
    try {
        const duplicates = await Mcq.aggregate([
            {
                $group: {
                    _id: { normalizedQuestion: "$normalizedQuestion" },
                    dups: { $addToSet: "$_id" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { "$gt": 1 }
                }
            }
        ]);

        let deletedCount = 0;
        for (const duplicate of duplicates) {
            duplicate.dups.shift(); // Keep the first one, remove it from the array of IDs to delete
            const result = await Mcq.deleteMany({ _id: { $in: duplicate.dups } });
            deletedCount += result.deletedCount;
        }

        if (deletedCount > 0) {
            res.json({ message: `Cleanup successful. Removed ${deletedCount} duplicate questions.` });
        } else {
            res.json({ message: "No duplicate questions found to clean up." });
        }

    } catch (error) {
        console.error("Error during duplicate cleanup:", error);
        res.status(500).json({ message: "An error occurred during cleanup." });
    }
});


mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
