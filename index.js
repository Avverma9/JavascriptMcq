const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT =  3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = "mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/JsMCQ";

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB se सफलतापूर्वक connect ho gaye!'))
  .catch(err => console.error('Connection mein error:', err));

const mcqSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true
    },
    correctAnswerIndex: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Mcq = mongoose.model('Mcq', mcqSchema);

app.post('/api/mcqs', async (req, res) => {
    try {
        const { questionText, options, correctAnswerIndex } = req.body;

        if (!questionText || !options || options.length < 2 || correctAnswerIndex == null) {
            return res.status(400).json({ message: "Please provide all required fields." });
        }

        const newMcq = new Mcq({
            questionText,
            options,
            correctAnswerIndex
        });

        const savedMcq = await newMcq.save();
        res.status(201).json(savedMcq);
    } catch (error) {
        console.error("MCQ banane mein error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

app.get('/api/mcqs', async (req, res) => {
    try {
        const mcqs = await Mcq.find().sort({ createdAt: -1 });
        res.status(200).json(mcqs);
    } catch (error) {
        console.error("MCQs fetch karne mein error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

app.get('/', async (req, res) => {
    try {
        const mcqs = await Mcq.find().sort({ createdAt: -1 });

        const mcqsHtml = mcqs.map((mcq, index) => `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-4" id="mcq-${mcq._id}">
                <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-3">${index + 1}. ${escapeHTML(mcq.questionText)}</h3>
                <ul class="space-y-2">
                    ${mcq.options.map((option, optionIndex) => `
                        <li class="p-3 rounded-md ${optionIndex === mcq.correctAnswerIndex 
                            ? 'bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500' 
                            : 'bg-gray-50 dark:bg-gray-700/50'}">
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
                <title>MCQ App</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: 'Inter', sans-serif; }
                    #addQuestionFormContainer {
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.5s ease-in-out;
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <div class="container mx-auto max-w-4xl p-4 sm:p-6">
                    
                    <header class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h1 class="text-3xl font-bold text-blue-600 dark:text-blue-400">MCQ Manager</h1>
                            <p class="text-gray-500 dark:text-gray-400">Apne sawaal yahan banayein aur dekhein.</p>
                        </div>
                        <button id="showFormBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                            Naya Sawaal Jodein +
                        </button>
                    </header>

                    <main>
                        <div id="addQuestionFormContainer" class="mb-8">
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                                <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Naya Sawaal Banayein</h2>
                                <form id="mcqForm">
                                    <div class="mb-4">
                                        <label for="questionText" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sawaal Likhein</label>
                                        <textarea id="questionText" name="questionText" rows="3" required class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                    </div>
                                    <div class="mb-4">
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options (Pehla option sahi jawab hoga)</label>
                                        <div id="optionsContainer" class="space-y-2">
                                            ${[...Array(4)].map((_, i) => `
                                                <div class="flex items-center space-x-2">
                                                    <input type="radio" name="correctAnswer" value="${i}" ${i === 0 ? 'checked' : ''} class="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                                                    <input type="text" name="option" required placeholder="Option ${i + 1}" class="flex-grow px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">Sawaal Save Karein</button>
                                </form>
                            </div>
                        </div>

                        <div>
                            <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Aapke Sawaal</h2>
                            <div id="mcqsList">
                                ${mcqsHtml.length > 0 ? mcqsHtml : '<p id="no-mcq-message" class="text-gray-500 dark:text-gray-400">Abhi koi sawaal nahi hai. Upar diye gaye button se naya sawaal jodein.</p>'}
                            </div>
                        </div>
                    </main>
                </div>

                <script>
                    function escapeHTML(str) {
                        const p = document.createElement('p');
                        p.appendChild(document.createTextNode(str));
                        return p.innerHTML;
                    }

                    const showFormBtn = document.getElementById('showFormBtn');
                    const formContainer = document.getElementById('addQuestionFormContainer');
                    const mcqForm = document.getElementById('mcqForm');
                    const mcqsList = document.getElementById('mcqsList');

                    showFormBtn.addEventListener('click', () => {
                        if (formContainer.style.maxHeight) {
                            formContainer.style.maxHeight = null;
                            showFormBtn.textContent = 'Naya Sawaal Jodein +';
                        } else {
                            formContainer.style.maxHeight = formContainer.scrollHeight + "px";
                            showFormBtn.textContent = 'Form Band Karein -';
                        }
                    });

                    mcqForm.addEventListener('submit', async (event) => {
                        event.preventDefault();

                        const questionText = document.getElementById('questionText').value;
                        const optionInputs = document.querySelectorAll('input[name="option"]');
                        const options = Array.from(optionInputs).map(input => input.value);
                        const correctAnswerIndex = document.querySelector('input[name="correctAnswer"]:checked').value;

                        try {
                            const response = await fetch('/api/mcqs', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    questionText,
                                    options,
                                    correctAnswerIndex: parseInt(correctAnswerIndex)
                                }),
                            });

                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }

                            const newMcq = await response.json();
                            
                            const mcqElement = document.createElement('div');
                            mcqElement.className = 'bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-4';
                            mcqElement.id = 'mcq-' + newMcq._id;
                            const optionsHtml = newMcq.options.map((opt, i) => \`
                                <li class="p-3 rounded-md \${i === newMcq.correctAnswerIndex ? 'bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500' : 'bg-gray-50 dark:bg-gray-700/50'}">
                                    <span class="font-medium text-gray-700 dark:text-gray-300">\${escapeHTML(opt)}</span>
                                    \${i === newMcq.correctAnswerIndex ? '<span class="text-green-600 dark:text-green-400 font-semibold float-right">Sahi Jawab ✓</span>' : ''}
                                </li>
                            \`).join('');

                            mcqElement.innerHTML = \`
                                <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-3">\${mcqsList.children.length + 1}. \${escapeHTML(newMcq.questionText)}</h3>
                                <ul class="space-y-2">\${optionsHtml}</ul>
                            \`;
                            
                            const noMcqMessage = document.getElementById('no-mcq-message');
                            if (noMcqMessage) {
                                noMcqMessage.remove();
                            }
                            
                            mcqsList.prepend(mcqElement);
                            mcqForm.reset();
                            formContainer.style.maxHeight = null;
                            showFormBtn.textContent = 'Naya Sawaal Jodein +';

                        } catch (error) {
                            console.error('Sawaal add karne mein fail ho gaye:', error);
                            alert('Sawaal add nahi ho paya. Console check karein.');
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Page render karne mein error:", error);
        res.status(500).send("<h1>Error</h1><p>Page render nahi ho paya. Server logs check karein.</p>");
    }
});

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

app.listen(PORT, () => {
    console.log(`Server http://localhost:\${PORT} par chal raha hai`);
});
