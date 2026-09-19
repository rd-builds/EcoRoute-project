# 🌱 GreenMind AI

> **Think green. Prompt smart.**

GreenMind is an AI efficiency layer that helps users make smarter and more sustainable AI interactions.

Instead of sending every task to the most powerful model with unnecessarily long prompts, GreenMind analyzes what the user is trying to accomplish, optimizes the prompt, identifies task complexity, recommends an appropriate model tier, and provides an estimated efficiency impact.

---

## 🚀 The Problem

AI usage is growing rapidly, but not every task requires the same amount of computation.

A simple question, a coding task, and a complex research problem may require very different levels of AI capability.

However, users often:

* Write unnecessarily long prompts
* Use powerful models for simple tasks
* Repeat unnecessary context
* Don't know which model is appropriate
* Have little visibility into the computational impact of their AI usage

This can lead to unnecessary computation and resource usage.

---

## 💡 Our Solution

**GreenMind** acts as an intelligent efficiency layer between the user and AI tools.

It helps users:

1. Understand their task
2. Optimize their prompt while preserving intent
3. Determine task complexity
4. Recommend an appropriate model tier
5. Compare prompt efficiency
6. Estimate relative environmental impact
7. Provide a simple **Green Score**

### Core idea

> **Use the right amount of AI for the task — not more, not less.**

---

# ✨ Key Features

## 🌐 GreenMind Web App

The website provides a guided AI task-advisor experience.

### 1. Task Discovery

Users first tell GreenMind what they are trying to accomplish.

Examples:

* 💻 Coding
* 🔬 Research
* ✍️ Writing
* 📚 Learning
* 📊 Data Analysis
* 🎨 Creative Work

GreenMind can then ask a small number of relevant follow-up questions.

---

### 2. AI Tool Selection

Users can specify which AI tool they are using.

Examples:

* ChatGPT
* Gemini
* Claude
* Other / Not sure

This context helps GreenMind provide a more relevant recommendation.

---

### 3. Prompt Optimization

GreenMind analyzes the user's original prompt and creates a more concise and effective version while preserving the original intent and important requirements.

**Example:**

**Original**

> I want you to please explain Java inheritance to me in a detailed but easy-to-understand way and give me some examples so that I can understand it properly.

**Optimized**

> Explain Java inheritance in simple terms with practical examples.

---

### 4. Prompt Efficiency

GreenMind compares the original and optimized prompts.

Example:

```text
Original tokens:    42
Optimized tokens:   29

Reduction:          31%
```

The reduction is calculated from the prompts rather than being a fabricated value.

---

### 5. Task Complexity

GreenMind categorizes tasks into:

```text
LOW
MEDIUM
HIGH
```

The purpose is to determine how much reasoning/computational capability the task reasonably requires.

---

### 6. Model Recommendation

GreenMind recommends an appropriate **model tier** based on the task.

```text
Low complexity      → Efficient / smaller model
Medium complexity   → Medium model
High complexity     → Advanced model
```

The goal is not to always use the most powerful model, but to use an appropriate one for the task.

---

### 7. Green Score 🌱

GreenMind provides a simple relative efficiency indicator based on factors such as:

* Prompt efficiency
* Task complexity
* Model selection
* Estimated computational impact

Example:

```text
        🌱
       91
  GREEN SCORE
```

The Green Score is a **relative product indicator**, not a scientific measurement.

---

### 8. Estimated Environmental Impact

GreenMind provides a simple estimated impact indicator.

```text
Energy       Low
Carbon       Low
Water        Low
```

These are estimates based on the project's methodology and assumptions rather than direct measurement of the resources consumed by an individual prompt.

---

# 🧩 GreenMind Browser Extension

GreenMind is also designed as a Chrome extension that works alongside existing AI tools.

### Current MVP target

**ChatGPT**

The extension allows users to optimize a prompt without leaving the AI application.

### Flow

```text
User types prompt
       ↓
🌱 GreenMind
       ↓
Analyze prompt
       ↓
Show optimization
       ↓
Replace prompt
       ↓
User sends prompt
```

### Extension features

* 🌱 Optimize prompt
* 🧠 Task complexity
* 📊 Token comparison
* 🤖 Model recommendation
* 🌍 Estimated impact
* 🌱 Green Score
* 📋 Copy optimized prompt
* ✨ Replace prompt

---

# 🏗️ System Architecture

```text
                    GREENMIND
                        │
             ┌──────────┴──────────┐
             │                     │
          WEBSITE              EXTENSION
     GreenMind Advisor       GreenMind Copilot
             │                     │
             └──────────┬──────────┘
                        │
                        ↓
                 GreenMind API
                        │
                        ↓
                  AI / LLM API
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      Optimize      Classify      Recommend
          │             │             │
          └─────────────┼─────────────┘
                        ↓
                Impact + Green Score
```

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* JavaScript

## Backend

* Python
* FastAPI
* Pydantic

## AI

* LLM API
* Prompt optimization
* Task classification
* Model recommendation

## Browser Extension

* Chrome Extension Manifest V3
* JavaScript
* HTML
* CSS
* Chrome Extension APIs

## Development

