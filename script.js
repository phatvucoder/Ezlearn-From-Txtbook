/**
 * Quiz Application JavaScript
 * Handles quiz functionality, user interactions, and state management
 */

// DOM Elements
const startTestBtn = document.getElementById('startTestBtn');
const inputData = document.getElementById('inputData');
const modalOverlay = document.getElementById('modalOverlay');
const gradePerQuestionBtn = document.getElementById('gradePerQuestionBtn');
const gradeAllAtOnceBtn = document.getElementById('gradeAllAtOnceBtn');
const quizArea = document.getElementById('quizArea');
const quizContainer = document.getElementById('quizContainer');
const questionList = document.getElementById('questionList');
const quizContent = document.getElementById('quizContent');

const timerDisplay = document.getElementById('timerDisplay');
const scoreBox = document.getElementById('scoreBox');
const finalSubmitBtn = document.getElementById('finalSubmitBtn');

const historyBtn = document.querySelector('.history-btn');
const historyOverlay = document.getElementById('historyOverlay');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyContent = document.getElementById('historyContent');

const toggleModeBtn = document.querySelector('.toggle-mode-btn');
const websiteTitle = document.querySelector('.website-title');
const startContainer = document.getElementById('startContainer');
const mainContent = document.querySelector('.main-content');
const questionToggleBtn = document.getElementById('questionToggleBtn');

// Quiz State Variables
let questions = [];
let userAnswers = [];
let gradingMethod = null;
let currentQuestionIndex = 0;
let totalTime = 0;
let timeLeft = 0;
let timerInterval = null;
let correctCountSoFar = 0;
let questionButtons = [];

/**
 * Event Handlers
 */

// Logo Click Handler
websiteTitle.addEventListener('click', () => {
  if (quizArea.style.display === 'block') {
    if (confirm('Do you want to leave the test? Your progress will be lost!')) {
      resetQuiz();
    }
  } else {
    resetQuiz();
  }
});

// Start Button Handler
startTestBtn.addEventListener('click', () => {
  if (!inputData.value.trim()) {
    alert("Please enter the problem statement!");
    return;
  }
  
  questions = parseQuestions(inputData.value);
  if (questions.length === 0) {
    alert("No questions found! Please check your input.");
    return;
  }
  
  userAnswers = Array(questions.length).fill(null);
  modalOverlay.style.display = 'flex';
});

// Grading Method Selection Handlers
gradePerQuestionBtn.addEventListener('click', () => {
  gradingMethod = 'perQuestion';
  modalOverlay.style.display = 'none';
  prepareQuiz();
  startQuizPerQuestion();
});

gradeAllAtOnceBtn.addEventListener('click', () => {
  gradingMethod = 'allAtOnce';
  modalOverlay.style.display = 'none';
  prepareQuiz();
  startQuizAllAtOnce();
});

// Toggle Dark Mode Handler
toggleModeBtn.addEventListener('click', () => {
  if (document.body.classList.contains('light-mode')) {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    toggleModeBtn.textContent = '🌒';
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    toggleModeBtn.textContent = '☀️';
  }
});

// History Panel Handlers
historyBtn.addEventListener('click', () => {
  renderHistory();
  historyOverlay.style.display = 'flex';
});

closeHistoryBtn.addEventListener('click', () => {
  historyOverlay.style.display = 'none';
});

// Mobile Question List Toggle
questionToggleBtn.addEventListener('click', () => {
  if (questionList.classList.contains('open')) {
    questionList.classList.remove('open');
    questionToggleBtn.textContent = '❯';
  } else {
    questionList.classList.add('open');
    questionToggleBtn.textContent = '❮';
  }
});

/**
 * Quiz Preparation and Timer Functions
 */

