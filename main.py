from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.requests import Request
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Optional, List
import json

load_dotenv()

app = FastAPI(title="AI Chatbot", description="A chatbot powered by OpenAI GPT", version="1.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a helpful, friendly, and knowledgeable AI assistant. 
You provide clear, concise, and accurate answers. 
When asked about code, always provide well-commented examples.
Be conversational but professional."""


class Message(BaseModel):
    role: str
    content: str

    class Config:
        orm_mode = True


class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = "gpt-3.5-turbo"
    stream: Optional[bool] = False

    class Config:
        orm_mode = True


class ChatResponse(BaseModel):
    reply: str
    model: str
    tokens_used: int

    class Config:
        orm_mode = True


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Serve the main chat interface."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send messages to OpenAI and get a response.
    Maintains conversation history for context-aware replies.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )

        reply = response.choices[0].message.content
        tokens_used = response.usage.total_tokens

        return ChatResponse(
            reply=reply,
            model=response.model,
            tokens_used=tokens_used,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream responses token-by-token using Server-Sent Events.
    Gives a real-time typing effect in the UI.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in request.messages]

    def generate():
        try:
            stream = client.chat.completions.create(
                model=request.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield f"data: {json.dumps({'token': delta})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    api_key_set = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "status": "healthy",
        "api_key_configured": api_key_set,
        "version": "1.0.0"
    }


@app.get("/api/models")
async def list_models():
    """Return available OpenAI models."""
    return {
        "models": [
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "description": "Fast & cost-effective"},
            {"id": "gpt-4", "name": "GPT-4", "description": "Most capable, slower"},
            {"id": "gpt-4-turbo-preview", "name": "GPT-4 Turbo", "description": "Latest GPT-4"},
        ]
    }