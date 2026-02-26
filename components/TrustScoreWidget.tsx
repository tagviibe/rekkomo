"use client";

type TrustScoreWidgetProps = {
  score: number;
  maxScore?: number;
  breakdown?: Array<{
    label: string;
    points: number;
    maxPoints: number;
    completed: boolean;
  }>;
  showBreakdown?: boolean;
};

export default function TrustScoreWidget({
  score,
  maxScore = 200,
  breakdown = [],
  showBreakdown = true,
}: TrustScoreWidgetProps) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 27; // radius = 27
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 100) return 'var(--color-success)';
    if (score >= 50) return 'var(--color-accent)';
    return 'var(--color-primary)';
  };

  return (
    <div 
      className="rounded-[14px] p-4"
      style={{ background: 'var(--color-cloud)' }}
    >
      <div className="flex items-center gap-4">
        {/* Trust Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width="64" height="64" className="transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="var(--color-fog)"
              strokeWidth="5"
            />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke={getScoreColor()}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            <span 
              className="text-base font-extrabold"
              style={{ color: 'var(--color-ink)', letterSpacing: '-1px' }}
            >
              {score}
            </span>
            <span 
              className="text-[10px] font-semibold"
              style={{ color: 'var(--color-slate)' }}
            >
              / {maxScore}
            </span>
          </div>
        </div>

        {/* Trust Info */}
        <div className="flex-1">
          <div 
            className="text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--color-slate)' }}
          >
            Trust Score
          </div>
          <div 
            className="text-[22px] font-extrabold mb-0.5"
            style={{ color: 'var(--color-ink)', letterSpacing: '-1px' }}
          >
            {score} / {maxScore}
          </div>
          <div 
            className="text-[11px] font-semibold"
            style={{ color: 'var(--color-accent)' }}
          >
            {score >= 100 ? "Highly Trusted" : score >= 50 ? "Trusted" : "Building Trust"}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && breakdown.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white flex-shrink-0 ${
                  item.completed ? '' : ''
                }`}
                style={{
                  background: item.completed ? 'var(--color-success)' : 'var(--color-fog)',
                  color: item.completed ? 'white' : 'var(--color-slate)'
                }}
              >
                {item.completed ? '✓' : ''}
              </div>
              <span 
                className="flex-1"
                style={{ color: 'var(--color-slate)' }}
              >
                {item.label}
              </span>
              <span 
                className="font-bold"
                style={{ color: 'var(--color-ink)' }}
              >
                {item.points}/{item.maxPoints}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
