"use client";

import React, { useState, useEffect, useRef } from "react";
import NeuralNetwork from "@/components/3d/NeuralNetwork";
import VectorSpace from "@/components/3d/VectorSpace";
import GlassCard from "@/components/ui/GlassCard";
import MagneticButton from "@/components/ui/MagneticButton";
import AnimatedMetric from "@/components/ui/AnimatedMetric";
import { 
  Terminal, Cpu, Network, Search, MessageSquare, 
  Settings, ChevronRight, Activity, Server, FileText, ArrowRight 
} from "lucide-react";

// Predefined fallback data if the python backend API is not running locally
const MOCK_CHAT_ANSWERS: Record<string, any> = {
  "architecture": {
    "answer": "Acme Corp operates a cloud-native microservice architecture on AWS, routing gRPC and REST APIs via Amazon API Gateway and Cognito. Persistence layers utilize DynamoDB and transactional Postgres.",
    "chunks": [
      { "source": "Acme Architecture Guide", "text": "Core services include: User Service (REST API, backed by Amazon DynamoDB for ultra-low latency profiles) and Order Service (gRPC, Postgres RDS).", "score": 0.892 },
      { "source": "Acme Architecture Guide", "text": "All ingress traffic flows through an AWS API Gateway configured with Amazon Cognito authorization.", "score": 0.741 }
    ],
    "reasoning": [
      "🔎 Query parsed: Initializing TF-IDF vectorization mapping.",
      "📐 Distance Metric: Executing cosine similarity calculations against index database.",
      "📈 Selection: Isolating the top 2 nearest semantic chunks."
    ],
    "citation_metrics": { "Acme Architecture Guide": { "count": 2, "percentage": 100.0 } }
  },
  "compliance": {
    "answer": "Acme strictly enforces security compliance guidelines (GDPR, SOC-2, PCI-DSS) using KMS envelope encryption, maintaining a 30-day compliance fulfillment guarantee, and archiving older logs to Glacier.",
    "chunks": [
      { "source": "Acme Compliance Manual", "text": "Acme adheres to GDPR, SOC-2 Type II, and PCI-DSS compliance frameworks.", "score": 0.923 },
      { "source": "Acme Compliance Manual", "text": "All personal data is encrypted both in transit (TLS 1.3) and at rest using KMS-managed custom keys.", "score": 0.812 }
    ],
    "reasoning": [
      "🔎 Query parsed: Initializing TF-IDF vectorization mapping.",
      "📐 Distance Metric: Executing cosine similarity calculations against index database.",
      "📈 Selection: Isolating the top 2 nearest semantic chunks."
    ],
    "citation_metrics": { "Acme Compliance Manual": { "count": 2, "percentage": 100.0 } }
  },
  "scaling": {
    "answer": "For scalability and disaster recovery, Acme utilizes ECS Auto-scaling Groups, Redis caching with a target 95% hit-rate, and a multi-region active-active deployment across us-east-1 and eu-west-1.",
    "chunks": [
      { "source": "Acme Scaling Blueprint", "text": "Caching layer utilizes Amazon ElastiCache (Redis clusters) configured with a 95% target cache-hit ratio.", "score": 0.854 },
      { "source": "Acme Scaling Blueprint", "text": "Disaster recovery is designed around a multi-region active-active deployment across us-east-1 and eu-west-1.", "score": 0.784 }
    ],
    "reasoning": [
      "🔎 Query parsed: Initializing TF-IDF vectorization mapping.",
      "📐 Distance Metric: Executing cosine similarity calculations against index database.",
      "📈 Selection: Isolating the top 2 nearest semantic chunks."
    ],
    "citation_metrics": { "Acme Scaling Blueprint": { "count": 2, "percentage": 100.0 } }
  }
};

const DEFAULT_ANSWER = {
  "answer": "I searched the corporate index database, but no documents match the semantic structure of your request. Please try querying about architecture, scaling, or compliance guidelines.",
  "chunks": [],
  "reasoning": [
    "🔎 Query parsed: Initializing TF-IDF vectorization mapping.",
    "📐 Distance Metric: Executing cosine similarity calculations.",
    "⚠️ No matches above the 0.05 relevance threshold were identified."
  ],
  "citation_metrics": {}
};

