'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

const SocketDebugger = () => {
  const { socket, isConnected, connectionState, forceReconnect } = useSocket();
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebugger, setShowDebugger] = useState(false);
  const [socketDetails, setSocketDetails] = useState<any>({});

  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    // Log connection state changes
    addLog(`Connection state changed to: ${connectionState}`);

    // Get socket details when connected
    if (socket && isConnected) {
      setSocketDetails({
        id: socket.id,
        connected: socket.connected,
        disconnected: socket.disconnected,
        engine: {
          transport: socket.io?.engine?.transport?.name,
          protocol: socket.io?.opts?.protocols?.[0],
        },
      });

      addLog(`Socket connected with ID: ${socket.id}`);

      // Try ping the server to check connectivity
      socket.emit('ping', { timestamp: Date.now() }, response => {
        if (response) {
          addLog(`Server responded to ping: ${JSON.stringify(response)}`);
        } else {
          addLog('Server did not respond to ping');
        }
      });
    }

    // Setup additional debugging listeners
    if (socket) {
      const onError = (error: any) => {
        addLog(`Socket error: ${error}`);
      };

      const onConnectError = (error: any) => {
        addLog(`Connect error: ${error.message}`);

        // Add detailed transport debug info
        if (socket.io?.engine) {
          const transport = socket.io.engine.transport;
          addLog(`Current transport: ${transport?.name}`);
        }
      };

      socket.on('error', onError);
      socket.on('connect_error', onConnectError);

      return () => {
        socket.off('error', onError);
        socket.off('connect_error', onConnectError);
      };
    }
  }, [socket, isConnected, connectionState]);

  // Add key shortcut to toggle debugger (Ctrl+Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'd') {
        setShowDebugger(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showDebugger) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-2 rounded-full shadow-lg cursor-pointer text-xs"
        onClick={() => setShowDebugger(true)}
        title="Socket Debug (Ctrl+Alt+D)"
      >
        <span
          className={`inline-block w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
        ></span>
        S
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-96 h-80 bg-gray-900 text-white p-4 rounded-tl-lg shadow-lg overflow-hidden flex flex-col border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">Socket Debugger</h3>
        <div className="flex gap-2">
          <button
            onClick={forceReconnect}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
          >
            Reconnect
          </button>
          <button
            onClick={() => setShowDebugger(false)}
            className="px-2 py-1 bg-gray-700 text-white text-xs rounded"
          >
            Minimize
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
        <div className="bg-gray-800 p-2 rounded">
          <p>
            <span className="text-gray-400">Status:</span>{' '}
            {isConnected ? 'Connected' : 'Disconnected'}
          </p>
          <p>
            <span className="text-gray-400">State:</span> {connectionState}
          </p>
          <p>
            <span className="text-gray-400">Socket ID:</span>{' '}
            {socketDetails.id || 'None'}
          </p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p>
            <span className="text-gray-400">Transport:</span>{' '}
            {socketDetails.engine?.transport || 'Unknown'}
          </p>
          <p>
            <span className="text-gray-400">Protocol:</span>{' '}
            {socketDetails.engine?.protocol || 'Unknown'}
          </p>
          <p>
            <span className="text-gray-400">URL:</span>{' '}
            {process.env.NODE_ENV === 'development'
              ? `http://${window.location.hostname}:3001`
              : process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto text-xs bg-gray-800 p-2 rounded">
        {logs.map((log, i) => (
          <div key={i} className="py-1 border-b border-gray-700">
            {log}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500 italic">No logs yet</div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Press Ctrl+Alt+D to toggle this debugger
      </div>
    </div>
  );
};

export default SocketDebugger;
