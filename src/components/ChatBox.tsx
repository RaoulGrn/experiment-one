'use client';

import { useState, useRef, useEffect } from 'react';
import { auth } from '@/services/api';
import { GameSocket } from '@/services/socket';
import EmojiPicker from 'emoji-picker-react';
import { FaRegSmile } from 'react-icons/fa';

interface ChatMessage {
  playerId: string;
  message: string;
  timestamp: Date;
}

interface ChatBoxProps {
  gameSocket: GameSocket;
  gameId: string;
  messages: ChatMessage[];
  isPlayer1: boolean;
  player1Username: string;
  player2Username: string;
}

export default function ChatBox({ 
  gameSocket, 
  gameId, 
  messages, 
  isPlayer1,
  player1Username,
  player2Username 
}: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const user = auth.getUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && 
          emojiButtonRef.current && 
          emojiPickerRef.current &&
          !emojiButtonRef.current.contains(event.target as Node) &&
          !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    gameSocket.sendChatMessage(gameId, message.trim());
    setMessage('');
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emoji: any) => {
    console.log("Emoji selected:", emoji);
    setMessage(prev => prev + emoji.emoji);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

 


  return (
    <div className="flex flex-col h-64">
      <div 
        className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2 custom-scrollbar"
      >
        {messages.map((msg, index) => {
          const isCurrentUser = msg.playerId === user?.id;
          const username = isCurrentUser ? 
            (isPlayer1 ? player1Username : player2Username) : 
            (isPlayer1 ? player2Username : player1Username);
          
          return (
            <div
              key={index}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-lg ${
                  isCurrentUser
                    ? 'bg-purple-600 text-white message-right'
                    : 'bg-gray-700 text-gray-200 message-left'
                }`}
              >
                <p className="text-xs font-semibold mb-1">{username}</p>
                <p className="text-sm break-words">{msg.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2 relative">
        <div className="flex-1 flex items-center gap-2 bg-gray-700 rounded-lg px-2">
          <button
            type="button"
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-400 hover:text-purple-500 transition-colors p-2"
          >
            <FaRegSmile size={20} />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-white py-2 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
        >
          Send
        </button>
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-full right-0 mb-2 z-50"
          >
            <div className="shadow-xl rounded-lg overflow-hidden">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
                theme="dark"
                searchPlaceHolder="Search emoji..."
                width={300}
                height={400}
                lazyLoadEmojis={true}
              />
            </div>
          </div>
        )}
      </form>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(107, 114, 128, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
          transition: all 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8);
        }

        .message-left {
          position: relative;
          border-top-left-radius: 0;
        }

        .message-right {
          position: relative;
          border-top-right-radius: 0;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 