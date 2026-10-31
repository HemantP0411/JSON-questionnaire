/**
 * QuizCraft - Interactive JSON MCQ Engine
 * Pure modern vanilla JavaScript
 */

(function () {
  'use strict';

  // ==========================================================================
  // Global State
  // ==========================================================================
  const state = {
    questions: [],         // Array of parsed question objects
    currentIndex: 0,       // Current question index (0-based)
    answers: {},           // Map: questionIndex -> { selectedIds: Set, isSubmitted: bool, isCorrect: bool, isPartial: bool }
    isSoundEnabled: true,
    theme: 'dark',
    audioCtx: null
  };

  // Sample data fallback embedded directly so it works even offline or on file:// protocol
  const EMBEDDED_SAMPLE_JSON = [
    {
      "id": "q_001",
      "question": "Which of the following IDEs natively support the GitHub Copilot extension? (Select two)",
      "type": "multiple",
      "options": [
        { "id": "a", "text": "Visual Studio Code" },
        { "id": "b", "text": "Eclipse" },
        { "id": "c", "text": "JetBrains IntelliJ IDEA" },
        { "id": "d", "text": "Notepad++" }
      ],
      "correct_option_ids": ["a", "c"],
      "explanation": "GitHub Copilot currently has official extensions for VS Code, Visual Studio, JetBrains IDEs, and Neovim.",
      "topic": "Environment Setup"
    },
    {
      "id": "q_002",
      "question": "What is the capital of France?",
      "type": "single",
      "options": [
        { "id": "a", "text": "London" },
        { "id": "b", "text": "Berlin" },
        { "id": "c", "text": "Paris" },
        { "id": "d", "text": "Madrid" }
      ],
      "correct_option_ids": ["c"],
      "explanation": "Paris is the capital and largest city of France.",
      "topic": "Geography"
    },
    {
      "id": "q_003",
      "question": "Which HTTP status codes indicate client-side errors? (Select all that apply)",
      "type": "multiple",
      "options": [
        { "id": "a", "text": "200 OK" },
        { "id": "b", "text": "400 Bad Request" },
        { "id": "c", "text": "404 Not Found" },
        { "id": "d", "text": "500 Internal Server Error" }
      ],
      "correct_option_ids": ["b", "c"],
      "explanation": "4xx HTTP status codes are designated for client errors (such as 400 Bad Request and 404 Not Found), whereas 5xx indicate server errors.",
      "topic": "Web Protocols"
    },
    {
      "id": "q_004",
      "question": "What will `typeof NaN` evaluate to in JavaScript?",
      "type": "single",
      "options": [
        { "id": "a", "text": "\"number\"" },
        { "id": "b", "text": "\"nan\"" },
        { "id": "c", "text": "\"undefined\"" },
        { "id": "d", "text": "\"object\"" }
      ],
      "correct_option_ids": ["a"],
      "explanation": "In JavaScript, NaN stands for 'Not-a-Number', but its formal type is 'number' per the IEEE 754 floating-point standard.",
      "topic": "JavaScript Fundamentals"
    }
  ];

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const screens = {
    upload: document.getElementById('screen-upload'),
    quiz: document.getElementById('screen-quiz'),
    results: document.getElementById('screen-results')
  };

  const el = {
    // Header controls
    brandLogo: document.getElementById('brand-logo'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    iconSoundOn: document.querySelector('.icon-sound-on'),
    iconSoundOff: document.querySelector('.icon-sound-off'),
    iconSun: document.querySelector('.icon-sun'),
    iconMoon: document.querySelector('.icon-moon'),
    exitQuizBtn: document.getElementById('exit-quiz-btn'),

    // Upload screen
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    loadSampleBtn: document.getElementById('load-sample-btn'),
    pasteJsonBtn: document.getElementById('paste-json-btn'),
    uploadError: document.getElementById('upload-error'),
    uploadErrorMsg: document.getElementById('upload-error-msg'),
    uploadErrorClose: document.getElementById('upload-error-close'),

    // Quiz screen
    currentQNum: document.getElementById('current-q-num'),
    totalQNum: document.getElementById('total-q-num'),
    liveScoreValue: document.getElementById('live-score-value'),
    liveScoreAttempted: document.getElementById('live-score-attempted'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    toggleGridBtn: document.getElementById('toggle-grid-btn'),
    questionsGridDrawer: document.getElementById('questions-grid-drawer'),
    questionsGridList: document.getElementById('questions-grid-list'),

    // Question card
    questionCard: document.getElementById('question-card'),
    qTopicBadge: document.getElementById('q-topic-badge'),
    qTypeBadge: document.getElementById('q-type-badge'),
    qHintInstruction: document.getElementById('q-hint-instruction'),
    qText: document.getElementById('q-text'),
    optionsContainer: document.getElementById('options-container'),

    // Feedback & explanation
    feedbackCard: document.getElementById('feedback-card'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackDesc: document.getElementById('feedback-desc'),
    explanationBox: document.getElementById('explanation-box'),
    explanationText: document.getElementById('explanation-text'),

    // Action buttons
    prevBtn: document.getElementById('prev-btn'),
    submitBtn: document.getElementById('submit-btn'),
    nextBtn: document.getElementById('next-btn'),
    finishBtn: document.getElementById('finish-btn'),

    // Results screen
    resultsTitle: document.getElementById('results-title'),
    resultsMessage: document.getElementById('results-message'),
    resPercentage: document.getElementById('res-percentage'),
    resCorrect: document.getElementById('res-correct'),
    resIncorrect: document.getElementById('res-incorrect'),
    resTotal: document.getElementById('res-total'),
    resRetryBtn: document.getElementById('res-retry-btn'),
    resReviewBtn: document.getElementById('res-review-btn'),
    resNewBtn: document.getElementById('res-new-btn'),
    reviewList: document.getElementById('review-list'),

    // Paste Modal
    pasteModal: document.getElementById('paste-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalSubmitBtn: document.getElementById('modal-submit-btn'),
    pasteTextarea: document.getElementById('paste-textarea'),
    modalError: document.getElementById('modal-error'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // Audio Synthesis (Web Audio API - No external assets required)
  // ==========================================================================
  function playSound(type) {
    if (!state.isSoundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!state.audioCtx) {
        state.audioCtx = new AudioContext();
      }
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }

      const now = state.audioCtx.currentTime;
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      if (type === 'correct') {
        // High harmonic chord
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'incorrect') {
        // Low soft thud
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.25); // C3
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'click') {
        // Subtle tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      // Audio playback fails silently if restricted
    }
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('quizcraft_theme') || 'dark';
    setTheme(savedTheme);

    const savedSound = localStorage.getItem('quizcraft_sound');
    if (savedSound !== null) {
      state.isSoundEnabled = savedSound === 'true';
      updateSoundUI();
    }
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quizcraft_theme', theme);

    if (theme === 'light') {
      el.iconSun.style.display = 'block';
      el.iconMoon.style.display = 'none';
    } else {
      el.iconSun.style.display = 'none';
      el.iconMoon.style.display = 'block';
    }
  }

  function toggleTheme() {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  function toggleSound() {
    state.isSoundEnabled = !state.isSoundEnabled;
    localStorage.setItem('quizcraft_sound', state.isSoundEnabled);
    updateSoundUI();
    if (state.isSoundEnabled) {
      playSound('click');
      showToast('Sound effects enabled');
    } else {
      showToast('Sound effects muted');
    }
  }

  function updateSoundUI() {
    if (state.isSoundEnabled) {
      el.iconSoundOn.style.display = 'block';
      el.iconSoundOff.style.display = 'none';
    } else {
      el.iconSoundOn.style.display = 'none';
      el.iconSoundOff.style.display = 'block';
    }
  }

  // ==========================================================================
  // JSON Validation & Normalization
  // ==========================================================================
  function validateAndNormalizeQuestions(jsonStringOrData) {
    let data = jsonStringOrData;
    if (typeof jsonStringOrData === 'string') {
      try {
        data = JSON.parse(jsonStringOrData);
      } catch (err) {
        throw new Error(`Invalid JSON Syntax: ${err.message}`);
      }
    }

    if (!Array.isArray(data)) {
      throw new Error('JSON root must be an array of questions: [ { ... }, { ... } ]');
    }

    if (data.length === 0) {
      throw new Error('The questions array is empty. Please provide at least one question.');
    }

    const validated = [];

    data.forEach((item, index) => {
      const qIndexStr = `Question #${index + 1}`;

      if (!item || typeof item !== 'object') {
        throw new Error(`${qIndexStr} is not a valid question object.`);
      }

      if (!item.question || typeof item.question !== 'string' || item.question.trim() === '') {
        throw new Error(`${qIndexStr} is missing a valid 'question' text.`);
      }

      if (!Array.isArray(item.options) || item.options.length < 2) {
        throw new Error(`${qIndexStr} must contain an 'options' array with at least 2 choices.`);
      }

      // Check each option
      const optionIds = new Set();
      const normalizedOptions = item.options.map((opt, optIdx) => {
        if (!opt || typeof opt !== 'object') {
          throw new Error(`${qIndexStr}, Option #${optIdx + 1} is invalid.`);
        }
        const optId = opt.id !== undefined && opt.id !== null ? String(opt.id).trim() : String.fromCharCode(97 + optIdx);
        const optText = opt.text !== undefined && opt.text !== null ? String(opt.text).trim() : '';

        if (!optText) {
          throw new Error(`${qIndexStr}, Option "${optId}" is missing 'text'.`);
        }

        optionIds.add(optId);
        return {
          id: optId,
          text: optText
        };
      });

      // Check correct_option_ids
      if (!Array.isArray(item.correct_option_ids) || item.correct_option_ids.length === 0) {
        throw new Error(`${qIndexStr} is missing 'correct_option_ids' array.`);
      }

      const correctIds = item.correct_option_ids.map(id => String(id).trim());

      // Validate that all correct_option_ids exist in options
      correctIds.forEach(cid => {
        if (!optionIds.has(cid)) {
          throw new Error(`${qIndexStr}: correct_option_id "${cid}" does not match any option id in [${Array.from(optionIds).join(', ')}].`);
        }
      });

      // Determine or validate question type
      let type = item.type ? String(item.type).toLowerCase().trim() : null;
      if (type !== 'single' && type !== 'multiple') {
        // Infer automatically based on number of correct options
        type = correctIds.length > 1 ? 'multiple' : 'single';
      }

      validated.push({
        id: item.id ? String(item.id) : `q_${index + 1}`,
        question: item.question.trim(),
        type: type,
        options: normalizedOptions,
        correct_option_ids: correctIds,
        explanation: item.explanation ? String(item.explanation).trim() : null,
        topic: item.topic ? String(item.topic).trim() : null
      });
    });

    return validated;
  }

  // ==========================================================================
  // Screen Switching
  // ==========================================================================
  function switchScreen(screenName) {
    Object.keys(screens).forEach(key => {
      screens[key].classList.remove('active');
    });
    screens[screenName].classList.add('active');

    if (screenName === 'quiz') {
      el.exitQuizBtn.classList.remove('hidden');
    } else {
      el.exitQuizBtn.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // Toast Notifications
  // ==========================================================================
  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.textContent = message;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function showUploadError(msg) {
    el.uploadErrorMsg.textContent = msg;
    el.uploadError.classList.remove('hidden');
  }

  function hideUploadError() {
    el.uploadError.classList.add('hidden');
  }

  // ==========================================================================
  // Quiz Initialization
  // ==========================================================================
  function startQuiz(questionsList) {
    state.questions = questionsList;
    state.currentIndex = 0;
    state.answers = {};

    // Initialize answer records
    questionsList.forEach((_, idx) => {
      state.answers[idx] = {
        selectedIds: new Set(),
        isSubmitted: false,
        isCorrect: false,
        isPartial: false
      };
    });

    hideUploadError();
    el.questionsGridDrawer.classList.add('hidden');
    switchScreen('quiz');
    renderCurrentQuestion();
    renderQuestionsGrid();
  }

  // ==========================================================================
  // Current Question Rendering
  // ==========================================================================
  function renderCurrentQuestion() {
    const total = state.questions.length;
    const currentQ = state.questions[state.currentIndex];
    const answerRecord = state.answers[state.currentIndex];

    // Update Header Tracker
    el.currentQNum.textContent = state.currentIndex + 1;
    el.totalQNum.textContent = total;

    // Update Progress Bar
    const progressPct = ((state.currentIndex + 1) / total) * 100;
    el.progressBarFill.style.width = `${progressPct}%`;
    el.progressBarFill.parentElement.setAttribute('aria-valuenow', Math.round(progressPct));

    // Update Live Score Tally
    updateLiveScoreBadge();

    // Badges
    if (currentQ.topic) {
      el.qTopicBadge.textContent = currentQ.topic;
      el.qTopicBadge.classList.remove('hidden');
    } else {
      el.qTopicBadge.classList.add('hidden');
    }

    const isMultiple = currentQ.type === 'multiple';
    el.qTypeBadge.textContent = isMultiple ? 'Multiple Choice' : 'Single Choice';
    el.qHintInstruction.textContent = isMultiple
      ? `Select all that apply (${currentQ.correct_option_ids.length} correct)`
      : 'Select 1 option';

    // Render Question Text (with backtick code formatting)
    el.qText.innerHTML = formatCodeSnippets(escapeHTML(currentQ.question));

    // Render Options
    el.optionsContainer.innerHTML = '';
    const isSubmitted = answerRecord.isSubmitted;

    currentQ.options.forEach((opt, idx) => {
      const optionCard = document.createElement('div');
      optionCard.className = 'option-item';
      optionCard.setAttribute('data-id', opt.id);
      optionCard.setAttribute('tabindex', isSubmitted ? '-1' : '0');
      optionCard.setAttribute('role', isMultiple ? 'checkbox' : 'radio');
      optionCard.setAttribute('aria-checked', answerRecord.selectedIds.has(opt.id) ? 'true' : 'false');

      const isSelected = answerRecord.selectedIds.has(opt.id);
      if (isSelected) {
        optionCard.classList.add('selected');
      }

      // Letter indicator (A, B, C, D...)
      const letter = String.fromCharCode(65 + idx);

      // Indicator Icon (Radio dot or Checkbox tick)
      let indicatorHTML = '';
      if (isMultiple) {
        indicatorHTML = `
          <div class="option-indicator indicator-checkbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        `;
      } else {
        indicatorHTML = `<div class="option-indicator indicator-radio"></div>`;
      }

      // Render Option Contents
      optionCard.innerHTML = `
        <span class="option-key" title="Keyboard key: ${letter}">${letter}</span>
        <span class="option-text">${formatCodeSnippets(escapeHTML(opt.text))}</span>
        ${indicatorHTML}
      `;

      // Post-submission styling
      if (isSubmitted) {
        optionCard.classList.add('locked');
        const isCorrectChoice = currentQ.correct_option_ids.includes(opt.id);

        if (isSelected && isCorrectChoice) {
          optionCard.classList.add('is-correct-selected');
          const tag = document.createElement('span');
          tag.className = 'option-result-tag tag-correct';
          tag.innerHTML = `✓ Correct`;
          optionCard.appendChild(tag);
        } else if (isSelected && !isCorrectChoice) {
          optionCard.classList.add('is-incorrect-selected');
          const tag = document.createElement('span');
          tag.className = 'option-result-tag tag-incorrect';
          tag.innerHTML = `✕ Your Choice`;
          optionCard.appendChild(tag);
        } else if (!isSelected && isCorrectChoice) {
          optionCard.classList.add('is-missed-correct');
          const tag = document.createElement('span');
          tag.className = 'option-result-tag tag-missed';
          tag.innerHTML = `Correct Answer`;
          optionCard.appendChild(tag);
        } else {
          optionCard.classList.add('is-unselected-neutral');
        }
      } else {
        // Click event listener
        optionCard.addEventListener('click', () => handleOptionSelect(opt.id));
        // Keyboard accessibility
        optionCard.addEventListener('keydown', (e) => {
          if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            handleOptionSelect(opt.id);
          }
        });
      }

      el.optionsContainer.appendChild(optionCard);
    });

    // Handle Feedback Card Visibility
    if (isSubmitted) {
      renderFeedbackCard(currentQ, answerRecord);
    } else {
      el.feedbackCard.classList.add('hidden');
    }

    // Update Action Buttons
    updateCardFooterControls();
    renderQuestionsGrid();
  }

  // ==========================================================================
  // Option Selection Logic
  // ==========================================================================
  function handleOptionSelect(optionId) {
    const currentQ = state.questions[state.currentIndex];
    const answerRecord = state.answers[state.currentIndex];

    if (answerRecord.isSubmitted) return;

    playSound('click');

    if (currentQ.type === 'multiple') {
      if (answerRecord.selectedIds.has(optionId)) {
        answerRecord.selectedIds.delete(optionId);
      } else {
        answerRecord.selectedIds.add(optionId);
      }
    } else {
      // Single choice
      answerRecord.selectedIds.clear();
      answerRecord.selectedIds.add(optionId);
    }

    // Re-render UI to reflect changes
    renderCurrentQuestion();
  }

  // ==========================================================================
  // Answer Submission & Verification
  // ==========================================================================
  function submitAnswer() {
    const currentQ = state.questions[state.currentIndex];
    const answerRecord = state.answers[state.currentIndex];

    if (answerRecord.isSubmitted || answerRecord.selectedIds.size === 0) return;

    answerRecord.isSubmitted = true;

    // Check correctness
    const selectedArr = Array.from(answerRecord.selectedIds);
    const correctArr = currentQ.correct_option_ids;

    const correctSelectedCount = selectedArr.filter(id => correctArr.includes(id)).length;
    const incorrectSelectedCount = selectedArr.filter(id => !correctArr.includes(id)).length;

    const isCompletelyCorrect =
      correctSelectedCount === correctArr.length &&
      incorrectSelectedCount === 0;

    const isPartiallyCorrect =
      !isCompletelyCorrect &&
      correctSelectedCount > 0 &&
      incorrectSelectedCount === 0;

    answerRecord.isCorrect = isCompletelyCorrect;
    answerRecord.isPartial = isPartiallyCorrect;

    // Play feedback sound
    if (isCompletelyCorrect) {
      playSound('correct');
    } else {
      playSound('incorrect');
    }

    // Re-render question with feedback
    renderCurrentQuestion();

    // Scroll slightly down to feedback if needed
    if (window.innerWidth < 768) {
      el.feedbackCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ==========================================================================
  // Feedback Card Rendering
  // ==========================================================================
  function renderFeedbackCard(question, answerRecord) {
    el.feedbackCard.classList.remove('hidden', 'correct', 'incorrect', 'partial');

    if (answerRecord.isCorrect) {
      el.feedbackCard.classList.add('correct');
      el.feedbackIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      el.feedbackTitle.textContent = 'Correct Answer!';
      el.feedbackDesc.textContent = 'Great job! Your selection matches the correct answer.';
    } else if (answerRecord.isPartial) {
      el.feedbackCard.classList.add('partial');
      el.feedbackIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
      el.feedbackTitle.textContent = 'Partially Correct';
      el.feedbackDesc.textContent = `You selected ${answerRecord.selectedIds.size} of ${question.correct_option_ids.length} correct answers.`;
    } else {
      el.feedbackCard.classList.add('incorrect');
      el.feedbackIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      el.feedbackTitle.textContent = 'Incorrect';
      const correctOptionLabels = question.options
        .filter(o => question.correct_option_ids.includes(o.id))
        .map(o => `"${o.text}"`)
        .join(', ');
      el.feedbackDesc.textContent = `The correct answer is: ${correctOptionLabels}`;
    }

    // Explanation
    if (question.explanation) {
      el.explanationBox.classList.remove('hidden');
      el.explanationText.innerHTML = formatCodeSnippets(escapeHTML(question.explanation));
    } else {
      el.explanationBox.classList.add('hidden');
    }
  }

  // ==========================================================================
  // Footer Controls & Navigation
  // ==========================================================================
  function updateCardFooterControls() {
    const isFirst = state.currentIndex === 0;
    const isLast = state.currentIndex === state.questions.length - 1;
    const answerRecord = state.answers[state.currentIndex];

    // Previous button
    el.prevBtn.disabled = isFirst;

    if (!answerRecord.isSubmitted) {
      // Show Submit button
      el.submitBtn.classList.remove('hidden');
      el.submitBtn.disabled = answerRecord.selectedIds.size === 0;
      el.nextBtn.classList.add('hidden');
      el.finishBtn.classList.add('hidden');
    } else {
      // Hide Submit button
      el.submitBtn.classList.add('hidden');

      if (!isLast) {
        el.nextBtn.classList.remove('hidden');
        el.finishBtn.classList.add('hidden');
      } else {
        el.nextBtn.classList.add('hidden');
        el.finishBtn.classList.remove('hidden');
      }
    }
  }

  function goToPreviousQuestion() {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      renderCurrentQuestion();
    }
  }

  function goToNextQuestion() {
    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      renderCurrentQuestion();
    }
  }

  // ==========================================================================
  // Questions Grid Drawer
  // ==========================================================================
  function renderQuestionsGrid() {
    el.questionsGridList.innerHTML = '';

    state.questions.forEach((_, idx) => {
      const btn = document.createElement('button');
      btn.className = 'grid-num-btn';
      btn.textContent = idx + 1;

      if (idx === state.currentIndex) {
        btn.classList.add('active');
      }

      const ans = state.answers[idx];
      if (ans && ans.isSubmitted) {
        if (ans.isCorrect) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('incorrect');
        }
      }

      btn.addEventListener('click', () => {
        state.currentIndex = idx;
        renderCurrentQuestion();
      });

      el.questionsGridList.appendChild(btn);
    });
  }

  function updateLiveScoreBadge() {
    let correctCount = 0;
    let submittedCount = 0;

    Object.values(state.answers).forEach(ans => {
      if (ans.isSubmitted) {
        submittedCount++;
        if (ans.isCorrect) correctCount++;
      }
    });

    el.liveScoreValue.textContent = correctCount;
    el.liveScoreAttempted.textContent = submittedCount;
  }

  // ==========================================================================
  // Results & Score Calculation
  // ==========================================================================
  function showResultsScreen() {
    const total = state.questions.length;
    let correct = 0;

    Object.values(state.answers).forEach(ans => {
      if (ans.isCorrect) correct++;
    });

    const incorrect = total - correct;
    const percentage = Math.round((correct / total) * 100);

    el.resPercentage.textContent = `${percentage}%`;
    el.resCorrect.textContent = correct;
    el.resIncorrect.textContent = incorrect;
    el.resTotal.textContent = total;

    // Custom Encouraging Title & Message
    if (percentage === 100) {
      el.resultsTitle.textContent = 'Perfect Score! 🌟';
      el.resultsMessage.textContent = 'Outstanding! You answered every question correctly.';
    } else if (percentage >= 70) {
      el.resultsTitle.textContent = 'Well Done! 🎉';
      el.resultsMessage.textContent = 'Great performance! You demonstrated solid knowledge.';
    } else if (percentage >= 50) {
      el.resultsTitle.textContent = 'Good Effort! 👍';
      el.resultsMessage.textContent = 'Not bad, review the missed questions below to level up!';
    } else {
      el.resultsTitle.textContent = 'Keep Practicing! 💪';
      el.resultsMessage.textContent = 'Review the detailed answers and explanations below to improve.';
    }

    // Render Detailed Review List
    renderReviewList();
    switchScreen('results');
  }

  function renderReviewList() {
    el.reviewList.innerHTML = '';

    state.questions.forEach((q, idx) => {
      const ans = state.answers[idx];
      const isCorrect = ans && ans.isCorrect;

      const itemCard = document.createElement('div');
      itemCard.className = `review-item-card ${isCorrect ? 'is-correct' : 'is-incorrect'}`;

      // Status pill
      const statusPill = isCorrect
        ? `<span class="badge" style="background: var(--success-surface); color: var(--success-text);">✓ Correct</span>`
        : `<span class="badge" style="background: var(--danger-surface); color: var(--danger-text);">✕ Incorrect</span>`;

      // Options list
      const optionsHTML = q.options.map(opt => {
        const isPicked = ans && ans.selectedIds.has(opt.id);
        const isRight = q.correct_option_ids.includes(opt.id);

        let pillClass = '';
        let icon = '';

        if (isPicked && isRight) {
          pillClass = 'chosen-correct';
          icon = '✓';
        } else if (isPicked && !isRight) {
          pillClass = 'chosen-wrong';
          icon = '✕';
        } else if (!isPicked && isRight) {
          pillClass = 'correct-unpicked';
          icon = '★ (Correct Answer)';
        }

        return `
          <div class="review-opt-pill ${pillClass}">
            <strong>${opt.id.toUpperCase()}:</strong>
            <span>${formatCodeSnippets(escapeHTML(opt.text))}</span>
            ${icon ? `<span style="margin-left: auto; font-size: 0.8em; font-weight: 700;">${icon}</span>` : ''}
          </div>
        `;
      }).join('');

      itemCard.innerHTML = `
        <div class="review-item-header">
          <span style="font-weight: 700; color: var(--text-secondary); font-size: 0.8125rem;">Question ${idx + 1} of ${state.questions.length}</span>
          ${statusPill}
        </div>
        <div class="review-q-title">${formatCodeSnippets(escapeHTML(q.question))}</div>
        <div class="review-options-summary">
          ${optionsHTML}
        </div>
        ${q.explanation ? `
          <div class="review-item-exp">
            <strong>Explanation:</strong> ${formatCodeSnippets(escapeHTML(q.explanation))}
          </div>
        ` : ''}
      `;

      el.reviewList.appendChild(itemCard);
    });
  }

  // ==========================================================================
  // File Upload & Input Handlers
  // ==========================================================================
  function handleFileSelect(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      showUploadError('Please select a valid .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const questions = validateAndNormalizeQuestions(e.target.result);
        startQuiz(questions);
        showToast(`Loaded ${questions.length} questions from ${file.name}`);
      } catch (err) {
        showUploadError(err.message);
      }
    };
    reader.onerror = function () {
      showUploadError('Error reading the selected file. Please try again.');
    };
    reader.readAsText(file);
  }

  // Drag and Drop
  function setupDragAndDrop() {
    ['dragenter', 'dragover'].forEach(eventName => {
      el.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.dropZone.classList.add('drag-active');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      el.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.dropZone.classList.remove('drag-active');
      }, false);
    });

    el.dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    el.dropZone.addEventListener('click', () => {
      el.fileInput.click();
    });

    el.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
        e.target.value = ''; // Reset for re-selection
      }
    });
  }

  // ==========================================================================
  // Keyboard Shortcuts
  // ==========================================================================
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Do not handle shortcuts if focus is in a textarea or modal is open
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (!screens.quiz.classList.contains('active')) return;

      const currentQ = state.questions[state.currentIndex];
      const answerRecord = state.answers[state.currentIndex];

      // Option selection by 1-9 or A-Z
      const key = e.key.toUpperCase();

      // Number keys 1-9
      if (/^[1-9]$/.test(key)) {
        const index = parseInt(key, 10) - 1;
        if (currentQ && currentQ.options[index] && !answerRecord.isSubmitted) {
          e.preventDefault();
          handleOptionSelect(currentQ.options[index].id);
        }
      }

      // Letter keys A-Z
      if (/^[A-Z]$/.test(key) && key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const index = key.charCodeAt(0) - 65;
        if (currentQ && currentQ.options[index] && !answerRecord.isSubmitted) {
          e.preventDefault();
          handleOptionSelect(currentQ.options[index].id);
        }
      }

      // Enter key
      if (e.key === 'Enter') {
        if (!answerRecord.isSubmitted) {
          if (answerRecord.selectedIds.size > 0) {
            e.preventDefault();
            submitAnswer();
          }
        } else {
          // If submitted, advance to next question or finish
          e.preventDefault();
          if (state.currentIndex < state.questions.length - 1) {
            goToNextQuestion();
          } else {
            showResultsScreen();
          }
        }
      }

      // Arrow Left / Arrow Right for navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousQuestion();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (answerRecord.isSubmitted || state.currentIndex < state.questions.length - 1) {
          goToNextQuestion();
        }
      }
    });
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCodeSnippets(str) {
    if (!str) return '';
    // Format `code` into <code>code</code>
    return str.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // ==========================================================================
  // Event Bindings
  // ==========================================================================
  function initEventListeners() {
    // Brand Logo -> reset to upload
    el.brandLogo.addEventListener('click', () => {
      if (screens.quiz.classList.contains('active')) {
        if (confirm('Return to file upload? Your current quiz progress will be cleared.')) {
          switchScreen('upload');
        }
      } else {
        switchScreen('upload');
      }
    });

    // Theme & Sound toggles
    el.themeToggleBtn.addEventListener('click', toggleTheme);
    el.soundToggleBtn.addEventListener('click', toggleSound);

    // Exit Quiz button
    el.exitQuizBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to exit? Your progress will be reset.')) {
        switchScreen('upload');
      }
    });

    // Error banner close
    el.uploadErrorClose.addEventListener('click', hideUploadError);

    // Try Sample Button
    el.loadSampleBtn.addEventListener('click', () => {
      // First try to fetch sample-questions.json, fallback to embedded sample
      fetch('sample-questions.json')
        .then(res => res.json())
        .then(data => {
          const questions = validateAndNormalizeQuestions(data);
          startQuiz(questions);
          showToast(`Loaded ${questions.length} sample questions`);
        })
        .catch(() => {
          const questions = validateAndNormalizeQuestions(EMBEDDED_SAMPLE_JSON);
          startQuiz(questions);
          showToast(`Loaded ${questions.length} sample questions`);
        });
    });

    // Paste JSON Modal
    el.pasteJsonBtn.addEventListener('click', () => {
      el.modalError.classList.add('hidden');
      el.pasteModal.classList.remove('hidden');
      el.pasteTextarea.focus();
    });

    el.modalCloseBtn.addEventListener('click', () => {
      el.pasteModal.classList.add('hidden');
    });

    el.modalCancelBtn.addEventListener('click', () => {
      el.pasteModal.classList.add('hidden');
    });

    el.modalSubmitBtn.addEventListener('click', () => {
      const val = el.pasteTextarea.value.trim();
      if (!val) {
        el.modalError.textContent = 'Please enter JSON questions array.';
        el.modalError.classList.remove('hidden');
        return;
      }
      try {
        const questions = validateAndNormalizeQuestions(val);
        el.pasteModal.classList.add('hidden');
        startQuiz(questions);
        showToast(`Loaded ${questions.length} questions`);
      } catch (err) {
        el.modalError.textContent = err.message;
        el.modalError.classList.remove('hidden');
      }
    });

    // Quiz action buttons
    el.submitBtn.addEventListener('click', submitAnswer);
    el.nextBtn.addEventListener('click', goToNextQuestion);
    el.prevBtn.addEventListener('click', goToPreviousQuestion);
    el.finishBtn.addEventListener('click', showResultsScreen);

    // Toggle question grid drawer
    el.toggleGridBtn.addEventListener('click', () => {
      el.questionsGridDrawer.classList.toggle('hidden');
    });

    // Results screen actions
    el.resRetryBtn.addEventListener('click', () => {
      startQuiz(state.questions);
    });

    el.resReviewBtn.addEventListener('click', () => {
      el.reviewList.scrollIntoView({ behavior: 'smooth' });
    });

    el.resNewBtn.addEventListener('click', () => {
      switchScreen('upload');
    });

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !el.pasteModal.classList.contains('hidden')) {
        el.pasteModal.classList.add('hidden');
      }
    });
  }

  // ==========================================================================
  // App Bootstrapper
  // ==========================================================================
  function init() {
    initTheme();
    setupDragAndDrop();
    setupKeyboardShortcuts();
    initEventListeners();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

