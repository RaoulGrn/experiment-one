import React from 'react';

interface MoveTimerProps {
  timeLeft: number;
  maxTime: number;
  isMyTurn: boolean;
}

const MoveTimer: React.FC<MoveTimerProps> = ({ timeLeft, maxTime, isMyTurn }) => {
  // Calculate percentage for progress bar
  const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  
  // Determine color based on time left
  const getColor = () => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-800 bg-opacity-50 rounded-lg">
      {isMyTurn ? (
        <>
          <div className="text-center mb-2">
            <span className="text-2xl font-bold text-white">
              {Math.ceil(timeLeft)} seconds to choose
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${getColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-center mt-2">
            <p className="text-lg text-purple-300 font-semibold">
              Make your choice!
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-2">
          <p className="text-lg text-gray-300">
            Waiting for round to end...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mt-4"></div>
        </div>
      )}
    </div>
  );
};

export default MoveTimer; 