import whisper
import yt_dlp
import os
import tempfile
import warnings

os.environ["PATH"] += os.pathsep + "/opt/homebrew/bin"

warnings.filterwarnings("ignore", category=UserWarning)

model = None

def load_model():
    global model
    if model is None:
        print("Loading Whisper model...")
        model = whisper.load_model("base")  
    return model

def transcribe_audio_video(file_path: str) -> str:
    m = load_model()
    result = m.transcribe(file_path)
    return result["text"]

def process_youtube(url: str) -> str:
    temp_dir = tempfile.mkdtemp()
    ydl_opts = {
        'format': 'worstaudio/worst',
        'outtmpl': os.path.join(temp_dir, '%(id)s.%(ext)s'),
        'ffmpeg_location': '/opt/homebrew/bin/ffmpeg',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'extractor_args': {'youtube': {'player_client': ['android']}},
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            
            audio_path = None
            for file in os.listdir(temp_dir):
                if file.endswith(".mp3"):
                    audio_path = os.path.join(temp_dir, file)
                    break
            
            if audio_path:
                text = transcribe_audio_video(audio_path)
                return text
            else:
                raise Exception("Failed to extract audio from YouTube URL")
    finally:
        for f in os.listdir(temp_dir):
            if os.path.isfile(os.path.join(temp_dir, f)):
                os.remove(os.path.join(temp_dir, f))
        os.rmdir(temp_dir)
