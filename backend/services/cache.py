# backend/services/cache.py

import redis
import json
import os

class CacheService:
    def __init__(self):
        self.available = False
        self.redis = None
        try:
            # Support Redis Cloud / Upstash / any provider via REDIS_URL
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                self.redis = redis.from_url(
                    redis_url,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                    decode_responses=True
                )
            else:
                self.redis = redis.Redis(
                    host=os.getenv("REDIS_HOST", "localhost"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    db=int(os.getenv("REDIS_DB", 0)),
                    socket_connect_timeout=1,
                    socket_timeout=1
                )
            self.redis.ping()
            self.available = True
            print("✅ Redis connected")
        except Exception as e:
            print(f"⚠️  Redis unavailable (continuing without cache): {e}")

    def get_common_errors(self, service_name):
        if not self.available:
            return []
        try:
            data = self.redis.get(f"service:{service_name}:common_errors")
            return json.loads(data) if data else []
        except Exception:
            return []

    def get_recent_commits(self, service_name):
        if not self.available:
            return []
        try:
            data = self.redis.get(f"service:{service_name}:recent_commits")
            return json.loads(data) if data else []
        except Exception:
            return []

    def set_common_errors(self, service_name, errors):
        if not self.available:
            return
        try:
            self.redis.set(f"service:{service_name}:common_errors", json.dumps(errors), ex=86400)
        except Exception:
            pass

    def set_recent_commits(self, service_name, commits):
        if not self.available:
            return
        try:
            self.redis.set(f"service:{service_name}:recent_commits", json.dumps(commits), ex=3600)
        except Exception:
            pass