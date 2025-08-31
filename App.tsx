
import React from 'react';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <main className="bg-black text-white flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 select-none">
      <div className="w-full max-w-4xl border-4 border-gray-700 bg-gray-900 p-2 sm:p-4 shadow-lg shadow-red-500/30">
        <div className="border-2 border-gray-800 p-2">
          <h1 className="text-2xl sm:text-4xl text-red-500 font-bold text-center tracking-widest mb-4">
            REACT DOOM
          </h1>
          <div className="bg-black aspect-[4/3] w-full relative">
            <GameCanvas />
          </div>
          <div className="mt-4 text-center text-gray-400 text-xs sm:text-sm">
            <p className="mb-1">
              <span className="font-bold text-white">W/S</span>: MOVE | <span className="font-bold text-white">A/D</span>: TURN | <span className="font-bold text-white">SPACE</span>: FIRE
            </p>
            <p>A simple raycasting engine demo built with React & Tailwind.</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;