import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

export default function ScoreGauge({ score, size = "medium", showLabel = true }: ScoreGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "hsl(142, 76%, 36%)"; // Green
    if (score >= 60) return "hsl(45, 93%, 47%)"; // Yellow
    if (score >= 40) return "hsl(25, 95%, 53%)"; // Orange
    return "hsl(0, 84%, 60%)"; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Poor";
  };

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32",
  };

  const textSizeClasses = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-3xl",
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          
          {/* Score arc */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
            {score}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <p className="text-sm text-gray-600 mt-2">
          {getScoreLabel(score)}
        </p>
      )}
    </div>
  );
}
