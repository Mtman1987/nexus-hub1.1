
import Image from 'next/image';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function CommunityLogo(props: ComponentProps<'div'>) {
  return (
    <div {...props}>
        <Image 
            src="/community-logo.png" 
            alt="Space Mountain Community Logo" 
            width={256} 
            height={128}
            className={cn("h-auto w-full", props.className)}
            priority
        />
    </div>
  );
}
