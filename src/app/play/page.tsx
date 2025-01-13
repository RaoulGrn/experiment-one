'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';
import { auth } from '@/services/api';
import { useGameSocket } from '@/hooks/useGameSocket';
import MoveTimer from '@/components/MoveTimer';
import ChatBox from '@/components/ChatBox';

const MOVE_TIMEOUT_SECONDS = 30;

type Choice = 'rock' | 'paper' | 'scissors';

interface GameState {
  id: string;
  player1: string;
  player2: string;
  player1Username: string;
  player2Username: string;
  player1AvatarUrl?: string;
  player2AvatarUrl?: string;
  player1Choice?: Choice;
  player2Choice?: Choice;
  player1Score: number;
  player2Score: number;
  round: number;
  status: 'waiting' | 'playing' | 'finished';
  isFinished: boolean;
  roundWinner?: string;
  moveTimeLeft: number;
  chatMessages: ChatMessage[];
  lastMoveTime?: Date;
  winner?: string;
}

interface ChatMessage {
  playerId: string;
  message: string;
  timestamp: Date;
}

export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gameSocket = useGameSocket();
  const user = auth.getUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!gameSocket) {
      return; // Wait for socket to be initialized
    }

    const handleGameState = (newGameState: GameState) => {
      setGameState(newGameState);
    };

    const handleError = (error: string) => {
      setError(error);
    };

    gameSocket.on('gameState', handleGameState);
    gameSocket.on('error', handleError);

    return () => {
      gameSocket.off('gameState', handleGameState);
      gameSocket.off('error', handleError);
    };
  }, [gameSocket, router, user]);

  const isPlayer1 = gameState ? gameState.player1 === user?.id : false;
  const isMyTurn = gameState ? (
    isPlayer1 ? !gameState.player1Choice : !gameState.player2Choice
  ) : false;
  const hasPlayerMadeChoice = isPlayer1 ? !!gameState?.player1Choice : !!gameState?.player2Choice;

  const handleChoice = (choice: Choice) => {
    if (!gameState || !isMyTurn || !gameSocket) return;
    
    console.log('Making choice:', { gameId: gameState.id, choice });
    gameSocket.makeChoice(gameState.id, choice);
  };

  const getChoiceButtonClass = (choice: Choice) => {
    const baseClass = 'transition-colors duration-200';
    if (!isMyTurn || hasPlayerMadeChoice) {
      return `${baseClass} bg-gray-700 text-gray-400 cursor-not-allowed`;
    }
    return `${baseClass} bg-purple-600 hover:bg-purple-700 text-white`;
  };

  const getChoiceEmoji = (choice?: Choice) => {
    switch(choice) {
      case 'rock': return '🪨';
      case 'paper': return '📄';
      case 'scissors': return '✂️';
      default: return '';
    }
  };

  const getRoundStatusDisplay = () => {
    if (!gameState) return null;

    const myChoice = isPlayer1 ? gameState.player1Choice : gameState.player2Choice;
    const opponentChoice = isPlayer1 ? gameState.player2Choice : gameState.player1Choice;
    const opponentName = isPlayer1 ? gameState.player2Username : gameState.player1Username;

    if (gameState.isFinished) {
      if (gameState.winner === user?.id) {
        return <p className="text-green-500 text-xl">You won the game! 🎉</p>;
      } else if (gameState.winner) {
        return <p className="text-red-500 text-xl">You lost the game!</p>;
      }
      return <p className="text-yellow-500 text-xl">It&apos;s a tie!</p>;
    }

    if (gameState.roundWinner === undefined && myChoice && opponentChoice) {
      return (
        <div className="text-center animate-bounce">
          <p className="text-yellow-500 text-xl mb-2">It&apos;s a tie! 🤝</p>
          <div className="flex items-center justify-center gap-4 text-2xl">
            <span>You chose {getChoiceEmoji(myChoice)}</span>
            <span className="text-gray-400">vs</span>
            <span>{opponentName} chose {getChoiceEmoji(opponentChoice)}</span>
          </div>
        </div>
      );
    }

    if (gameState.roundWinner) {
      const didIWin = gameState.roundWinner === user?.id;
      return (
        <div className="text-center">
          <p className={`text-xl mb-2 ${didIWin ? 'text-green-500' : 'text-red-500'}`}>
            {didIWin ? 'You won this round! 🎉' : `${opponentName} won this round!`}
          </p>
          {myChoice && opponentChoice && (
            <div className="flex items-center justify-center gap-4 text-2xl">
              <span>You chose {getChoiceEmoji(myChoice)}</span>
              <span className="text-gray-400">vs</span>
              <span>{opponentName} chose {getChoiceEmoji(opponentChoice)}</span>
            </div>
          )}
        </div>
      );
    }

    if (hasPlayerMadeChoice) {
      return (
        <div className="text-center">
          <p className="text-xl mb-2">Waiting for {opponentName}...</p>
          <p className="text-lg">You chose {getChoiceEmoji(myChoice)}</p>
        </div>
      );
    }

    return <p className="text-xl">Make your choice!</p>;
  };

  const PlayerInfo = ({ isPlayer1, gameState }: { isPlayer1: boolean; gameState: GameState }) => {
    const avatarUrl = isPlayer1 ? gameState.player1AvatarUrl : gameState.player2AvatarUrl;
    const username = isPlayer1 ? gameState.player1Username : gameState.player2Username;
    const score = isPlayer1 ? gameState.player1Score : gameState.player2Score;

    return (
      <div className="text-center">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 relative mx-auto mb-2">
          {avatarUrl ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`}
              alt={`${username}&apos;s avatar`}
              layout="fill"
              objectFit="cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <FaUser size={32} />
            </div>
          )}
        </div>
        <div className="font-bold text-xl mb-1">{username}</div>
        <div className="text-3xl font-bold text-purple-400">{score}</div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8 text-purple-500">Error</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!gameSocket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8 text-purple-500">Connecting to Game Server</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8 text-purple-500">Waiting for Game to Start</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Score and Round Info */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-500 mb-4">Round {gameState.round}</h1>
          <div className="flex justify-between items-center bg-gray-800 bg-opacity-50 rounded-lg p-6">
            <PlayerInfo isPlayer1={true} gameState={gameState} />
            <div className="text-2xl font-bold">VS</div>
            <PlayerInfo isPlayer1={false} gameState={gameState} />
          </div>
        </div>

        {/* Timer Section */}
        {!gameState.isFinished && gameState.moveTimeLeft > 0 && (
          <div className="mb-8">
            <MoveTimer
              timeLeft={gameState.moveTimeLeft}
              maxTime={MOVE_TIMEOUT_SECONDS}
              isMyTurn={isMyTurn}
            />
          </div>
        )}

        {/* Game Area */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-8 mb-8">
          {gameState.isFinished ? (
            <div className="text-center">
              {getRoundStatusDisplay()}
              <button
                onClick={() => router.push('/')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors mt-8"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <>
              {/* Choice Buttons */}
              {isMyTurn && !hasPlayerMadeChoice && (
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <button
                    onClick={() => handleChoice('rock')}
                    className={`${getChoiceButtonClass('rock')} py-8 rounded-lg text-4xl`}
                    disabled={!isMyTurn || hasPlayerMadeChoice}
                  >
                    🪨
                  </button>
                  <button
                    onClick={() => handleChoice('paper')}
                    className={`${getChoiceButtonClass('paper')} py-8 rounded-lg text-4xl`}
                    disabled={!isMyTurn || hasPlayerMadeChoice}
                  >
                    📄
                  </button>
                  <button
                    onClick={() => handleChoice('scissors')}
                    className={`${getChoiceButtonClass('scissors')} py-8 rounded-lg text-4xl`}
                    disabled={!isMyTurn || hasPlayerMadeChoice}
                  >
                    ✂️
                  </button>
                </div>
              )}

              {/* Game Status */}
              <div className="text-center">
                {getRoundStatusDisplay()}
              </div>
            </>
          )}
        </div>

        {/* Chat Box */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-purple-500 mb-4">Game Chat</h2>
          <ChatBox
            gameSocket={gameSocket}
            gameId={gameState.id}
            messages={gameState.chatMessages}
            isPlayer1={isPlayer1}
            player1Username={gameState.player1Username}
            player2Username={gameState.player2Username}
          />
        </div>
      </div>
    </div>
  );
} 