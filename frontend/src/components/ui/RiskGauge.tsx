import React from 'react';
import type { RiskLevel } from '../../types';
import { getRiskLevelDetails } from '../../utils/formatters';

export interface RiskGaugeProps {
  score: number; // 0 to 100
  riskLevel?: RiskLevel | string;
  size?: number; // width/height in px
  showText?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  riskLevel,
  size = 180,
  showText = true,
}) => {
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  const details = getRiskLevelDetails(riskLevel);

  // SVG Gauge calculations (semi-circle arc)
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + 10}
          viewBox={`0 0 ${size} ${size / 2 + 10}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#3b82f6" />
              <stop offset="65%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Score Arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {score.toFixed(0)}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${details.textColor}`}>
            {details.label}
          </span>
        </div>
      </div>

      {showText && (
        <div className="mt-2 text-center">
          <p className="text-xs text-slate-400">
            Confidence: <span className="font-semibold text-slate-200">{normalizedScore}%</span>
          </p>
        </div>
      )}
    </div>
  );
};
