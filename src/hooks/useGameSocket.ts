import { useEffect, useState } from 'react';
import { GameSocket } from '@/services/socket';
import { auth } from '@/services/api';

export function useGameSocket() {
  const [gameSocket, setGameSocket] = useState<GameSocket | null>(null);

  useEffect(() => {
    const user = auth.getUser();
    if (!user) return;

    // Create socket instance
    const socket = new GameSocket();
    
    // Set up connection event
    const handleConnect = () => {
      socket.authenticate(user.id, user.username);
      setGameSocket(socket);
    };

    socket.onConnect(handleConnect);

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return gameSocket;
} 