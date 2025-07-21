import {
  Briefcase,
  Heart,
  Dumbbell,
  BookOpen,
  Users,
  BrainCircuit,
  LucideIcon,
  Smile,
  Sprout,
  PiggyBank
} from 'lucide-react';

export const icons = {
  briefcase: Briefcase,
  heart: Heart,
  dumbbell: Dumbbell,
  bookOpen: BookOpen,
  users: Users,
  brainCircuit: BrainCircuit,
  smile: Smile,
  sprout: Sprout,
  piggyBank: PiggyBank
} as const;

export type IconName = keyof typeof icons;

export const iconList = Object.keys(icons) as IconName[];

export const getIcon = (name: IconName | undefined): LucideIcon => {
  if (!name || !icons[name]) {
    return Smile; // A friendly default
  }
  return icons[name];
};
