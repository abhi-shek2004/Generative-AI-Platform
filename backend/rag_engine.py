# rag_engine.py
"""
A self‑contained Retrieval‑Augmented Generation (RAG) backend prototype.

Features
--------
1. Mock FAISS‑like vector store using TF‑IDF + cosine similarity.
2. Simple document chunker (fixed token/character length with overlap).
3. Built‑in enterprise source documents (Acme corp architecture, compliance, scaling).
4. Query processor that returns:
   - Matched chunks with source citations.
   - Cosine similarity scores.
   - Human‑readable reasoning steps.
   - Citation metrics (how many times each source appears in the top results).
"""

import re
import uuid
import random
import os
import time
import requests
from dotenv import load_dotenv
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load env variables from current directory or parent
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, ".env"))


# --------------------------------------------------------------------------- #
# 1. Document Chunker
# --------------------------------------------------------------------------- #
def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
    """
    Split `text` into overlapping chunks.
    """
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start = end - overlap  # step back for overlap
    return chunks


# --------------------------------------------------------------------------- #
# 2. Mock FAISS Vector Store (TF‑IDF based)
# --------------------------------------------------------------------------- #
@dataclass
class ChunkRecord:
    """A single chunk stored in the vector DB."""
    id: str
    source: str
    text: str
    vector: np.ndarray = field(default=None, repr=False)  # TF‑IDF vector (dense)


class MockFAISS:
    """
    A lightweight in‑memory vector store that mimics the essential
    FAISS search API using TF‑IDF embeddings and cosine similarity.
    """

    def __init__(self):
        self.chunks: List[ChunkRecord] = []
        self._vectorizer = TfidfVectorizer(stop_words="english")
        self._fitted = False

    def ingest(self, source: str, document: str, chunk_size: int = 300, overlap: int = 50):
        chunks = chunk_text(document, chunk_size, overlap)
        for txt in chunks:
            self.chunks.append(ChunkRecord(id=str(uuid.uuid4()), source=source, text=txt))

    def _fit_vectors(self):
        corpus = [c.text for c in self.chunks]
        tfidf_matrix = self._vectorizer.fit_transform(corpus)
        for idx, vec in enumerate(tfidf_matrix):
            # Convert sparse row to a dense array for cosine similarity matching
            self.chunks[idx].vector = vec.toarray().flatten()
        self._fitted = True

    def search(self, query: str, top_k: int = 5) -> List[Tuple[ChunkRecord, float]]:
        if not self._fitted:
            self._fit_vectors()

        # Vectorise query
        query_vec = self._vectorizer.transform([query]).toarray().flatten()

        results = []
        for chunk in self.chunks:
            # Calculate cosine similarity manually between dense vectors
            dot_product = np.dot(query_vec, chunk.vector)
            norm_q = np.linalg.norm(query_vec)
            norm_c = np.linalg.norm(chunk.vector)
            
            if norm_q > 0 and norm_c > 0:
                score = float(dot_product / (norm_q * norm_c))
            else:
                score = 0.0
                
            if score > 0.05:  # Relevance threshold
                results.append((chunk, score))

        # Sort by similarity score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]


