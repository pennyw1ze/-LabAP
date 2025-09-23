import redis
import json
from flask import current_app
from datetime import datetime, timedelta

class AnalyticsService:
    def __init__(self):
        self.redis_client = None

    def get_redis_client(self):
        """Get Redis client connection"""
        if not self.redis_client:
            self.redis_client = redis.from_url(current_app.config['REDIS_URL'])
        return self.redis_client

    def cache_data(self, key, data, expiration=3600):
        """Cache data in Redis"""
        try:
            client = self.get_redis_client()
            client.setex(key, expiration, json.dumps(data))
        except Exception as e:
            current_app.logger.error(f"Failed to cache data: {str(e)}")

    def get_cached_data(self, key):
        """Get cached data from Redis"""
        try:
            client = self.get_redis_client()
            cached = client.get(key)
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            current_app.logger.error(f"Failed to get cached data: {str(e)}")
            return None

    def increment_counter(self, key, amount=1):
        """Increment a counter in Redis"""
        try:
            client = self.get_redis_client()
            return client.incr(key, amount)
        except Exception as e:
            current_app.logger.error(f"Failed to increment counter: {str(e)}")
            return None

    def get_counter(self, key):
        """Get counter value from Redis"""
        try:
            client = self.get_redis_client()
            value = client.get(key)
            return int(value) if value else 0
        except Exception as e:
            current_app.logger.error(f"Failed to get counter: {str(e)}")
            return 0

    def store_time_series_data(self, key, timestamp, value):
        """Store time series data in Redis"""
        try:
            client = self.get_redis_client()
            # Use Redis sorted sets for time series data
            client.zadd(key, {timestamp: value})
            # Keep only last 30 days of data
            cutoff = (datetime.now() - timedelta(days=30)).timestamp()
            client.zremrangebyscore(key, 0, cutoff)
        except Exception as e:
            current_app.logger.error(f"Failed to store time series data: {str(e)}")

    def get_time_series_data(self, key, start_time=None, end_time=None):
        """Get time series data from Redis"""
        try:
            client = self.get_redis_client()
            if start_time and end_time:
                return client.zrangebyscore(key, start_time, end_time, withscores=True)
            else:
                return client.zrange(key, 0, -1, withscores=True)
        except Exception as e:
            current_app.logger.error(f"Failed to get time series data: {str(e)}")
            return []

# Global instance
analytics_service = AnalyticsService()