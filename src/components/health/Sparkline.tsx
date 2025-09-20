import React, { useMemo } from 'react';

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  confidence?: number | null; // 0-1 adjusts opacity
  className?: string;
  title?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 80,
  height = 28,
  stroke = 'currentColor',
  strokeWidth = 1.5,
  confidence = 1,
  className,
  title,
}) => {
  const path = useMemo(() => {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = width / Math.max(1, values.length - 1);
    return values
      .map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / span) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [values, width, height]);

  const areaPath = useMemo(() => {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = width / Math.max(1, values.length - 1);
    const points = values.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return `M0,${height} ${points.map((p) => 'L' + p).join(' ')} L${width},${height} Z`;
  }, [values, width, height]);

  const opacity = confidence == null ? 0.85 : 0.35 + confidence * 0.65; // keep readable

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title || 'sparkline'}
    >
      {title && <title>{title}</title>}
      <path
        d={areaPath}
        fill={stroke}
        fillOpacity={opacity * 0.15}
        stroke="none"
      />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    </svg>
  );
};

export default Sparkline;
