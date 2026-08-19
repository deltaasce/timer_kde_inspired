import React from 'react';

interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  isPaused?: boolean;
  isCompleted?: boolean;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 320,
  strokeWidth = 8,
  isPaused = false,
  isCompleted = false,
  children,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;
  // Progress stroke dashoffset: 1 means full ring, 0 means empty ring
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 origin-center select-none"
        aria-hidden="true"
      >
        {/* Subtle glow filter */}
        <defs>
          <filter id="orange-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-800/80 transition-colors"
        />

        {/* Active Progress Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isCompleted ? '#10B981' : isPaused ? '#EAB308' : '#F97316'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
          filter={progress > 0.01 && !isCompleted ? 'url(#orange-glow)' : undefined}
        />
      </svg>

      {/* Centered Content (Large Digital Display) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
        {children}
      </div>
    </div>
  );
};
