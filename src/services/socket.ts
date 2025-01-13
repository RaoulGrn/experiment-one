import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MOVE_TIMEOUT_SECONDS = 30;

interface GameState {
  player1: string;
  player2: string;
  player1Choice?: 'rock' | 'paper' | 'scissors';
  player2Choice?: 'rock' | 'paper' | 'scissors';
  winner?: string;
  roundWinner?: string;
  player1Score: number;
  player2Score: number;
  currentRound: number;
  isFinished: boolean;
  isPlayer1: boolean;
  moveTimeLeft: number;
  currentTurn: 'player1' | 'player2';
}

interface QueueUpdate {
  position: number;
  total: number;
  estimatedTime: number;
}

export type GameEventCallback = {
  gameState: (state: GameState) => void;
  error: (error: string) => void;
  connect: () => void;
  disconnect: () => void;
};

export type GameEventMap = {
  [K in keyof GameEventCallback]: GameEventCallback[K];
};

export class GameSocket {
  private socket: Socket;
  private gameStateCallback?: (state: GameState) => void;
  private queueUpdateCallback?: (update: QueueUpdate) => void;
  private connectCallback?: () => void;
  private isAuthenticated: boolean = false;
  private userId?: string;
  private username?: string;
  private moveTimer?: NodeJS.Timeout;
  private lastGameState?: GameState;

  constructor() {
    console.log('Initializing socket connection to:', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected, socket id:', this.socket.id);
      this.connectCallback?.();
      
      // Re-authenticate if we have credentials
      if (this.userId && this.username) {
        this.authenticate(this.userId, this.username);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isAuthenticated = false;
      
      // Clear any existing timers
      if (this.moveTimer) {
        clearTimeout(this.moveTimer);
        this.moveTimer = undefined;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('game_state', (state: GameState) => {
      console.log('Received game state:', state);
      
      // Ensure we have the latest state
      this.lastGameState = {...state};
      
      // Notify UI immediately
      this.gameStateCallback?.(this.lastGameState);

      // Start move timer if it's our turn
      if (this.shouldStartMoveTimer(state)) {
        this.startMoveTimer(state);
      }
    });

    this.socket.on('timerUpdate', (timeLeft: number) => {
      console.log('Timer update received:', timeLeft);
      if (this.lastGameState && this.gameStateCallback) {
        // Create a new state object with updated timer
        const updatedState = {
          ...this.lastGameState,
          moveTimeLeft: timeLeft
        };
        // Update the stored state
        this.lastGameState = updatedState;
        // Notify the UI
        this.gameStateCallback(updatedState);
      }
    });

    this.socket.on('queueUpdate', (update: QueueUpdate) => {
      console.log('Queue update:', update);
      this.queueUpdateCallback?.(update);
    });

    this.socket.on('moveTimeout', () => {
      console.log('Move timeout received');
      if (this.moveTimer) {
        clearTimeout(this.moveTimer);
        this.moveTimer = undefined;
      }
    });
  }

  private shouldStartMoveTimer(state: GameState): boolean {
    const isMyTurn = state.isPlayer1 ? 
      !state.player1Choice : 
      !state.player2Choice;
    
    return !state.isFinished && isMyTurn;
  }

  private startMoveTimer(state: GameState) {
    console.log('Starting move timer for', MOVE_TIMEOUT_SECONDS, 'seconds');
    
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
    }

    this.moveTimer = setTimeout(() => {
      console.log('Move timer expired');
      // The server will handle the timeout and update scores
      this.socket.emit('moveTimeout', {
        isPlayer1: state.isPlayer1
      });
    }, MOVE_TIMEOUT_SECONDS * 1000);
  }

  onConnect(callback: () => void) {
    this.connectCallback = callback;
    if (this.socket.connected) {
      callback();
    }
  }

  onGameState(callback: (state: GameState) => void) {
    this.gameStateCallback = callback;
  }

  onQueueUpdate(callback: (update: QueueUpdate) => void) {
    this.queueUpdateCallback = callback;
  }

  authenticate(userId: string, username: string) {
    this.userId = userId;
    this.username = username;

    if (!this.socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      this.socket.connect();
      return;
    }

    console.log('Authenticating socket with user:', { userId, username });
    this.socket.emit('authenticate', { id: userId, username }, (response: { status: string; message?: string }) => {
      console.log('Authentication response:', response);
      if (response?.status === 'authenticated') {
        console.log('Socket authenticated successfully');
        this.isAuthenticated = true;
        this.findGame();
      } else {
        console.error('Socket authentication failed:', response?.message || 'Unknown error');
        this.isAuthenticated = false;
      }
    });
  }

  findGame() {
    if (!this.socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      this.socket.connect();
      return;
    }

    if (!this.isAuthenticated) {
      console.log('Socket not authenticated, attempting to authenticate...');
      if (this.userId && this.username) {
        this.authenticate(this.userId, this.username);
      }
      return;
    }

    console.log('Finding game...');
    this.socket.emit('findGame');
  }

  makeChoice(gameId: string, choice: 'rock' | 'paper' | 'scissors') {
    if (!this.socket.connected || !this.isAuthenticated) {
      console.log('Cannot make choice: socket not connected or not authenticated');
      return;
    }

    console.log('Making choice:', { gameId, choice });
    this.socket.emit('make_choice', { gameId, choice });
  }

  sendChatMessage(gameId: string, message: string) {
    if (!this.socket.connected || !this.isAuthenticated) {
      console.log('Cannot send message: socket not connected or not authenticated');
      return;
    }

    console.log('Sending chat message:', { gameId, message });
    this.socket.emit('chat_message', { gameId, message }, (response: any) => {
      if (response.error) {
        console.error('Error sending message:', response.error);
      } else {
        console.log('Message sent successfully:', response);
      }
    });
  }

  leaveQueue() {
    if (!this.socket.connected || !this.isAuthenticated) {
      console.log('Cannot leave queue: socket not connected or not authenticated');
      return;
    }

    console.log('Leaving queue...');
    this.socket.emit('leaveQueue');
  }

  disconnect() {
    console.log('Disconnecting socket...');
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
      this.moveTimer = undefined;
    }
    this.socket.disconnect();
    this.isAuthenticated = false;
    this.userId = undefined;
    this.username = undefined;
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (event === 'gameState') {
      this.gameStateCallback = callback as (state: GameState) => void;
    } else {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (event === 'gameState') {
      this.gameStateCallback = undefined;
    } else {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}

export default GameSocket;