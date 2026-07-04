package com.library.infrastructure;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IdempotencyService {

    private final Map<String, Object> cache = new ConcurrentHashMap<>();

    public boolean has(String key) {
        if (key == null || key.isBlank())
            return false;
        return cache.containsKey(key);
    }

    public Object get(String key) {
        if (key == null)
            return null;
        return cache.get(key);
    }

    public void save(String key, Object response) {
        if (key == null || key.isBlank() || response == null)
            return;
        // In a real production system, this would have an expiration TTL
        cache.put(key, response);
    }
}
