import { motion, useReducedMotion } from 'framer-motion'

interface ProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  color = 'var(--accent-cyan)',
  label,
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--cell-empty)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-tabular text-[20px] font-semibold text-primary leading-none">
          {clamped}%
        </span>
        {label && <span className="text-[9px] text-tertiary mt-1 uppercase tracking-wide">{label}</span>}
      </div>
    </div>
  )
}
