import React from 'react';

export const KPICardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-lg border p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-muted rounded w-24"></div>
        <div className="h-8 w-8 bg-muted rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-muted rounded w-20"></div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="animate-pulse border-b">
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-32"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-20"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-28"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-muted rounded w-16"></div>
      </td>
    </tr>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-lg border p-6 animate-pulse">
      <div className="mb-6">
        <div className="h-6 bg-muted rounded w-40 mb-2"></div>
        <div className="h-4 bg-muted rounded w-64"></div>
      </div>
      <div className="h-80 bg-muted rounded-lg mb-4"></div>
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-muted rounded-full"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-muted rounded-full"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-muted rounded-full"></div>
          <div className="h-4 bg-muted rounded w-18"></div>
        </div>
      </div>
    </div>
  );
};

export const TranscriptSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-lg border animate-pulse">
      <div className="p-4 border-b">
        <div className="h-6 bg-muted rounded w-48"></div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-12"></div>
            </div>
            <div className="space-y-2 ml-11">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-4/5"></div>
              {index % 3 === 0 && <div className="h-4 bg-muted rounded w-2/3"></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
