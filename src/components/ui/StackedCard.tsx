import React, { memo } from 'react';
import { Card, CardContent } from './card';

interface StackedCardProps {
  children: React.ReactNode;
  count: number;
  className?: string;
  onClick?: () => void;
}

export const StackedCard = memo(function StackedCard({ 
  children, 
  count, 
  className = '',
  onClick
}: StackedCardProps) {
  return (
    <div 
      className={`relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Background stack effect */}
      {count > 1 && (
        <>
          <div
            className="absolute inset-0 bg-white border rounded-lg transform translate-x-1 translate-y-1 -z-10"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
          />
          {count > 2 && (
            <div
              className="absolute inset-0 bg-white border rounded-lg transform translate-x-2 translate-y-2 -z-20"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            />
          )}
        </>
      )}
      
      {/* Main card */}
      <Card className={`transition-shadow hover:shadow-lg ${className}`}>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
});