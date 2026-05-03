# backend/services/embedding.py

import requests
from os import getenv
import chromadb

class EmbeddingService:
    def __init__(self, chroma_path="./data/chroma_index"):
        self.api_key = getenv("GOOGLE_API_KEY")
        try:
            self.client = chromadb.PersistentClient(path=chroma_path)
            print("✅ ChromaDB connected")
        except Exception as e:
            self.client = None
            print(f"⚠️  ChromaDB unavailable: {e}")

    def embed_text(self, text):
        """Embed using Gemini text-embedding-004 via REST API"""
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models"
            f"/text-embedding-004:embedContent?key={self.api_key}"
        )
        payload = {
            "model": "models/text-embedding-004",
            "content": {"parts": [{"text": text}]},
            "taskType": "RETRIEVAL_DOCUMENT"
        }
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            return response.json()["embedding"]["values"]
        except Exception as e:
            print(f"⚠️  Embedding failed (returning None): {e}")
            return None

    def search(self, query_embedding, collection_name, top_k=5):
        """Search a collection — returns empty result if unavailable"""
        if self.client is None or query_embedding is None:
            return {"documents": [], "metadatas": [], "ids": []}
        try:
            collection = self.client.get_collection(collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            return results
        except Exception as e:
            print(f"⚠️  ChromaDB search failed for '{collection_name}': {e}")
            return {"documents": [], "metadatas": [], "ids": []}

    def create_collections(self):
        """Initialize Chroma collections"""
        if self.client is None:
            return
        collections = ["code_files", "incidents", "commits"]
        for coll in collections:
            try:
                self.client.create_collection(name=coll)
            except Exception:
                pass

    def index_code_files(self, file_list):
        """Index all code files"""
        if self.client is None:
            return
        try:
            collection = self.client.get_collection("code_files")
        except Exception:
            return
        for file_path in file_list:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()[:2000]
                embedding = self.embed_text(content)
                if embedding is None:
                    continue
                collection.add(
                    ids=[str(file_path)],
                    embeddings=[embedding],
                    metadatas=[{"file": str(file_path)}],
                    documents=[content]
                )
            except Exception as e:
                print(f"Error indexing {file_path}: {e}")

    def index_incidents(self, incidents_json):
        """Index incidents"""
        if self.client is None:
            return
        try:
            collection = self.client.get_collection("incidents")
        except Exception:
            return
        for incident in incidents_json:
            try:
                text = f"{incident['title']} {incident['error_message']} {incident['root_cause']}"
                embedding = self.embed_text(text)
                if embedding is None:
                    continue
                collection.add(
                    ids=[incident['id']],
                    embeddings=[embedding],
                    metadatas=[{"title": incident['title'], "service": incident['service']}],
                    documents=[text]
                )
            except Exception as e:
                print(f"Error indexing incident: {e}")