export default function Home() {
  // Navigation & Page State
  const [systemActive, setSystemActive] = useState(true);
  
  // Semantic Search Simulator State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTime, setSearchTime] = useState(0);
  const [searchActive, setSearchActive] = useState(false);

  // Chatbot State
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "system", text: string }>>([
    { sender: "system", text: "Welcome to CortexAI Orchestration Core. Type query topics such as 'compliance audits', 'database scaling', or 'AWS infrastructure' to trigger multi-node vector retrieval simulations." }
  ]);
  const [systemThought, setSystemThought] = useState<string[]>([]);
  const [citations, setCitations] = useState<Record<string, any>>({});
  const [chatLoading, setChatLoading] = useState(false);

  // Live Metrics State
  const [cpu, setCpu] = useState(24.5);
  const [gpu, setGpu] = useState(62.8);
  const [tokensPerSec, setTokensPerSec] = useState(84.2);

  // Background mock metrics variations
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.max(10, Math.min(90, prev + (Math.random() * 8 - 4))));
      setGpu(prev => Math.max(10, Math.min(95, prev + (Math.random() * 10 - 5))));
      setTokensPerSec(prev => Math.max(30, Math.min(150, prev + (Math.random() * 12 - 6))));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handle live vector space semantic search queries
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchActive(true);
    const start = performance.now();

    try {
      // 1. Try to fetch from the local FastAPI backend
      const res = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
        setSearchTime(data.search_metrics.retrieval_time_ms);
      } else {
        throw new Error("Local backend offline, falling back to mock search");
      }
    } catch (err) {
      // 2. Mock Fallback representation
      setTimeout(() => {
        const queryLower = searchQuery.toLowerCase();
        let targetKey = "";
        if (queryLower.includes("auth") || queryLower.includes("architect") || queryLower.includes("aws")) targetKey = "architecture";
        else if (queryLower.includes("complian") || queryLower.includes("gdpr") || queryLower.includes("soc")) targetKey = "compliance";
        else if (queryLower.includes("scale") || queryLower.includes("redis") || queryLower.includes("caching")) targetKey = "scaling";

        const sourceData = targetKey ? MOCK_CHAT_ANSWERS[targetKey] : DEFAULT_ANSWER;
        const resultsArray = sourceData.chunks.map((c: any, i: number) => ({
          id: i + 1,
          document: c.source,
          text: c.text,
          score: c.score,
          vector_coords: [
            Math.sin(i + Math.random()) * 0.8,
            Math.cos(i + Math.random()) * 0.8,
            Math.sin(i * 2 + Math.random()) * 0.8
          ]
        }));
        setSearchResults(resultsArray);
        setSearchTime(roundNum(performance.now() - start + 8.4));
      }, 350);
    }
  };

  // Handle conversational RAG engine chats
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      // 1. Try fetching from live FastAPI backend
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { sender: "system", text: data.answer }]);
        setSystemThought(data.reasoning);
        setCitations(data.citation_metrics);
      } else {
        throw new Error("Backend offline");
      }
    } catch (err) {
      // 2. Mock Fallback representation
      setTimeout(() => {
        const queryLower = userMsg.toLowerCase();
        let targetKey = "";
        if (queryLower.includes("auth") || queryLower.includes("architect") || queryLower.includes("aws")) targetKey = "architecture";
        else if (queryLower.includes("complian") || queryLower.includes("gdpr") || queryLower.includes("soc")) targetKey = "compliance";
        else if (queryLower.includes("scale") || queryLower.includes("redis") || queryLower.includes("caching")) targetKey = "scaling";

        const data = targetKey ? MOCK_CHAT_ANSWERS[targetKey] : DEFAULT_ANSWER;
        setChatHistory(prev => [...prev, { sender: "system", text: data.answer }]);
        setSystemThought(data.reasoning);
        setCitations(data.citation_metrics);
      }, 500);
    } finally {
      setChatLoading(false);
    }
  };

  const roundNum = (val: number) => Math.round(val * 100) / 100;

  return (
    <div className="relative min-h-screen bg-[#020205] grid-overlay text-gray-200">
      {/* Full-screen Background Video (Fixed, z-index -20) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover pointer-events-none -z-20 brightness-[0.22] contrast-[1.05]"
        style={{ objectPosition: "center" }}
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4" type="video/mp4" />
      </video>

      {/* Premium Ambient Cyber Grids & Glows */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="cyber-grid" />
        <div className="cyber-glow-radial animate-pulse duration-[8000ms]" />
        <div className="cyber-glow-radial-2 animate-pulse duration-[12000ms]" />
      </div>

      {/* 3D Dynamic Particle Neural Network Background */}
      <NeuralNetwork />

      {/* Floating Glass Header */}
      <header className="sticky top-0 z-40 w-full px-6 py-4 backdrop-blur-md border-b border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-500 to-teal-400 flex items-center justify-center font-bold text-black select-none shadow-lg shadow-purple-500/20">
              C
            </div>
            <span className="font-semibold text-lg tracking-wider text-white">CortexAI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#hero" className="hover:text-purple-400 transition-colors">Core System</a>
            <a href="#features" className="hover:text-purple-400 transition-colors">Infrastructure</a>
            <a href="#search" className="hover:text-purple-400 transition-colors">Vector Cloud</a>
            <a href="#demo" className="hover:text-purple-400 transition-colors">RAG Interface</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-300">
              <span className={`h-2 w-2 rounded-full ${systemActive ? 'bg-teal-400 animate-pulse' : 'bg-red-400'}`} />
              API: {systemActive ? "LOCAL_ACTIVE" : "STANDALONE"}
            </div>
            <MagneticButton className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white shadow-lg shadow-purple-500/10">
              Launch Agent
            </MagneticButton>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-24 relative z-10">
        
        {/* Section 1: Hero Section */}
        <section id="hero" className="min-h-[75vh] flex flex-col justify-center items-start text-left max-w-4xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 tracking-wider mb-6">
            <Activity className="h-3 w-3 animate-pulse text-purple-400" />
            MULTI-MODEL COGNITIVE NEURAL ENGINE
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-none">
            Orchestrating <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-teal-300 glow-text-purple">
              Generative Intelligence
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mb-8 leading-relaxed">
            Accelerate system building with production-ready multi-node RAG, low-latency semantic vector search, and dynamic cognitive reasoning agents containerized for massive enterprise scale.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#demo">
              <MagneticButton className="px-6 py-3.5 bg-gradient-to-r from-purple-500 to-teal-400 text-black font-bold rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-teal-400/20 hover:scale-[1.02] transition-all">
                Test Live RAG <ArrowRight className="h-4.5 w-4.5" />
              </MagneticButton>
            </a>
            <a href="#search">
              <button className="px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md font-semibold text-white hover:bg-white/[0.07] transition-all">
                Visualize Vector Space
              </button>
            </a>
          </div>

          {/* Metric Dashboard Count-ups */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full max-w-4xl">
            <div className="border-l-2 border-purple-500 pl-4 py-2">
              <div className="text-3xl font-extrabold text-white">
                <AnimatedMetric value={99.8} suffix="%" decimals={1} />
              </div>
              <div className="text-xs text-gray-500 font-semibold tracking-wider uppercase mt-1">Accuracy Dial</div>
            </div>
            <div className="border-l-2 border-teal-400 pl-4 py-2">
              <div className="text-3xl font-extrabold text-white">
                <AnimatedMetric value={120} suffix="ms" duration={1500} />
              </div>
              <div className="text-xs text-gray-500 font-semibold tracking-wider uppercase mt-1">Avg Latency</div>
            </div>
            <div className="border-l-2 border-rose-500 pl-4 py-2">
              <div className="text-3xl font-extrabold text-white">
                <AnimatedMetric value={42.6} suffix="MB" decimals={1} />
              </div>
              <div className="text-xs text-gray-500 font-semibold tracking-wider uppercase mt-1">Vector Index</div>
            </div>
            <div className="border-l-2 border-purple-400 pl-4 py-2">
              <div className="text-3xl font-extrabold text-white">
                <AnimatedMetric value={248} />
              </div>
              <div className="text-xs text-gray-500 font-semibold tracking-wider uppercase mt-1">Indexed Docs</div>
            </div>
          </div>
        </section>

        {/* Section 2: Features Grid (Bento Layout) */}
        <section id="features">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Enterprise AI Architecture
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm md:text-base">
              CortexAI combines high-performance embeddings pipelines with elastic orchestrations to deliver production-grade generative agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="md:col-span-2 flex flex-col justify-between gap-6" glowColor="rgba(45, 212, 191, 0.15)">
              <div>
                <div className="h-10 w-10 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mb-4">
                  <Network className="h-5 w-5 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">High-Performance Neural Graph Retrieval</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                  Deploy stateless index networks processing embeddings at massive scale. Our optimized TF-IDF matching represents the cutting edge of low-latency corporate document matching pipelines.
                </p>
              </div>
              {/* Inline SVG Schematic Visual */}
              <div className="w-full bg-black/40 rounded-xl p-4 border border-white/5 border-dashed">
                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-3 tracking-wider uppercase">
                  <span>Retriever Pipelines</span>
                  <span className="text-teal-400">active</span>
                </div>
                <div className="flex gap-4 items-center justify-center py-4">
                  <div className="border border-white/10 rounded px-2.5 py-1.5 text-center text-xs bg-white/5">User Query</div>
                  <ChevronRight className="h-4 w-4 text-teal-400 animate-pulse" />
                  <div className="border border-teal-400/20 rounded px-2.5 py-1.5 text-center text-xs bg-teal-400/10 text-teal-300">FAISS Index</div>
                  <ChevronRight className="h-4 w-4 text-teal-400 animate-pulse" />
                  <div className="border border-purple-500/20 rounded px-2.5 py-1.5 text-center text-xs bg-purple-500/10 text-purple-300">LLM Synthesis</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col justify-between gap-6" glowColor="rgba(244, 63, 94, 0.15)">
              <div>
                <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                  <Cpu className="h-5 w-5 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Multi-Node Elastic Scaling</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Containerized orchestration running dynamically scalable ECS clusters with automatic metric tracing and sub-second health tickers.
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-500 font-medium">Throughput Core</span>
                  <span className="font-mono text-rose-400">{tokensPerSec.toFixed(1)} t/s</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (tokensPerSec/150)*100)}%` }} />
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Section 3: Semantic Search Simulator & 3D VectorSpace */}
        <section id="search" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/10 border border-teal-400/20 text-xs font-semibold text-teal-300 mb-4">
                <Search className="h-3 w-3" />
                COSINE SIMILARITY Retrospective
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
                Semantic Vector Space
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Type terms like **"compliance audits"** or **"scaling limits"** in the input below. Watch the coordinates shift as matches connect semantic distances in real-time.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Query corporate data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all text-white placeholder-gray-500"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-teal-400 hover:bg-teal-500 text-black font-bold text-sm transition-all"
              >
                Project
              </button>
            </form>

            {searchActive && (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  <span>Match Results</span>
                  <span className="text-teal-400 font-mono">Retrieved in {searchTime}ms</span>
                </div>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((match) => (
                      <div key={match.id} className="text-xs bg-white/[0.02] border border-white/5 rounded-lg p-2.5 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span className="text-teal-300 font-bold block mb-0.5">{match.document}</span>
                          <span className="text-gray-400 line-clamp-1">{match.text}</span>
                        </div>
                        <span className="font-mono text-purple-400 font-semibold">{(match.score * 100).toFixed(1)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 py-2">No matching vector projections found. Try compliance, scaling, or database queries.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 h-[450px] lg:h-[500px] border border-white/10 rounded-3xl bg-black/30 overflow-hidden relative shadow-2xl shadow-purple-500/5">
            <VectorSpace queryActive={searchActive} results={searchResults} />
          </div>
        </section>

        {/* Section 4: Chatbot RAG Interface & Monitoring Core */}
        <section id="demo" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          <div className="lg:col-span-7 border border-white/10 rounded-3xl bg-black/40 overflow-hidden flex flex-col h-[550px] shadow-2xl relative">
            <div className="bg-black/60 border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Corporate RAG Chatbot</h3>
                  <p className="text-2xs text-gray-500 font-semibold tracking-wider uppercase">LangChain Retrospective Pipeline</p>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white/[0.04] border border-white/10 text-gray-200 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-bl-none p-4 text-sm text-gray-400 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce delay-75" />
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce delay-150" />
                    Cognitive retriever synthesizing...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-4 bg-black/50 border-t border-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Ask about corporate compliance, scaling policies, or architecture..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all text-white"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm transition-all"
              >
                Send
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            <GlassCard className="flex-1 flex flex-col gap-6" glowColor="rgba(168, 85, 247, 0.2)">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white text-sm">System Diagnostics Thought logs</h3>
              </div>
              <div className="bg-black/50 font-mono text-2xs p-4 rounded-xl border border-white/5 min-h-36 flex-1 flex flex-col gap-2 overflow-y-auto">
                {systemThought.length > 0 ? (
                  systemThought.map((thought, i) => (
                    <div key={i} className="text-purple-300">
                      &gt; {thought}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">&gt; System idling. Query topics to display cognitive retrieval steps.</div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="flex-1 flex flex-col gap-6" glowColor="rgba(45, 212, 191, 0.2)">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-teal-400" />
                <h3 className="font-bold text-white text-sm">Retrospective Citations Map</h3>
              </div>
              <div className="flex flex-col gap-3 justify-center flex-1">
                {Object.keys(citations).length > 0 ? (
                  Object.entries(citations).map(([source, meta]: [string, any]) => (
                    <div key={source} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-300 font-semibold">{source}</span>
                        <span className="text-teal-400 font-mono">{meta.percentage}% score</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-400 h-full rounded-full" style={{ width: `${meta.percentage}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 py-6 text-center border border-dashed border-white/5 rounded-xl">No active citations matched to query.</div>
                )}
              </div>
            </GlassCard>
          </div>
        </section>

      </main>

      {/* Footer and dynamic blueprint schematic */}
      <footer className="border-t border-white/5 bg-black/40 py-16 px-6 relative z-10 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-300">C</span>
            <span className="font-semibold text-white tracking-wider">CortexAI SYSTEMS INC</span>
          </div>
          <div>© {new Date().getFullYear()} CortexAI. Enterprise Multi-Agent Systems Platform.</div>
          <div className="flex gap-6">
            <a href="#hero" className="hover:text-purple-400 transition-colors">Documentation</a>
            <a href="#features" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
