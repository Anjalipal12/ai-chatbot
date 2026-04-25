# 🤖 AI Chatbot — FastAPI + OpenAI GPT

A full-featured AI chatbot built with **FastAPI**, **OpenAI GPT**, and a clean dark-mode UI. Supports real-time **streaming responses**, multi-turn conversation memory, and multiple GPT models.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5%20%7C%20GPT--4-412991?style=flat&logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ Features

- 💬 **Multi-turn conversations** — maintains full context across the chat session
- ⚡ **Streaming mode** — token-by-token real-time responses (Server-Sent Events)
- 🧠 **Multiple models** — switch between GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo
- 🎨 **Clean dark UI** — responsive chat interface built with vanilla JS/CSS
- 📊 **Token tracking** — live display of API tokens consumed
- 🔒 **Secure** — API key stored in `.env`, never exposed to the frontend
- 🚀 **REST API** — clean FastAPI endpoints, auto-documented via Swagger UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| AI | OpenAI GPT API (chat completions + streaming) |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Templating | Jinja2 |
| Config | python-dotenv |

---

## 📁 Project Structure

```
ai-chatbot/
├── main.py                 # FastAPI app — routes, OpenAI calls, streaming
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── .gitignore
├── templates/
│   └── index.html          # Chat UI (Jinja2 template)
└── static/
    ├── css/
    │   └── style.css       # Dark-mode chat styles
    └── js/
        └── chat.js         # Frontend logic — send, stream, render
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Anjalipal12/ai-chatbot.git
cd ai-chatbot
```

### 2. Create a virtual environment
```bash
python -m venv venv

# Activate it:
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure your OpenAI API key
```bash
cp .env.example .env
```
Open `.env` and add your key:
```
OPENAI_API_KEY=sk-...your_key_here...
```
Get your API key from: https://platform.openai.com/api-keys

### 5. Run the application
```bash
uvicorn main:app --reload
```

Open your browser at **http://localhost:8000** 🎉

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Chat UI |
| `POST` | `/api/chat` | Send message, get full response |
| `POST` | `/api/chat/stream` | Send message, get streaming response (SSE) |
| `GET` | `/api/health` | API key & server health check |
| `GET` | `/api/models` | List available models |
| `GET` | `/docs` | Interactive Swagger API documentation |

### Example API call (Python)
```python
import requests

response = requests.post("http://localhost:8000/api/chat", json={
    "messages": [
        {"role": "user", "content": "Explain machine learning in simple terms"}
    ],
    "model": "gpt-3.5-turbo"
})

print(response.json()["reply"])
```

### Example API call (curl)
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}], "model": "gpt-3.5-turbo"}'
```

---

## 🔑 How It Works

```
User types message
       │
       ▼
  chat.js (frontend)
  Adds message to conversation history
       │
       ▼
  POST /api/chat or /api/chat/stream
       │
       ▼
  main.py (FastAPI backend)
  Prepends system prompt
  Sends full history to OpenAI API
       │
       ▼
  OpenAI GPT (cloud)
  Returns response / streams tokens
       │
       ▼
  Response rendered in UI
  History updated for next turn
```

---

## 💡 Key Concepts Demonstrated

- **Prompt Engineering** — system prompt controls AI persona and behavior
- **Conversation memory** — full history sent with each request for context
- **Streaming with SSE** — Server-Sent Events for real-time token delivery
- **FastAPI async** — async route handlers for non-blocking inference
- **Pydantic validation** — request/response models with automatic validation
- **Environment security** — secrets managed via `.env`, excluded from Git

---

## 🚀 Possible Extensions

- [ ] Add user authentication (JWT)
- [ ] Save chat history to a database (SQLite / PostgreSQL)
- [ ] Deploy to AWS / GCP / Railway
- [ ] Add image input support (GPT-4 Vision)
- [ ] Integrate LangChain for advanced agent workflows
- [ ] Add RAG (Retrieval-Augmented Generation) with a vector database

---

## 👩‍💻 Author

**Anjali Pal** — B.Tech Computer Science (AI), Arya College of Engineering

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/anjali-pal-2b94aa290)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github)](https://github.com/Anjalipal12)

---

## 📄 License

This project is licensed under the MIT License.
