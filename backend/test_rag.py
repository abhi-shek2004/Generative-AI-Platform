import sys
import os

# Set PYTHONPATH to current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_engine import query_rag_system

def test_queries():
    queries = [
        "What is Acme Corp's compliance policy?",
        "Explain Acme Corp's horizontal scaling mechanism",
        "How is security audit handled in Acme?"
    ]
    
    for query in queries:
        print("\n" + "="*50)
        print(f"QUERY: {query}")
        print("="*50)
        res = query_rag_system(query)
        print(f"ANSWER:\n{res['answer']}")
        print("\nREASONING STEPS:")
        for step in res["reasoning"]:
            print(f"- {step}")
        print(f"\nLATENCY: {res['metrics']['latency_ms']} ms")
        print(f"CITATIONS: {res['citation_metrics']}")

if __name__ == "__main__":
    test_queries()
