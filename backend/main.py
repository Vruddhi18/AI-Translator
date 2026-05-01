from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil
import uuid

# Services
from services.document_parser import parse_document
from services.transcription import transcribe_audio_video, process_youtube
from services.llm_engine import TranslationEngine

app = FastAPI(title="Universal AI Translator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

llm_engine = TranslationEngine()

class ChatRequest(BaseModel):
    session_id: str
    message: str
    target_lang: str = "en"

class YouTubeRequest(BaseModel):
    url: str

@app.get("/")
async def root():
    return {"message": "Universal AI Translator API is running"}

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    action: str = Form("translate"),
    target_lang: str = Form("en")
):
    try:
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(UPLOAD_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        file_path = os.path.join(session_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        ext = file.filename.split('.')[-1].lower()
        extracted_text = ""
        print(f"Handling upload for {file.filename} (detected extension: {ext})")
        
        # 1. Parsing Document or Transcribing Media
        if ext in ['pdf', 'pptx', 'txt']:
            extracted_text = parse_document(file_path, ext)
        elif ext in ['mp3', 'wav', 'm4a', 'mp4', 'mkv', 'webm', 'mov']:
            extracted_text = transcribe_audio_video(file_path)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")
            
        # 2. Store in VectorDB for Chat
        if extracted_text.strip():
            llm_engine.index_document(session_id, extracted_text)
        else:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # 3. Perform immediate action if needed
        result = {}
        if action == "translate":
            result["translation"] = llm_engine.translate(extracted_text, target_lang)
        elif action == "summarize":
            result["summary"] = llm_engine.summarize(extracted_text)
            
        return {
            "session_id": session_id,
            "filename": file.filename,
            "extracted_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            "result": result
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/youtube")
async def process_youtube_url(req: YouTubeRequest):
    try:
        if not req.url.strip().startswith("http"):
            raise HTTPException(status_code=400, detail="Invalid input. Please paste a valid YouTube URL (e.g., https://youtube.com/...). You pasted standard text.")
            
        session_id = str(uuid.uuid4())
        extracted_text = process_youtube(req.url)
        llm_engine.index_document(session_id, extracted_text)
        return {
            "session_id": session_id,
            "extracted_text": extracted_text[:500] + "...",
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to download or parse from YouTube URL. Check valid URL.")

@app.post("/chat")
async def chat_with_doc(req: ChatRequest):
    try:
        response = llm_engine.chat(req.session_id, req.message, req.target_lang)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