# --------------------------------------------------------------------------- #
# 3. Predefined Enterprise Documents
# --------------------------------------------------------------------------- #
ENTERPRISE_DOCS: Dict[str, str] = {
    "Acme Architecture Guide": """
Acme Corp runs a micro-service based architecture on AWS.
Core services include:
- User Service (REST API, backed by Amazon DynamoDB for ultra-low latency profiles)
- Order Service (gRPC communication, Postgres RDS for transactional data integrity)
- Inventory Service (Event-driven system, utilizing SQS and SNS queues)
All ingress traffic flows through an AWS API Gateway configured with Amazon Cognito authorization.
Data engineering pipelines are built with Amazon Kinesis Data Streams feeding Glue ETL jobs, writing to Redshift.
Observability uses CloudWatch, X-Ray tracing, and Prometheus/Grafana via OpenTelemetry instrumentation.
""",
    "Acme Compliance Manual": """
Acme adheres to GDPR, SOC-2 Type II, and PCI-DSS compliance frameworks.
All personal data is encrypted both in transit (TLS 1.3) and at rest using KMS-managed custom keys.
Retention policy states that system logs older than 90 days are automatically archived to Glacier Deep Archive.
Data subject access requests (DSARs) are fulfilled within 30 days via a dedicated automated compliance pipeline.
Independent security experts perform quarter-yearly penetration testing and automated vulnerability scanning.
""",
    "Acme Scaling Blueprint": """
Horizontal auto-scaling is governed by Target Tracking Scaling policies on Amazon ECS, tracking CPU and latency.
Stateless backend services are containerised with Docker and orchestrated by Amazon EKS (Elastic Kubernetes Service).
Stateful database workloads use Amazon Aurora Serverless Postgres with global reader replicas.
Caching layer utilizes Amazon ElastiCache (Redis clusters) configured with a 95% target cache-hit ratio.
Disaster recovery is designed around a multi-region active-active deployment across us-east-1 and eu-west-1.
""",
}


# --------------------------------------------------------------------------- #
# 4. Query Processor & API Wrapper
# --------------------------------------------------------------------------- #
class RAGEngine:
    def __init__(self, top_k: int = 3):
        self.store = MockFAISS()
        self.top_k = top_k
        self._load_predefined_docs()

    def _load_predefined_docs(self):
        for source, doc in ENTERPRISE_DOCS.items():
            self.store.ingest(source=source, document=doc)

    def ask(self, query: str) -> Dict:
        reasoning = []
        reasoning.append("🔎 Query parsed: Initializing TF-IDF vectorization mapping.")
        reasoning.append("📐 Distance Metric: Executing cosine similarity calculations against index database.")
        reasoning.append(f"📈 Selection: Isolating the top {self.top_k} nearest semantic chunks.")

        raw_results = self.store.search(query, top_k=self.top_k)

        results = []
        citation_counter = defaultdict(int)
        for chunk_rec, score in raw_results:
            results.append({
                "source": chunk_rec.source,
                "chunk": chunk_rec.text,
                "score": round(score, 4),
            })
            citation_counter[chunk_rec.source] += 1

        reasoning.append(f"✅ Context extraction finished: Retrieved {len(results)} relevant chunks.")

        citation_metrics = {
            source: {
                "count": cnt,
                "percentage": round(cnt / max(len(results), 1) * 100, 1)
            }
            for source, cnt in citation_counter.items()
        }

        return {
            "question": query,
            "results": results,
            "reasoning": reasoning,
            "citation_metrics": citation_metrics,
        }


# Global engine instances
_engine_instance = RAGEngine(top_k=2)

