# QuizCraft &bull; JSON MCQ Quiz Engine

A modern, responsive, and interactive Multiple Choice Question (MCQ) web application built with vanilla HTML5, CSS3, and JavaScript. It accepts any questionnaire formatted in JSON and presents an interactive test environment with instant feedback, explanations, question skipping, and a live color-coded Question Palette.

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
    - `multiple`: Checkboxes for multi-select questions ("Select all that apply").
- ⏭️ **Skip Question Option**:
  - Dedicated **Skip** button on the question card (and `S` keyboard shortcut).
  - Marks the question as skipped (highlighted in yellow/amber in the palette) and advances to the next question.
  - You can revisit and submit skipped questions at any time!
- 📑 **Nearby Question Palette (Navigator Tab)**:
  - Prominent question palette located right beside the question card (on desktop) or accessible via the **Question Tab** drawer (on mobile).
  - **Color-coded question statuses**:
    - 🟩 **Green**: Answered Correctly
    - 🟥 **Red**: Answered Incorrectly
    - 🟨 **Yellow / Amber**: Skipped
    - ⚪ **Gray**: Pending / Not Visited
    - 🔵 **Glowing Outline**: Current Active Question
  - **Live Legend Counters**: Real-time counts for Correct, Incorrect, Skipped, and Pending questions.
  - **Quick Filter Bar**: Filter palette numbers by `All`, `Pending`, `Skipped`, or `Answered`.
  - **Instant Jump**: Click any question number to directly navigate to it.
- 💡 **Instant Feedback & Explanations**:
  - Clicking **Check Answer** locks the question and instantly highlights:
    - 🟩 Green checkmark & badge for correct options.
    - 🟥 Red cross & badge for incorrectly selected choices.
    - 🟩 Dashed green border for missed correct answers.
  - Detailed explanation card shown whenever `explanation` is provided in the JSON.
- 🏆 **Comprehensive Results Screen**:
  - Percentage accuracy score & grade feedback.
  - Granular breakdown of **Correct**, **Incorrect**, and **Skipped** counts.
  - Full question-by-question review with status badges, choices, and explanations.
  - One-click **Retake Quiz** or **Upload New JSON**.
- ⌨️ **Keyboard Shortcuts**:
  - `A` - `D` or `1` - `4`: Select option
  - `S`: Skip question
  - `Enter`: Check answer / Proceed to next question
  - `←` / `→`: Navigate between previous and next questions
  - `Esc`: Close modal or mobile drawer
- 🎨 **Modern Design & Polish**:
  - Dark Mode & Light Mode toggle (persisted in `localStorage`).
  - Pleasant audio feedback using the Web Audio API (synthesized chime & boop, toggleable/muteable).
  - Mobile, tablet, and desktop responsive layout.
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
├── styles.css              # Modern responsive CSS (Split quiz layout, Dark/Light theme)
├── app.js                  # State engine, validation, Skip logic & Question Palette
├── sample-questions.json   # Ready-to-use sample questionnaire
├── questions/              # Ignored folder for custom datasets
│   └── githubcopilot.json  # 100-question GitHub Copilot questionnaire (local)
├── .gitignore              # Ignores questions/ and custom data files
└── README.md               # Documentation and schema guide
```
