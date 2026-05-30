import time
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

try:
    from rag_engine import query_rag_system
except ImportError:
    # Fallback if engine is loading
    def query_rag_system(query: str):
        return {
            "answer": f"Mock RAG response to query: '{query}'. System currently initializing.",
            "chunks": [],
            "reasoning": ["System initializing..."],
            "metrics": {"latency_ms": 1.2}
        }

app = FastAPI(
    title="Generative AI Platform Core Backend",
    description="Enterprise RAG Engine & Monitoring Metrics Service API",
    version="1.0.0"
)

# Enable CORS for the frontend next.js client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ChatRequest(BaseModel):
    message: str

class SearchRequest(BaseModel):
    query: str

# Endpoints
@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Synthesizes conversational responses using the custom local RAG engine.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    start_time = time.time()
    result = query_rag_system(request.message)
    latency = (time.time() - start_time) * 1000
    
    result["metrics"]["api_latency_ms"] = round(latency, 2)
    return result

@app.post("/api/search")
async def search_endpoint(request: SearchRequest):
    """
    Simulates high-speed vector space similarity search against index documents.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    result = query_rag_system(request.query)
    # Filter down to search-specific similarity values
    formatted_chunks = []
    for i, chunk in enumerate(result.get("chunks", [])):
        formatted_chunks.append({
            "id": i + 1,
            "document": chunk["source"],
            "text": chunk["text"],
            "score": chunk["score"],
            "vector_coords": [
                round(random.uniform(-1, 1), 4),
                round(random.uniform(-1, 1), 4),
                round(random.uniform(-1, 1), 4)
            ]
        })
        
    return {
        "query": request.query,
        "results": formatted_chunks,
        "search_metrics": {
            "total_matches": len(formatted_chunks),
            "retrieval_time_ms": round(result["metrics"]["latency_ms"], 2)
        }
    }

@app.get("/api/metrics")
async def metrics_endpoint():
    """
    Generates real-time synthetic monitoring metrics representing system utilization.
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "hardware": {
            "cpu_utilization_pct": round(random.uniform(15.0, 45.0), 1),
            "gpu_utilization_pct": round(random.uniform(40.0, 85.0), 1),
            "memory_usage_gb": round(random.uniform(8.4, 12.8), 2),
            "vram_usage_gb": round(random.uniform(14.2, 19.5), 2),
            "temperature_celsius": round(random.uniform(55.0, 72.0), 1)
        },
        "throughput": {
            "tokens_per_second": round(random.uniform(45.2, 120.8), 1),
            "requests_per_minute": round(random.uniform(120, 450)),
            "average_response_ms": round(random.uniform(85, 230), 2)
        },
        "rag_health": {
            "indexed_documents": 248,
            "vector_dimension": 1536,
            "index_size_mb": 42.6,
            "cache_hit_rate_pct": round(random.uniform(88.0, 96.5), 1)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