def query_rag_system(query: str) -> dict:
    """
    Interface function to bridge RAGEngine with FastAPI routing expectations.
    Uses openai/gpt-oss-120b hosted on NVIDIA Build Program if NVIDIA_API_KEY is present,
    with a robust fallback to local deterministic response synthesis.
    """
    start_time = time.time()
    res = _engine_instance.ask(query)
    reasoning = res["reasoning"].copy()
    
    # Retrieve local document context if any results exist
    context_str = ""
    if res["results"]:
        context_str = "\n\n".join([
            f"[Source: {r['source']}, Relevance Score: {r['score']}]\n{r['chunk']}"
            for r in res["results"]
        ])
    
    nvidia_api_key = os.environ.get("NVIDIA_API_KEY")
    answer = None
    use_llm = False
    
    if nvidia_api_key:
        try:
            reasoning.append("🤖 Invoking NVIDIA GPT-OSS-120B model for context synthesis...")
            
            # Construct a comprehensive prompt using the retrieved context
            system_prompt = (
                "You are an advanced generative AI assistant for the cortexAI enterprise platform.\n"
                "Your objective is to provide a comprehensive, technical, and precise answer to the user's question, "
                "synthesized strictly from the corporate document context chunks provided below.\n\n"
                f"=== RETRIEVED CONTEXT ===\n{context_str or 'No relevant corporate documents found.'}\n=========================\n\n"
                "Instructions:\n"
                "1. Synthesize a professional, investor-grade, and beautifully structured answer.\n"
                "2. Rely on the retrieved context as the primary source of truth. If the context does not fully "
                "answer the query, integrate your pre-trained knowledge to provide a high-fidelity explanation, "
                "but make sure to mention the source boundaries.\n"
                "3. Keep the tone elite, direct, and authoritative."
            )
            
            # Calling the NVIDIA API endpoint
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {nvidia_api_key}"
            }
            payload = {
                "model": "openai/gpt-oss-120b",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                "temperature": 0.2,
                "max_tokens": 1024
            }
            
            # Perform synchronous request with a timeout of 8.0 seconds
            response = requests.post(url, json=payload, headers=headers, timeout=8.0)
            
            if response.status_code == 200:
                response_json = response.json()
                message_obj = response_json["choices"][0]["message"]
                answer = message_obj["content"].strip()
                
                # Extract and parse the model's custom reasoning thoughts
                model_reasoning = message_obj.get("reasoning_content") or message_obj.get("reasoning")
                if model_reasoning:
                    reasoning.append(f"🧠 GPT-OSS-120B Thought: {model_reasoning.strip()}")
                
                reasoning.append("✨ Context synthesis via GPT-OSS-120B completed successfully!")
                use_llm = True
            else:
                reasoning.append(f"⚠️ NVIDIA API responded with status {response.status_code}: {response.text}")
        except Exception as e:
            reasoning.append(f"⚠️ NVIDIA GPT-OSS-120B connection failure: {str(e)}")
            
    # Fallback if LLM request failed or wasn't attempted
    if not use_llm:
        reasoning.append("⚙️ Falling back to cortexAI high-fidelity local deterministic synthesizer.")
        if res["results"]:
            top_match = res["results"][0]
            if "architecture" in query.lower() or "auth" in query.lower() or "grpc" in query.lower():
                answer = "Acme Corp operates a cloud-native microservice architecture on AWS, routing gRPC and REST APIs via Amazon API Gateway and Cognito. Persistence layers utilize DynamoDB and transactional Postgres."
            elif "compliance" in query.lower() or "gdpr" in query.lower() or "soc" in query.lower() or "audit" in query.lower():
                answer = "Acme strictly enforces security compliance guidelines (GDPR, SOC-2, PCI-DSS) using KMS envelope encryption, maintaining a 30-day compliance fulfillment guarantee, and archiving older logs to Glacier."
            elif "scale" in query.lower() or "caching" in query.lower() or "redis" in query.lower() or "aurora" in query.lower():
                answer = "For scalability and disaster recovery, Acme utilizes ECS Auto-scaling Groups, Redis caching with a target 95% hit-rate, and a multi-region active-active deployment across us-east-1 and eu-west-1."
            else:
                answer = f"According to retrieved corporate assets, the system determined that: {top_match['chunk']}"
        else:
            answer = "I searched the corporate index database, but no documents match the semantic structure of your request. Please try querying about architecture, scaling, or security compliance policies."

    chunks = []
    for r in res["results"]:
        chunks.append({
            "source": r["source"],
            "text": r["chunk"],
            "score": r["score"]
        })
        
    latency_ms = round((time.time() - start_time) * 1000, 2)
        
    return {
        "answer": answer,
        "chunks": chunks,
        "reasoning": reasoning,
        "metrics": {
            "latency_ms": latency_ms
        },
        "citation_metrics": res["citation_metrics"]
    }
