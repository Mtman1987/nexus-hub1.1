'use client';

import { useContext, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AppContext } from '@/contexts/app-context';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { getWeekDateRange } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

export function ProgressChart() {
  const { goals, entries, isReady } = useContext(AppContext);

  const chartData = useMemo(() => {
    if (!isReady) return [];

    const { start, end } = getWeekDateRange(new Date());
    const weekDates = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });

    const data = weekDates.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayData: { name: string; [key: string]: string | number } = {
        name: format(date, 'EEE'),
      };

      goals.forEach(goal => {
        const entry = entries.find(e => e.goalId === goal.id && e.date === formattedDate);
        dayData[goal.name] = entry ? entry.content.split(/\s+/).filter(Boolean).length : 0;
      });

      return dayData;
    });

    return data;
  }, [goals, entries, isReady]);

  const goalColors: { [key: string]: string } = useMemo(() => {
    const colors = ['#673AB7', '#009688', '#FFC107', '#E91E63', '#2196F3'];
    return goals.reduce((acc, goal, index) => {
      acc[goal.name] = colors[index % colors.length];
      return acc;
    }, {} as { [key: string]: string });
  }, [goals]);
  
  if (!isReady) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Word Count', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {goals.map(goal => (
          <Bar key={goal.id} dataKey={goal.name} fill={goalColors[goal.name]} stackId="a" radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
