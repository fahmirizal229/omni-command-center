import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getAuthToken } from '../api';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [lastMessage, setLastMessage] = useState(null);
  const [lastTelemetry, setLastTelemetry] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const listenersRef = useRef(new Map());

  const addListener = useCallback((type, callback) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(callback);
    return () => {
      const set = listenersRef.current.get(type);
      if (set) {
        set.delete(callback);
        if (set.size === 0) listenersRef.current.delete(type);
      }
    };
  }, []);

  const sendMessage = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setWsStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = getAuthToken();
    const wsUrl = `${protocol}//${host}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }

        // Heartbeat ping every 20s
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);

          if (data.type === 'telemetry') {
            setLastTelemetry(data.system);
          }

          if (data.type && listenersRef.current.has(data.type)) {
            listenersRef.current.get(data.type).forEach((cb) => {
              try {
                cb(data);
              } catch (e) {
                console.error('Error in WS listener:', e);
              }
            });
          }

          // Wildcard '*' listeners
          if (listenersRef.current.has('*')) {
            listenersRef.current.get('*').forEach((cb) => {
              try {
                cb(data);
              } catch (e) {
                console.error('Error in WS wildcard listener:', e);
              }
            });
          }
        } catch (e) {
          // not JSON
        }
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        clearInterval(pingIntervalRef.current);
        clearTimeout(reconnectTimeoutRef.current);
        if (isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setWsStatus('disconnected');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsStatus('disconnected');
    }

    return () => {
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, connect]);

  return (
    <WebSocketContext.Provider value={{ wsStatus, lastMessage, lastTelemetry, sendMessage, addListener, reconnect: connect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return ctx;
}
