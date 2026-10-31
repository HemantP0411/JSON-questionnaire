# QuizCraft &bull; JSON MCQ Quiz Engine

A modern, responsive, and interactive Multiple Choice Question (MCQ) web application built with vanilla HTML5, CSS3, and JavaScript. It accepts any questionnaire formatted in JSON and presents an interactive test environment with instant feedback and explanations.

---

## ✨ Features

- 📂 **Flexible JSON Input**:
  - **Drag & Drop** or file picker for `.json` files.
  - **One-Click Sample Quiz** preloaded with sample questions to test immediately.
  - **Paste JSON** modal to quickly test snippets without saving a file.
  - **Strict validation & friendly error reporting** for any JSON format issues.
- 🎯 **1 Question at a Time**:
  - Clean card-based question viewer.
  - **Dynamic Input Types**:
    - `single`: Single radio button selection.
    - `multiple`: Checkboxes for multi-select questions.
- 💡 **Instant Feedback & Explanations**:
  - Clicking **Check Answer** instantly highlights:
    - 🟩 Green checkmark & badge for correct options.
    - 🟥 Red cross & badge for incorrectly selected choices.
    - 🟩 Dashed green border for missed correct answers.
  - Detailed explanation card shown whenever `explanation` is provided in the JSON.
- 🧭 **Question Navigator & Live Stats**:
  - Live progress bar (`Question X of Y`).
  - Real-time score ticker.
  - Expandable **Question List map** to quickly jump to any question with color-coded status (Pending, Correct, Incorrect).
  - **Previous / Next** buttons to review answered questions.
- 🏆 **Comprehensive Results Screen**:
  - Percentage accuracy score & grade feedback.
  - Breakdown of correct vs. incorrect answers.
  - Full question-by-question review with all choices and explanations.
  - One-click **Retake Quiz** or **Upload New JSON**.
- ⌨️ **Keyboard Shortcuts**:
  - `A` - `D` or `1` - `4`: Select option
  - `Enter`: Submit answer / Go to next question
  - `←` / `→`: Navigate between previous and next questions
  - `Esc`: Close modal
- 🎨 **Modern Design & Polish**:
  - Dark Mode & Light Mode toggle (preference persisted in `localStorage`).
  - Pleasant audio feedback using the Web Audio API (synthesized chime & boop, toggleable/muteable).
  - Mobile, tablet, and desktop responsive design.
  - **Zero build step or dependencies required**: Runs directly in any browser!

---

## 📋 JSON Format Specification

Your JSON file should contain an array of question objects adhering to the following schema:

```json
[
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
  }
]
```

### Schema Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Optional | Unique question identifier (e.g. `"q_001"`). |
| `question` | `string` | **Yes** | The question text. Supports backtick \`code\` markdown formatting. |
| `type` | `"single"` \| `"multiple"` | **Yes** | `"single"` renders radio buttons; `"multiple"` renders checkboxes. |
| `options` | `Array<{id, text}>` | **Yes** | Array of available options with unique `id` and `text`. |
| `correct_option_ids` | `Array<string>` | **Yes** | Array containing the option IDs that are correct. |
| `explanation` | `string` | Optional | Explanation displayed after the user submits their answer. |
| `topic` | `string` | Optional | Category badge displayed in the question card header. |

---

## 🚀 How to Run

### Method 1: Direct File Open (Zero Setup)
Simply double-click [`index.html`](file:///d:/Codes/Git%20Repos/JSON-questionnaire/index.html) or open it with any web browser (Chrome, Edge, Firefox, Safari).

### Method 2: Local Web Server
You can also serve the directory using Python or Node:

**Using Python:**
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

**Using Node / npx:**
```bash
npx serve .
```

---

## 📁 Project Structure

```text
JSON-questionnaire/
├── index.html              # Main HTML5 application structure
├── styles.css              # Modern responsive CSS (Dark/Light theme)
├── app.js                  # State management, validation, audio & interactions
├── sample-questions.json   # Ready-to-use sample questionnaire
└── README.md               # Documentation and schema guide
```