function prepareQuiz() {
  mainContent.style.display = 'none';
  quizArea.style.display = 'block';

  if (gradingMethod === 'perQuestion') {
    timerDisplay.style.display = 'block';
    scoreBox.style.display = 'block';
    scoreBox.textContent = `Correct: 0/${questions.length}`;
    finalSubmitBtn.style.display = 'none';
  } else if (gradingMethod === 'allAtOnce') {
    timerDisplay.style.display = 'block';
    finalSubmitBtn.style.display = 'inline-block';
    finalSubmitBtn.textContent = 'Submit';
    scoreBox.style.display = 'none';
    quizContent.classList.add('all-at-once');
  }

  totalTime = questions.length * 120;
  timeLeft = totalTime;
  startTimer();
}

function startTimer() {
  updateTimerDisplay(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timeLeft = 0;
      updateTimerDisplay(timeLeft);
      alert("Time's up!");
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  timerDisplay.textContent = `Remaining: ${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function handleTimeUp() {
  if (gradingMethod === 'perQuestion') {
    stopTimer();
    showCompletionMessage(correctCountSoFar);
    saveHistoryPerQuestion(true);
  } else {
    finalSubmitBtn.click();
  }
}

/**
 * Quiz Implementation - Grade Per Question
 */

function startQuizPerQuestion() {
  questionList.style.display = 'none';
  quizContent.classList.add('no-sidebar');
  quizContent.classList.remove('with-sidebar');
  quizContainer.innerHTML = '';
  currentQuestionIndex = 0;
  showQuestionPerQuestion(currentQuestionIndex);
}

function showQuestionPerQuestion(index) {
  quizContainer.innerHTML = '';

  if (index >= questions.length) {
    stopTimer();
    showCompletionMessage(correctCountSoFar);
    saveHistoryPerQuestion(false);
    return;
  }

  const qData = questions[index];
  const block = createQuestionBlock(qData, index);
  quizContainer.appendChild(block);

  const checkBtn = block.querySelector('.check-answer-btn');
  const nextBtn = block.querySelector('.next-question-btn');
  const explanationEl = block.querySelector('.explanation');

  setupQuestionHandlers(checkBtn, nextBtn, explanationEl, qData, index);
}

function createQuestionBlock(qData, index) {
  const block = document.createElement('div');
  block.classList.add('question-block');
  block.id = `qblock-${index}`;
  
  let buttonsHtml = '';
  if (gradingMethod === 'perQuestion') {
    buttonsHtml = `
      <div class="button-container">
        <button class="check-answer-btn">Submit</button>
        <button class="next-question-btn" style="display:none">Next Question</button>
      </div>
    `;
  }

  block.innerHTML = `
    <h3>Question ${index + 1}: ${qData.question}</h3>
    <div class="options-container">
      ${qData.options.map((opt, oIdx) => 
        `<label>
          <input type="radio" name="question${index}" value="${opt}" id="q${index}o${oIdx}">
          <span>${opt}</span>
        </label>`
      ).join('')}
    </div>
    ${buttonsHtml}
    <div class="explanation"></div>
  `;
  return block;
}

function setupQuestionHandlers(checkBtn, nextBtn, explanationEl, qData, index) {
  checkBtn.addEventListener('click', () => {
    const selected = document.querySelector(`input[name="question${index}"]:checked`);
    if (!selected) {
      alert("Please select an answer!");
      return;
    }

    userAnswers[index] = selected.value;
    const correctTxt = extractAnswer(qData.correct);
    const isCorrect = (selected.value.trim() === correctTxt.trim());

    if (isCorrect) {
      correctCountSoFar++;
      explanationEl.classList.add('correct');
      explanationEl.classList.remove('incorrect');
      explanationEl.textContent = `✅ Good job! ✅ 
        Explanation: 🔑 ${qData.explanation} 🔑`;
    } else {
      explanationEl.classList.remove('correct');
      explanationEl.classList.add('incorrect');
      explanationEl.textContent = `❌ Oh no :( ❌
        The correct answer is: ❤️‍🩹 ${correctTxt} ❤️‍🩹. Explanation: 🔑 ${qData.explanation} 🔑`;
    }

    explanationEl.style.display = 'block';
    checkBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    scoreBox.textContent = `Correct ${correctCountSoFar}/${questions.length}`;
  });

  nextBtn.addEventListener('click', () => {
    showQuestionPerQuestion(index + 1);
  });
}

/**
 * Quiz Implementation - Grade All at Once
 */

function startQuizAllAtOnce() {
  questionList.style.display = 'block';
  quizContent.classList.add('with-sidebar', 'all-at-once');
  quizContent.classList.remove('no-sidebar');
  quizContainer.innerHTML = '';
  questionButtons = [];

  setupQuestionList();
  setupFinalSubmitButton();
}

function setupQuestionList() {
  questionList.innerHTML = '<h4>Question List</h4>';
  
  questions.forEach((qData, idx) => {
    const block = createQuestionBlock(qData, idx);
    quizContainer.appendChild(block);

    const qBtn = createQuestionButton(idx, block);
    questionList.appendChild(qBtn);
    questionButtons.push(qBtn);

    setupRadioHandlers(block, idx);
  });
}

function createQuestionButton(idx, block) {
  const qBtn = document.createElement('button');
  qBtn.textContent = `Question ${idx + 1}`;
  qBtn.classList.add('q-btn-gray');

  qBtn.addEventListener('click', () => {
    const headerOffset = 60;
    const elementPosition = block.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  });

  return qBtn;
}

function setupRadioHandlers(block, idx) {
  const radios = block.querySelectorAll(`input[name="question${idx}"]`);
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      userAnswers[idx] = radio.value;
      updateQuestionButton(idx);
    });
  });
}

function setupFinalSubmitButton() {
  finalSubmitBtn.style.display = 'inline-block';
  finalSubmitBtn.textContent = 'Submit';
  finalSubmitBtn.onclick = handleFinalSubmit;
}

function handleFinalSubmit() {
  stopTimer();
  
  const unanswered = questions.filter((_, idx) => !userAnswers[idx]);
  if (unanswered.length > 0 && !confirm(`You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`)) {
    return;
  }

  const results = gradeAllQuestions();
  displayResults(results.correctCount);
  saveFinalResults(results);
}

function gradeAllQuestions() {
  let correctCount = 0;
  
  questions.forEach((qData, idx) => {
    const chosen = userAnswers[idx] || "";
    const correctTxt = extractAnswer(qData.correct);
    const isCorrect = chosen.trim() === correctTxt.trim();
    
    if (isCorrect) correctCount++;
    
    displayQuestionResult(qData, idx, chosen, correctTxt, isCorrect);
  });

  return { correctCount };
}

function displayQuestionResult(qData, idx, chosen, correctTxt, isCorrect) {
  const block = document.getElementById(`qblock-${idx}`);
  const explanationEl = block.querySelector('.explanation');
  explanationEl.style.display = 'block';

  if (isCorrect) {
    explanationEl.classList.remove('incorrect');
    explanationEl.classList.add('correct');
    explanationEl.textContent = `✅ Good job! ✅ 
      Explanation: 🔑 ${qData.explanation} 🔑`;
  } else {
    explanationEl.classList.remove('correct');
    explanationEl.classList.add('incorrect');
    explanationEl.textContent = `❌ Oh no :( ❌
      The correct answer is: ❤️‍🩹 ${correctTxt} ❤️‍🩹. Explanation: 🔑 ${qData.explanation} 🔑`;
    questionButtons[idx].classList.remove('q-btn-green');
    questionButtons[idx].classList.add('q-btn-red');
  }
}

function updateQuestionButton(idx) {
  if (userAnswers[idx] && userAnswers[idx].trim() !== "") {
    questionButtons[idx].classList.remove('q-btn-gray', 'q-btn-red');
    questionButtons[idx].classList.add('q-btn-green');
  } else {
    questionButtons[idx].classList.remove('q-btn-green', 'q-btn-red');
    questionButtons[idx].classList.add('q-btn-gray');
  }
}

function displayResults(correctCount) {
  finalSubmitBtn.textContent = 'End Test';
  finalSubmitBtn.onclick = resetQuiz;
  timerDisplay.style.display = 'none';
  scoreBox.textContent = `Correct: ${correctCount}/${questions.length}`;
  scoreBox.style.display = 'block';
  finalSubmitBtn.style.display = 'inline-block';
}

/**
 * History Management
 */

function renderHistory() {
  const historyKey = 'quizHistory';
  const currentHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
  
  if (currentHistory.length === 0) {
    historyContent.innerHTML = '<p>No history found. Please start your first test!</p>';
    return;
  }

  historyContent.innerHTML = generateHistoryHTML(currentHistory);
}

function generateHistoryHTML(history) {
  return history.slice().reverse().map((item, idx) => `
    <div class="history-item">
      <strong>Test #${history.length - idx}</strong><br/>
      Time: ${item.time}<br/>
      Method: ${item.method}<br/>
      Result: ${item.result}<br/>

      <details>
        <summary>Details</summary>
        ${generateQuestionDetailsHTML(item.detailAnswers)}
      </details>

      <details>
        <summary>Input Test</summary>
        <pre style="white-space: pre-wrap;">${escapeHTML(item.data)}</pre>
      </details>

      <button class="delete-history-btn" onclick="deleteHistory(${history.length - idx - 1})">
        Delete
      </button>
    </div>
  `).join('');
}

function generateQuestionDetailsHTML(detailAnswers) {
  if (!detailAnswers) return '';
  
  return detailAnswers.map((ans, aIdx) => `
    <div class="history-question ${ans.isCorrect ? 'correct' : 'incorrect'}">
      <strong>Question ${aIdx+1}:</strong> ${ans.question}<br/>
      Your choice: ${ans.chosenAnswer || '(not answered)'}<br/>
      Correct answer: ${ans.correctAnswer}<br/>
      Explanation: ${ans.explanation}
    </div>
  `).join('');
}

function deleteHistory(index) {
  const historyKey = 'quizHistory';
  let currentHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
  
  if (index >= 0 && index < currentHistory.length) {
    currentHistory.splice(index, 1);
    localStorage.setItem(historyKey, JSON.stringify(currentHistory));
  }
  
  renderHistory();
}

function saveToHistory(method, detailAnswers, correctCount, total) {
  const historyKey = 'quizHistory';
  let currentHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
  
  const entry = {
    time: new Date().toLocaleString('vi-VN'),
    method: method,
    data: inputData.value,
    detailAnswers: detailAnswers,
    result: `Correct: ${correctCount}/${total}`
  };
  
  currentHistory.push(entry);
  localStorage.setItem(historyKey, JSON.stringify(currentHistory));
}

function saveHistoryPerQuestion(isTimeout) {
  const detailAnswers = questions.map((qData, idx) => {
    const chosen = userAnswers[idx] || "";
    const correctTxt = extractAnswer(qData.correct);
    const isCorrect = (chosen.trim() === correctTxt.trim());
    return {
      question: qData.question,
      chosenAnswer: chosen,
      correctAnswer: qData.correct,
      explanation: qData.explanation,
      isCorrect: isCorrect
    };
  });

  saveToHistory(
    'Grade per Sentence' + (isTimeout ? ' (timeout)' : ''),
    detailAnswers,
    correctCountSoFar,
    questions.length
  );
}

function saveFinalResults(results) {
  const detailAnswers = questions.map((qData, idx) => {
    const chosen = userAnswers[idx] || "";
    const correctTxt = extractAnswer(qData.correct);
    const isCorrect = (chosen.trim() === correctTxt.trim());
    return {
      question: qData.question,
      chosenAnswer: chosen,
      correctAnswer: qData.correct,
      explanation: qData.explanation,
      isCorrect: isCorrect
    };
  });

  saveToHistory('Grade at the End', detailAnswers, results.correctCount, questions.length);
}

/**
 * Helper Functions
 */

function showCompletionMessage(correctCount) {
  timerDisplay.style.display = 'none';
  scoreBox.style.display = 'none';

  const timeSpent = totalTime - timeLeft;
  const averageTime = (timeSpent / questions.length).toFixed(2);

  quizContainer.innerHTML = `
    <div class="completion-block">
      <h2>You have completed the test!</h2>
      <p>Average Speed: ${averageTime} seconds per question</p>
      <p>Correct answers: ${correctCount}</p>
      <button class="again-btn" onclick="resetQuiz()">Do Another Test</button>
    </div>
  `;
}

function resetQuiz() {
  stopTimer();
  
  // Reset display states
  timerDisplay.style.display = 'none';
  scoreBox.style.display = 'none';
  finalSubmitBtn.style.display = 'none';
  quizContainer.innerHTML = '';
  questionList.innerHTML = '';
  questionList.style.display = 'none';
  quizArea.style.display = 'none';
  mainContent.style.display = 'flex';
  startContainer.style.display = 'flex';
  
  // Reset content
  inputData.value = '';
  timerDisplay.textContent = 'Remaining: 00:00';
  scoreBox.textContent = 'Correct: 0/0';

  // Reset state
  userAnswers = [];
  questions = [];
  gradingMethod = null;
  correctCountSoFar = 0;
  questionButtons = [];

  // Reset classes
  quizContent.classList.remove('with-sidebar', 'no-sidebar', 'all-at-once');
  questionList.classList.remove('open');
  questionToggleBtn.textContent = '❯';
}

/**
 * Question Parsing Functions
 */

function parseQuestions(rawData) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = rawData;
  const detailsList = tempDiv.querySelectorAll('details');
  const result = [];

  detailsList.forEach((dt) => {
    const summary = dt.querySelector('summary');
    if (!summary) return;

    const questionData = extractQuestionData(summary.textContent.trim(), dt.textContent);
    if (isValidQuestionData(questionData)) {
      result.push(questionData);
    }
  });

  return result;
}

function extractQuestionData(summaryText, detailText) {
  const splitted = summaryText.split('\n').map(s => s.trim()).filter(s => s);
  
  const options = {
    a: splitted.find(line => line.startsWith('a)')),
    b: splitted.find(line => line.startsWith('b)')),
    c: splitted.find(line => line.startsWith('c)')),
    d: splitted.find(line => line.startsWith('d)'))
  };

  const answerMatch = detailText.match(/Answer:\s*(.+)/i);
  const explainMatch = detailText.match(/Giải thích:\s*(.+)/i);

  return {
    question: splitted[0] || '',
    options: [
      options.a ? options.a.substring(2).trim() : '',
      options.b ? options.b.substring(2).trim() : '',
      options.c ? options.c.substring(2).trim() : '',
      options.d ? options.d.substring(2).trim() : ''
    ],
    correct: answerMatch ? answerMatch[1].trim() : '',
    explanation: explainMatch ? explainMatch[1].trim() : ''
  };
}

function isValidQuestionData(data) {
  return data.question && data.options.every(opt => opt);
}

function extractAnswer(answerStr) {
  const idxParen = answerStr.indexOf(')');
  return idxParen !== -1 ? answerStr.substring(idxParen + 1).trim() : answerStr.trim();
}

function escapeHTML(str) {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return str.replace(/[&<>"'=\/]/g, char => htmlEntities[char]);
}

// Initialize Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('Service Worker registered successfully:', registration);
    })
    .catch(error => {
      console.log('Service Worker registration failed:', error);
    });
}
