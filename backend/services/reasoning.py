# backend/services/reasoning.py

import google.generativeai as genai
from os import getenv
import json

class ReasoningService:
    def __init__(self):
        genai.configure(api_key=getenv("GOOGLE_API_KEY"))
        self.model = genai.GenerativeModel("gemini-1.5-flash")
    
    def analyze_error(self, prompt):
        """Call Gemini to reason about error"""
        
        response = self.model.generate_content(prompt)
        response_text = response.text
        
        # Try to parse as JSON
        try:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            json_str = response_text[start:end]
            return json.loads(json_str)
        except:
            return {"raw_response": response_text}