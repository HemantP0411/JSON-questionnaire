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
    answers: {},           // Map: questionIndex -> { selectedIds: Set, isSubmitted: bool, isCorrect: bool, isPartial: bool, isSkipped: bool }
    paletteFilter: 'all',  // 'all' | 'pending' | 'skipped' | 'answered'
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

    // Quiz top bar
    currentQNum: document.getElementById('current-q-num'),
    totalQNum: document.getElementById('total-q-num'),
    liveScoreValue: document.getElementById('live-score-value'),
    liveScoreAttempted: document.getElementById('live-score-attempted'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    mobilePaletteBtn: document.getElementById('mobile-palette-btn'),
    paletteSummaryCount: document.getElementById('palette-summary-count'),

    // Question card
    questionCard: document.getElementById('question-card'),
    qTopicBadge: document.getElementById('q-topic-badge'),
    qTypeBadge: document.getElementById('q-type-badge'),
    qSkippedBadge: document.getElementById('q-skipped-badge'),
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
    skipBtn: document.getElementById('skip-btn'),
    submitBtn: document.getElementById('submit-btn'),
    nextBtn: document.getElementById('next-btn'),
    finishBtn: document.getElementById('finish-btn'),

    // Sidebar Question Palette
    quizSidebarPalette: document.getElementById('quiz-sidebar-palette'),
    paletteTotalPill: document.getElementById('palette-total-pill'),
    closePaletteDrawerBtn: document.getElementById('close-palette-drawer-btn'),
    paletteDrawerBackdrop: document.getElementById('palette-drawer-backdrop'),
    sidebarPaletteGrid: document.getElementById('sidebar-palette-grid'),
    countCorrect: document.getElementById('count-correct'),
    countIncorrect: document.getElementById('count-incorrect'),
    countSkipped: document.getElementById('count-skipped'),
    countPending: document.getElementById('count-pending'),
    filterChips: document.querySelectorAll('.filter-chip'),

    // Results screen
    resultsTitle: document.getElementById('results-title'),
    resultsMessage: document.getElementById('results-message'),
    resPercentage: document.getElementById('res-percentage'),
    resCorrect: document.getElementById('res-correct'),
    resIncorrect: document.getElementById('res-incorrect'),
    resSkipped: document.getElementById('res-skipped'),
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
        // High harmonic chime
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
      // Audio fails silently if restricted by browser policy
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

    closePaletteDrawer();
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
    }, 3000);
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
    state.paletteFilter = 'all';

    // Reset filter chips UI
    el.filterChips.forEach(chip => {
      if (chip.getAttribute('data-filter') === 'all') {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Initialize answer records
    questionsList.forEach((_, idx) => {
      state.answers[idx] = {
        selectedIds: new Set(),
        isSubmitted: false,
        isCorrect: false,
        isPartial: false,
        isSkipped: false
      };
    });

    hideUploadError();
    switchScreen('quiz');
    renderCurrentQuestion();
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

    // Show Skipped badge if question is currently skipped and not yet submitted
    if (answerRecord.isSkipped && !answerRecord.isSubmitted) {
      el.qSkippedBadge.classList.remove('hidden');
    } else {
      el.qSkippedBadge.classList.add('hidden');
    }

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

    // Re-render Question Palette
    renderQuestionPalette();

    // Auto-scroll active button into view in palette
    scrollActivePaletteButtonIntoView();
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
  // Skip Question Logic
  // ==========================================================================
  function skipCurrentQuestion() {
    const answerRecord = state.answers[state.currentIndex];
    if (answerRecord.isSubmitted) return;

    playSound('click');
    answerRecord.isSkipped = true;

    showToast(`Question ${state.currentIndex + 1} skipped`);

    // Move to next question or if at the end, find next unattempted
    if (state.currentIndex < state.questions.length - 1) {
      goToNextQuestion();
    } else {
      // Look for first unattempted question
      const nextUnanswered = state.questions.findIndex((_, idx) => {
        const a = state.answers[idx];
        return !a.isSubmitted && idx !== state.currentIndex;
      });
      if (nextUnanswered !== -1) {
        state.currentIndex = nextUnanswered;
      }
      renderCurrentQuestion();
    }
  }

  // ==========================================================================
  // Answer Submission & Verification
  // ==========================================================================
  function submitAnswer() {
    const currentQ = state.questions[state.currentIndex];
    const answerRecord = state.answers[state.currentIndex];

    if (answerRecord.isSubmitted || answerRecord.selectedIds.size === 0) return;

    answerRecord.isSubmitted = true;
    answerRecord.isSkipped = false; // Reset skipped flag when answered

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

    // Scroll slightly down to feedback if on mobile
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
      // Question not submitted: show Skip and Check Answer
      el.skipBtn.classList.remove('hidden');
      el.submitBtn.classList.remove('hidden');
      el.submitBtn.disabled = answerRecord.selectedIds.size === 0;

      el.nextBtn.classList.add('hidden');
      el.finishBtn.classList.add('hidden');
    } else {
      // Question submitted: hide Skip and Check Answer
      el.skipBtn.classList.add('hidden');
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
  // Question Palette ("Nearby Question Tab")
  // ==========================================================================
  function renderQuestionPalette() {
    const total = state.questions.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let pendingCount = 0;

    // Calculate status counts
    state.questions.forEach((_, idx) => {
      const ans = state.answers[idx];
      if (ans.isSubmitted) {
        if (ans.isCorrect) correctCount++;
        else incorrectCount++;
      } else if (ans.isSkipped) {
        skippedCount++;
      } else {
        pendingCount++;
      }
    });

    // Update Palette Legend Counters
    el.countCorrect.textContent = correctCount;
    el.countIncorrect.textContent = incorrectCount;
    el.countSkipped.textContent = skippedCount;
    el.countPending.textContent = pendingCount;

    // Update Header Pill & Mobile trigger count
    const answeredCount = correctCount + incorrectCount;
    el.paletteTotalPill.textContent = `${total} Qs`;
    el.paletteSummaryCount.textContent = `${answeredCount}/${total}`;

    // Render Question Grid Buttons based on current filter
    el.sidebarPaletteGrid.innerHTML = '';

    state.questions.forEach((_, idx) => {
      const ans = state.answers[idx];
      const isSubmitted = ans.isSubmitted;
      const isSkipped = !isSubmitted && ans.isSkipped;
      const isPending = !isSubmitted && !ans.isSkipped;

      // Filter check
      if (state.paletteFilter === 'pending' && !isPending) return;
      if (state.paletteFilter === 'skipped' && !isSkipped) return;
      if (state.paletteFilter === 'answered' && !isSubmitted) return;

      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = idx + 1;
      btn.setAttribute('data-index', idx);

      // Status class
      if (isSubmitted) {
        if (ans.isCorrect) {
          btn.classList.add('correct');
          btn.title = `Question ${idx + 1}: Correct`;
        } else {
          btn.classList.add('incorrect');
          btn.title = `Question ${idx + 1}: Incorrect`;
        }
      } else if (isSkipped) {
        btn.classList.add('skipped');
        btn.title = `Question ${idx + 1}: Skipped`;
      } else {
        btn.classList.add('pending');
        btn.title = `Question ${idx + 1}: Not Attempted`;
      }

      // Active indicator
      if (idx === state.currentIndex) {
        btn.classList.add('active');
      }

      // Click to jump straight to question!
      btn.addEventListener('click', () => {
        state.currentIndex = idx;
        renderCurrentQuestion();
        closePaletteDrawer();
      });

      el.sidebarPaletteGrid.appendChild(btn);
    });
  }

  function scrollActivePaletteButtonIntoView() {
    setTimeout(() => {
      const activeBtn = el.sidebarPaletteGrid.querySelector('.palette-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }

  function openPaletteDrawer() {
    el.quizSidebarPalette.classList.add('drawer-open');
    el.paletteDrawerBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePaletteDrawer() {
    el.quizSidebarPalette.classList.remove('drawer-open');
    el.paletteDrawerBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
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
    let incorrect = 0;
    let skipped = 0;

    Object.values(state.answers).forEach(ans => {
      if (ans.isSubmitted) {
        if (ans.isCorrect) correct++;
        else incorrect++;
      } else if (ans.isSkipped) {
        skipped++;
      } else {
        skipped++; // Unattempted treated as skipped in final summary
      }
    });

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    el.resPercentage.textContent = `${percentage}%`;
    el.resCorrect.textContent = correct;
    el.resIncorrect.textContent = incorrect;
    el.resSkipped.textContent = skipped;
    el.resTotal.textContent = total;

    // Encouraging Titles & Messages
    if (percentage === 100) {
      el.resultsTitle.textContent = 'Perfect Score! 🌟';
      el.resultsMessage.textContent = 'Outstanding! You answered every question correctly.';
    } else if (percentage >= 70) {
      el.resultsTitle.textContent = 'Well Done! 🎉';
      el.resultsMessage.textContent = 'Great performance! You demonstrated solid knowledge.';
    } else if (percentage >= 50) {
      el.resultsTitle.textContent = 'Good Effort! 👍';
      el.resultsMessage.textContent = 'Not bad, review the skipped and missed questions below to level up!';
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
      const isSubmitted = ans && ans.isSubmitted;
      const isCorrect = isSubmitted && ans.isCorrect;
      const isSkipped = !isSubmitted;

      const itemCard = document.createElement('div');
      itemCard.className = `review-item-card ${
        isCorrect ? 'is-correct' : (isSkipped ? 'is-skipped' : 'is-incorrect')
      }`;

      // Status pill
      let statusPill = '';
      if (isCorrect) {
        statusPill = `<span class="badge" style="background: var(--success-surface); color: var(--success-text);">✓ Correct</span>`;
      } else if (isSkipped) {
        statusPill = `<span class="badge badge-skipped">↷ Skipped</span>`;
      } else {
        statusPill = `<span class="badge" style="background: var(--danger-surface); color: var(--danger-text);">✕ Incorrect</span>`;
      }

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
      // Do not handle shortcuts if focus is in a textarea or input or modal is open
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (!screens.quiz.classList.contains('active')) return;

      const currentQ = state.questions[state.currentIndex];
      const answerRecord = state.answers[state.currentIndex];

      const key = e.key.toUpperCase();

      // Skip Shortcut (Key: S)
      if (key === 'S' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!answerRecord.isSubmitted) {
          e.preventDefault();
          skipCurrentQuestion();
          return;
        }
      }

      // Option selection by number keys 1-9
      if (/^[1-9]$/.test(key)) {
        const index = parseInt(key, 10) - 1;
        if (currentQ && currentQ.options[index] && !answerRecord.isSubmitted) {
          e.preventDefault();
          handleOptionSelect(currentQ.options[index].id);
          return;
        }
      }

      // Letter keys A-D (or any option letter)
      if (/^[A-Z]$/.test(key) && key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const index = key.charCodeAt(0) - 65;
        if (currentQ && currentQ.options[index] && !answerRecord.isSubmitted) {
          e.preventDefault();
          handleOptionSelect(currentQ.options[index].id);
          return;
        }
      }

      // Enter key (Submit / Next)
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
        return;
      }

      // Arrow Left / Arrow Right for question navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousQuestion();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextQuestion();
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
    el.skipBtn.addEventListener('click', skipCurrentQuestion);
    el.submitBtn.addEventListener('click', submitAnswer);
    el.nextBtn.addEventListener('click', goToNextQuestion);
    el.prevBtn.addEventListener('click', goToPreviousQuestion);
    el.finishBtn.addEventListener('click', showResultsScreen);

    // Mobile Question Palette drawer controls
    el.mobilePaletteBtn.addEventListener('click', openPaletteDrawer);
    el.closePaletteDrawerBtn.addEventListener('click', closePaletteDrawer);
    el.paletteDrawerBackdrop.addEventListener('click', closePaletteDrawer);

    // Palette Filter Chips
    el.filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        el.filterChips.forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.paletteFilter = e.currentTarget.getAttribute('data-filter') || 'all';
        renderQuestionPalette();
      });
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
      if (e.key === 'Escape') {
        if (!el.pasteModal.classList.contains('hidden')) {
          el.pasteModal.classList.add('hidden');
        }
        if (el.quizSidebarPalette.classList.contains('drawer-open')) {
          closePaletteDrawer();
        }
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
