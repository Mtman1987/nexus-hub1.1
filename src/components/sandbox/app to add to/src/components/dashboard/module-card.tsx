
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  status: 'Active' | 'Inactive' | 'Error';
  href?: string;
}

export function ModuleCard({ icon, title, status, href }: ModuleCardProps) {
  const statusClasses = {
    Active: 'bg-green-500',
    Inactive: 'bg-yellow-500',
    Error: 'bg-red-500',
  };

  const badgeVariant = {
    Active: 'default',
    Inactive: 'secondary',
    Error: 'destructive',
  } as const;

  const cardClasses = "flex flex-col hover:shadow-lg transition-shadow duration-300 h-full";
  
  const InnerContent = () => (
    <Card className={cn(cardClasses, { 'cursor-pointer': !!href })}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant={badgeVariant[status]}>{status}</Badge>
          <div className={cn("h-3 w-3 rounded-full", statusClasses[status])}></div>
        </div>
        <CardTitle className="text-xl font-bold flex items-center gap-3">
            {icon}
            {title}
        </CardTitle>
        <CardDescription className="pt-2">Manage {title} integration</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button variant="ghost" size="sm" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="flex h-full">
        <InnerContent />
      </Link>
    );
  }

  return <InnerContent />;
}
