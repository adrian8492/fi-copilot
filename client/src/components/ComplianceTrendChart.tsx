import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendDataPoint {
  date: string;
  critical: number;
  warning: number;
  info: number;
}

interface ComplianceTrendChartProps {
  data: TrendDataPoint[] | undefined;
  isLoading: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface DateLabel {
  x: number;
  label: string;
}

interface ChartData {
  width: number;
  height: number;
  padding: number;
  criticalArea: string;
  warningArea: string;
  infoArea: string;
  dates: DateLabel[];
}

export function ComplianceTrendChart({ data: trendData, isLoading }: ComplianceTrendChartProps) {
  const chartData = useMemo((): ChartData | null => {
    if (!trendData?.length) return null;

    const width = 800;
    const height = 300;
    const padding = 40;

    const maxTotal = Math.max(...trendData.map((d: TrendDataPoint) => d.critical + d.warning + d.info));
    const xStep = (width - 2 * padding) / (trendData.length - 1);

    const criticalPoints = trendData.map((d: TrendDataPoint, i: number): Point => ({
      x: padding + i * xStep,
      y: height - padding - (d.critical / maxTotal) * (height - 2 * padding),
    }));

    const warningPoints = trendData.map((d: TrendDataPoint, i: number): Point => ({
      x: padding + i * xStep,
      y: height - padding - ((d.critical + d.warning) / maxTotal) * (height - 2 * padding),
    }));

    const infoPoints = trendData.map((d: TrendDataPoint, i: number): Point => ({
      x: padding + i * xStep,
      y: height - padding - ((d.critical + d.warning + d.info) / maxTotal) * (height - 2 * padding),
    }));

    const createPath = (points: Point[]): string => {
      return points.map((p: Point, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    };

    const createArea = (topPoints: Point[], bottomY: number): string => {
      const path = createPath(topPoints);
      const lastPoint = topPoints[topPoints.length - 1];
      const firstPoint = topPoints[0];
      return `${path} L ${lastPoint.x},${bottomY} L ${firstPoint.x},${bottomY} Z`;
    };

    return {
      width,
      height,
      padding,
      criticalArea: createArea(criticalPoints, height - padding),
      warningArea: createArea(warningPoints, criticalPoints[criticalPoints.length - 1]?.y || height - padding),
      infoArea: createArea(infoPoints, warningPoints[warningPoints.length - 1]?.y || height - padding),
      dates: trendData.map((d: TrendDataPoint, i: number): DateLabel => ({
        x: padding + i * xStep,
        label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })),
    };
  }, [trendData]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Compliance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Compliance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          Compliance Trend
          <div className="flex gap-4 text-sm font-normal">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              Critical
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              Warning
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              Info
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={chartData.width} height={chartData.height} className="overflow-visible">
          <defs>
            <linearGradient id="critical-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="warning-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#eab308" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="info-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          {/* Areas */}
          <path d={chartData.infoArea} fill="url(#info-gradient)" />
          <path d={chartData.warningArea} fill="url(#warning-gradient)" />
          <path d={chartData.criticalArea} fill="url(#critical-gradient)" />

          {/* X-axis labels */}
          {chartData.dates.map((date: DateLabel, i: number) => (
            <text
              key={i}
              x={date.x}
              y={chartData.height - 10}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {date.label}
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

export default ComplianceTrendChart;
