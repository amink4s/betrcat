/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState } from 'react';

export const MobileControls: React.FC = () => {
  const [isPressed, setIsPressed] = useState({
    left: false,
    right: false,
    jump: false,
  });

  const dispatchKeyEvent = (key: string, type: 'keydown' | 'keyup') => {
    const event = new KeyboardEvent(type, {
      key,
      code: key,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  const handleButtonDown = (direction: 'left' | 'right' | 'jump') => {
    setIsPressed(prev => ({ ...prev, [direction]: true }));

    if (direction === 'jump') {
      dispatchKeyEvent(' ', 'keydown');
      // Immediately trigger keyup for jump to allow multiple presses
      setTimeout(() => dispatchKeyEvent(' ', 'keyup'), 50);
    } else if (direction === 'left') {
      dispatchKeyEvent('ArrowLeft', 'keydown');
    } else if (direction === 'right') {
      dispatchKeyEvent('ArrowRight', 'keydown');
    }
  };

  const handleButtonUp = (direction: 'left' | 'right') => {
    setIsPressed(prev => ({ ...prev, [direction]: false }));

    if (direction === 'left') {
      dispatchKeyEvent('ArrowLeft', 'keyup');
    } else if (direction === 'right') {
      dispatchKeyEvent('ArrowRight', 'keyup');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-between items-end p-4 sm:p-6 pointer-events-none z-50 select-none touch-none">
      {/* Left and Right Buttons */}
      <div className="flex gap-2 sm:gap-4 pointer-events-auto">
        {/* Left Button */}
        <button
          onMouseDown={() => handleButtonDown('left')}
          onMouseUp={() => handleButtonUp('left')}
          onTouchStart={(e) => {
            e.preventDefault();
            handleButtonDown('left');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleButtonUp('left');
          }}
          className={`
            w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold text-lg sm:text-xl uppercase font-cyber
            transition-all active:scale-95 flex items-center justify-center
            border-2 shadow-lg
            ${isPressed.left
              ? 'bg-cyan-400 border-cyan-300 text-black shadow-[0_0_20px_cyan]'
              : 'bg-cyan-500/30 border-cyan-500 text-cyan-400 hover:bg-cyan-500/50'
            }
          `}
        >
          ◀
        </button>

        {/* Right Button */}
        <button
          onMouseDown={() => handleButtonDown('right')}
          onMouseUp={() => handleButtonUp('right')}
          onTouchStart={(e) => {
            e.preventDefault();
            handleButtonDown('right');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleButtonUp('right');
          }}
          className={`
            w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold text-lg sm:text-xl uppercase font-cyber
            transition-all active:scale-95 flex items-center justify-center
            border-2 shadow-lg
            ${isPressed.right
              ? 'bg-cyan-400 border-cyan-300 text-black shadow-[0_0_20px_cyan]'
              : 'bg-cyan-500/30 border-cyan-500 text-cyan-400 hover:bg-cyan-500/50'
            }
          `}
        >
          ▶
        </button>
      </div>

      {/* Jump Button */}
      <button
        onMouseDown={() => handleButtonDown('jump')}
        onTouchStart={(e) => {
          e.preventDefault();
          handleButtonDown('jump');
        }}
        className={`
          w-16 h-16 sm:w-20 sm:h-20 rounded-full font-bold text-xl sm:text-2xl uppercase font-cyber
          transition-all active:scale-95 flex items-center justify-center
          border-2 shadow-lg pointer-events-auto
          ${isPressed.jump
            ? 'bg-red-500 border-red-300 text-white shadow-[0_0_30px_#ff0033]'
            : 'bg-red-600/30 border-red-500 text-red-400 hover:bg-red-600/50'
          }
        `}
      >
        ▲
      </button>
    </div>
  );
};
