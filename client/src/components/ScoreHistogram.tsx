import React from 'react';
import { Card } from '@/components/ui/card';

interface ScoreHistogramProps {
  data: Array<{ range: string; count: number }>;
  title?: string;
}

const ScoreHistogram: React.FC<ScoreHistogramProps> = ({ data, title = "Score Distribution" }) => {
  const maxCount = Math.max(...data.map(item => item.count));

  const getBarColor = (range: string): string => {
    const rangeStart = parseInt(range.split('-')[0]);
    if (rangeStart <= 40) return 'bg-red-500';
    if (rangeStart <= 60) return 'bg-orange-500';
    if (rangeStart <= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-sm text-muted-foreground font-medium">
              {item.range}
            </div>
            <div className="flex-1 relative">
              <div className="h-6 bg-muted rounded overflow-hidden">
                <div
                  className={`h-full ${getBarColor(item.range)} transition-all duration-500 ease-out`}
                  style={{
                    width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
            <div className="w-8 text-sm text-muted-foreground font-medium text-right">
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ScoreHistogram;
