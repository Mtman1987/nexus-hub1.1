import type { IconName } from "@/components/icons";

export type Goal = {
  id: string;
  name: string;
  icon: IconName;
  createdAt: string;
};

export type JournalEntry = {
  id: string; // combination of goalId and date
  goalId: string;
  date: string; // YYYY-MM-DD
  content: string;
};
