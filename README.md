# Aethera AI - Enterprise Generative AI Orchestration Platform

Aethera AI is a production-grade, state-of-the-art Generative AI landing and diagnostic showcase website. It integrates ultra-premium dark/glassmorphic web design, real-time WebGL vector embeddings modeling using Three.js, a local FastAPI simulated RAG database pipeline, and containerized Docker-compose orchestration.

## 🚀 Key Features

* **3D Particle Neural Graph (WebGL)**: Interactive neural network matrix overlay reacting dynamically to cursor gravity and mouse movement.
* **Dynamic 3D Vector Space Embedding Projection**: Complete vector cloud allowing users to "project" semantic strings to visualize cosine similarity distances in 3D.
* **Simulated Corporate RAG Chatbot**: Multi-document indexing engine chunking enterprise AWS manuals, security compliances, and return citations.
* **Core Hardware Monitoring Dashboard**: Sleek dashboard charting cpu/gpu, request throughputs, and model processing diagnostics.

## 🛠️ Architecture Overview

```
├── /frontend              # Next.js 15 app, Tailwind CSS v4, Three.js
│   ├── src/components/3d  # Three.js WebGL scenes (NeuralNetwork, VectorSpace)
│   ├── src/components/ui  # GlassCards, CustomCursors, MagneticButtons
│   └── src/app            # Routing pages and global styles
├── /backend               # FastAPI Python application
│   ├── main.py            # API request routing and statistics generators
│   └── rag_engine.py      # TF-IDF mock FAISS cosine distance retriever
├── docker-compose.yml     # Container orchestration stack
└── README.md
```

## ⚙️ Running Locally

### Prerequisites
* **Node.js**: v18 or later
* **Python**: v3.10 or later

### Starting the Backend
1. Navigate to `/backend`
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   python main.py
   ```
   * *Swagger documentation will be available at: http://localhost:8000/docs*

### Starting the Frontend
1. Navigate to `/frontend`
2. Install packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   * *Website will be live at: http://localhost:3000*

### Containerized Deployment (Docker)
To spin up both services containerized in a unified bridge network, run:
```bash
docker-compose up --build
```
