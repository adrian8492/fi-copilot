import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}

export function SparklineChart({ data, color, height = 40, width = 200 }: SparklineChartProps) {
  const gradientId = useMemo(() => `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  const pathData = useMemo(() => {
    if (data.length === 0) return '';
    if (data.length === 1) return `M 0,${height / 2} L ${width},${height / 2}`;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - min) / range) * height,
    }));

    if (range === 0) {
      return `M 0,${height / 2} L ${width},${height / 2}`;
    }

    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) / 3;
      const cp2y = curr.y;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }

    return path;
  }, [data, height, width]);

  const areaPath = useMemo(() => {
    if (!pathData || data.length === 0) return '';
    return `${pathData} L ${width},${height} L 0,${height} Z`;
  }, [pathData, width, height, data.length]);

  const lastPoint = useMemo(() => {
    if (data.length === 0) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const lastValue = data[data.length - 1];
    
    return {
      x: width,
      y: range === 0 ? height / 2 : height - ((lastValue - min) / range) * height,
    };
  }, [data, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {areaPath && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className="transition-all duration-300"
        />
      )}
      {pathData && (
        <path
          d={pathData}
          stroke={color}
          strokeWidth={2}
          fill="none"
          className="transition-all duration-300"
        />
      )}
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={3}
          fill={color}
          className="transition-all duration-300"
        />
      )}
    </svg>
  );
}

export default SparklineChart;
