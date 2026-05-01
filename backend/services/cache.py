# In backend/services/cache.py

import redis
import json
import os

class CacheService:
    def __init__(self):
        self.redis = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0))
        )
    
    def set_common_errors(self, service_name, errors):
        """Cache top 10 errors for a service"""
        self.redis.set(
            f"service:{service_name}:common_errors",
            json.dumps(errors),
            ex=86400  # 24h expiry
        )
    
    def get_common_errors(self, service_name):
        """Retrieve cached errors"""
        data = self.redis.get(f"service:{service_name}:common_errors")
        return json.loads(data) if data else None
    
    def set_recent_commits(self, service_name, commits):
        """Cache recent commits"""
        self.redis.set(
            f"service:{service_name}:recent_commits",
            json.dumps(commits),
            ex=3600  # 1h expiry
        )
    
    def get_recent_commits(self, service_name):
        """Retrieve cached commits"""
        data = self.redis.get(f"service:{service_name}:recent_commits")
        return json.loads(data) if data else None

# Usage:
# cache = CacheService()
# cache.set_common_errors("payment-api", [{"error": "timeout", "count": 5}])