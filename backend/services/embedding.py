# backend/services/embedding.py

import google.generativeai as genai
from os import getenv

class EmbeddingService:
    def __init__(self, chroma_path="./data/chroma_index"):
        import chromadb
        genai.configure(api_key=getenv("GOOGLE_API_KEY"))
        self.client = chromadb.PersistentClient(path=chroma_path)
        self.genai = genai
    
    def embed_text(self, text):
        """Embed using Gemini (free)"""
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="RETRIEVAL_DOCUMENT"
        )
        return result['embedding']
    
    def create_collections(self):
        """Initialize Chroma collections"""
        collections = ["code_files", "incidents", "commits"]
        for coll in collections:
            try:
                self.client.create_collection(name=coll)
            except:
                pass
    
    def index_code_files(self, file_list):
        """Index all code files"""
        collection = self.client.get_collection("code_files")
        
        for file_path in file_list:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()[:2000]
                
                embedding = self.embed_text(content)
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
        collection = self.client.get_collection("incidents")
        
        for incident in incidents_json:
            text = f"{incident['title']} {incident['error_message']} {incident['root_cause']}"
            embedding = self.embed_text(text)
            collection.add(
                ids=[incident['id']],
                embeddings=[embedding],
                metadatas=[{"title": incident['title'], "service": incident['service']}],
                documents=[text]
            )
    
    def search(self, query_embedding, collection_name, top_k=5):
        """Search a collection"""
        collection = self.client.get_collection(collection_name)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        return results