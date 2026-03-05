import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}) => {
  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePresetClick = (preset: string) => {
    const today = new Date();
    const currentDate = new Date(today);
    let fromDateValue: Date;
    let toDateValue = currentDate;

    switch (preset) {
      case 'last7':
        fromDateValue = new Date(currentDate.setDate(currentDate.getDate() - 7));
        break;
      case 'last30':
        fromDateValue = new Date(currentDate.setDate(currentDate.getDate() - 30));
        break;
      case 'last90':
        fromDateValue = new Date(currentDate.setDate(currentDate.getDate() - 90));
        break;
      case 'thisMonth':
        fromDateValue = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        fromDateValue = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      default:
        return;
    }

    onFromDateChange(getDateString(fromDateValue));
    onToDateChange(getDateString(toDateValue));
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg text-foreground">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Date Range:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">From:</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">To:</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div className="flex items-center gap-1 border-l border-border pl-4">
        <button
          onClick={() => handlePresetClick('last7')}
          className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
        >
          Last 7 days
        </button>
        <button
          onClick={() => handlePresetClick('last30')}
          className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
        >
          Last 30 days
        </button>
        <button
          onClick={() => handlePresetClick('last90')}
          className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
        >
          Last 90 days
        </button>
        <button
          onClick={() => handlePresetClick('thisMonth')}
          className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
        >
          This Month
        </button>
        <button
          onClick={() => handlePresetClick('thisQuarter')}
          className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
        >
          This Quarter
        </button>
      </div>
    </div>
  );
};

export default DateRangeFilter;
