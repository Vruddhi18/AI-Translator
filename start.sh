#!/bin/bash

# Define absolute path to project root
PROJECT_DIR="/Users/vruddhishah/Desktop/Universal AI Translator"

echo "=========================================="
echo " Starting Universal AI Translator 🚀"
echo "=========================================="

echo "[1/3] Checking Ollama (Llama 3.1) Status..."
if curl -s -f -o /dev/null "http://localhost:11434/"; then
    echo "✅ Ollama is running."
else
    echo "⚠️  Ollama does not appear to be running."
    echo "-> Please ensure you've started Ollama locally."
fi

# Trap to kill background processes on exit
trap 'kill %1 %2 2>/dev/null' SIGINT SIGTERM EXIT

echo "[2/3] Starting Backend API (FastAPI)..."
cd "$PROJECT_DIR/backend"
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
sleep 2

echo "[3/3] Starting Frontend Web App (React via Vite)..."
cd "$PROJECT_DIR/frontend"
zsh -lc "npm run dev &"
FRONTEND_PID=$!

echo "=========================================="
echo " Services are starting up!"
echo " 👉 Frontend UI: http://localhost:5173"
echo " 👉 Backend API: http://localhost:8000"
echo " Press Ctrl+C at any time to stop everything."
echo "=========================================="

wait