* Git
* GitHub
* Antigravity
* VS Code

---

# 📁 Project Structure

```text
GREENMIND/
│
├── backend/
│   ├── main.py
│   ├── analyzer.py
│   ├── optimizer.py
│   ├── classifier.py
│   ├── recommender.py
│   ├── impact.py
│   ├── requirements.txt
│   └── .env
│
├── website/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── content.css
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── adapters/
│       └── chatgpt.js
│
├── PROJECT_SPEC.md
├── README.md
└── .gitignore
```

---

# 🔌 API

The MVP uses a lightweight backend with a primary analysis endpoint.

## `POST /api/analyze`

### Request

```json
{
  "prompt": "Explain inheritance in Java",
  "taskType": "learning",
  "aiTool": "chatgpt"
}
```

### Response

```json
{
  "optimizedPrompt": "Explain Java inheritance in simple terms with examples.",
  "taskType": "learning",
  "complexity": "low",
  "recommendedModel": "efficient",
  "reason": "The task requires explanation but does not require advanced reasoning.",
  "tokensBefore": 18,
  "tokensAfter": 10,
  "greenScore": 91,
  "impact": {
    "energy": "low",
    "carbon": "low",
    "water": "low"
  }
}
```

---

# 👥 Team Structure

GreenMind is designed for a three-person development team.

### 👤 Person 1 — AI & Backend

Responsible for:

* FastAPI
* LLM integration
* Prompt optimization
* Task classification
* Model recommendation
* Token calculation
* Green Score
* Impact estimation

### 👤 Person 2 — Website

Responsible for:

* Landing page
* Task discovery
* Adaptive questions
* Prompt interface
* Analysis results
* Green Score visualization
* Website UX

### 👤 Person 3 — Extension

Responsible for:

* Chrome Manifest V3
* ChatGPT integration
* Prompt detection
* GreenMind button
* Analysis panel
* Replace Prompt
* Extension UI

---

# 🌱 MVP Scope

GreenMind intentionally focuses on a small, functional prototype.

## Must Have

### Website

* [x] Task selection
* [x] AI tool selection
* [x] Prompt input
* [x] Prompt optimization
* [x] Token comparison
* [x] Complexity classification
* [x] Model recommendation
* [x] Green Score
* [x] Estimated impact
* [x] Copy optimized prompt

### Extension

* [x] Chrome extension
* [x] ChatGPT integration
* [x] Optimize button
* [x] Prompt analysis
* [x] Replace prompt

---

## 🔮 Future Scope

GreenMind can eventually evolve into a broader AI efficiency layer.

### Browser Extension

Support for:

* Gemini
* Claude
* Perplexity
* Other AI applications

### Developer API

Applications could send tasks through GreenMind and receive:

```text
Task classification
       ↓
Prompt optimization
       ↓
Model recommendation
       ↓
Efficiency estimate
```

### AI Infrastructure Layer

GreenMind could eventually operate as an efficiency layer between applications and multiple AI models, automatically selecting appropriate models based on task requirements.

---

# ⚠️ What GreenMind Does NOT Try To Do

GreenMind is **not** designed to:

* Stop people from using AI
* Replace AI assistants
* Measure exact environmental consumption of individual prompts
* Always recommend the smallest model regardless of task requirements

Instead, the goal is:

> **Reduce unnecessary AI computation while preserving the quality and intent of the user's task.**

---

# 🎯 Design Philosophy

GreenMind follows three principles:

### 1. Preserve Intent

Optimization should never change what the user is asking for.

### 2. Right-size AI

Not every task requires the most computationally intensive model.

### 3. Make Efficiency Visible

Users should be able to understand how their prompt and model choice affect overall AI efficiency.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/greenmind.git
cd greenmind
```

## 2. Start the backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

The API will be available locally at:

```text
http://localhost:8000
```

---

## 3. Start the website

```bash
cd website

npm install
npm run dev
```

---

## 4. Load the extension

Open Chrome and navigate to:

```text
chrome://extensions
```

Enable:

```text
Developer mode
```

Then select:

```text
Load unpacked
```

Choose the project's:

```text
extension/
```

directory.

---

# 🔐 Environment Variables

API keys should **never be committed to GitHub**.

Create a `.env` file inside the backend:

```env
LLM_API_KEY=your_api_key_here
```

Make sure `.env` is included in `.gitignore`.

Example:

```text
.env
__pycache__/
node_modules/
dist/
```

---

# 🧪 Development Workflow

The project uses separate Git branches for each major component.

```text
main
 │
 ├── feature/backend
 ├── feature/website
 └── feature/extension
```

Each team member works primarily within their assigned directory.

The website and extension communicate with the backend through the shared API contract.

---

# 🌍 Vision

AI should become more capable without becoming unnecessarily wasteful.

GreenMind imagines a future where AI systems don't simply ask:

> **"Can this model answer the task?"**

but also:

> **"What is the right amount of computation for this task?"**

**GreenMind — Think green. Prompt smart. 🌱**

---

## 📌 Status

**Prototype / Hackathon MVP**

Built as a minimal proof of concept demonstrating:

**Task Understanding → Prompt Optimization → Model Recommendation → Efficiency Insight**
