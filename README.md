# Universal AI Translator

Universal AI Translator is a full-stack demo application that converts documents, media, and YouTube content into translated text, summaries, and chat-ready knowledge. It combines a React/Vite frontend with a FastAPI backend, LangChain retrieval, Ollama LLM inference, Whisper transcription, and Chroma embeddings.

## 🚀 What it does

- Translate text from uploaded documents and media files
- Transcribe audio/video files and extract text
- Download and transcribe YouTube videos
- Summarize content and generate keynotes
- Maintain session-based document context for chat interactions
- Support PDF, PPTX, TXT, MP3, WAV, M4A, MP4, MKV, WEBM, MOV

## 📁 Project structure

- `frontend/`: React UI built with Vite
- `backend/`: FastAPI API and processing services
- `backend/services/`: document parsing, transcription, and LLM engine logic
- `start.sh`: helper script to start backend, frontend, and verify Ollama

## 🧠 Architecture

### Frontend

- React 19
- Vite bundler
- Axios for HTTP requests
- React Router for navigation
- UI components for upload, translation, and chat

### Backend

- FastAPI REST API
- Ollama LLM via `langchain_community.llms.Ollama`
- Chroma vector store for session-based retrieval
- Whisper for audio/video transcription
- `yt-dlp` for YouTube audio extraction
- PyPDF2 and python-pptx for document parsing

## 📦 Supported payloads

- Documents: `pdf`, `pptx`, `txt`
- Audio/video: `mp3`, `wav`, `m4a`, `mp4`, `mkv`, `webm`, `mov`
- YouTube URL processing

## 🔧 Requirements

### System requirements

- macOS (project tested on macOS)
- Python 3.11+ recommended
- Node.js 18+ / npm
- Homebrew (for installing `ffmpeg` if not already installed)
- Local Ollama instance accessible at `http://localhost:11434`

### Backend Python packages

Backend dependencies are not currently pinned in a requirements file, but roughly include:

- `fastapi`
- `uvicorn`
- `pydantic`
- `PyPDF2`
- `python-pptx`
- `langchain`
- `langchain-community`
- `chromadb`
- `huggingface-hub` / `transformers` dependencies for embeddings
- `whisper`
- `yt_dlp`

## ⚙️ Setup

### 1. Install frontend dependencies

```bash
cd frontend
npm install
```

### 2. Create backend venv and install Python packages

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic PyPDF2 python-pptx langchain langchain-community chromadb whisper yt_dlp
```

> If you already have a `backend/venv`, skip venv creation and activate it with `source backend/venv/bin/activate`.

### 3. Install `ffmpeg`

```bash
brew install ffmpeg
```

### 4. Run Ollama locally

Ensure Ollama is running and has the `llama3.1` model available.

## ▶️ Running the app

### Option 1: Start everything with the helper script

```bash
./start.sh
```

This script:

1. checks if Ollama is running
2. starts the FastAPI backend at `http://localhost:8000`
3. starts the React frontend at `http://localhost:5173`

### Option 2: Start manually

Backend:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

## 🌐 API endpoints

- `GET /` — health check
- `POST /upload` — upload a document or media file
- `POST /youtube` — provide a YouTube URL for audio extraction and transcription
- `POST /chat` — ask questions against a previously indexed session document

## 🧪 Example usage

### Upload and translate

- Upload a file via the UI
- Choose a target language
- Receive extracted text plus translated output

### YouTube transcription

- Paste a valid YouTube URL
- The backend downloads audio, transcribes it, and indexes the text

### Chat

- After uploading a file or processing YouTube content, use session chat
- Ask follow-up questions using the uploaded content as context

## 💡 Notes

- Sessions are identified by `session_id` and stored in-memory per run
- Chroma is used for vector search and retrieval of relevant chunks
- The current translation and summary flows use prompt-based LLM calls
- Errors from unsupported formats are returned as API HTTP errors

## 🚧 Future improvements

- add a `requirements.txt` / `pyproject.toml`
- persist session data across restarts
- expose configurable target languages in the frontend
- add user authentication
- support more document formats and better long-text chunking

## 📄 License

Use and extend this repository as needed. No license file is included in this repo.
