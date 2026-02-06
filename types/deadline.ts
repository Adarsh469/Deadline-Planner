import { DeadlinePriority, DeadlineStatus } from "@prisma/client";

export type DeadlineInput = {
  title: string;
  description?: string | null;
  dueDate: string;
  priority: DeadlinePriority;
  category?: string | null;
  recurrenceId?: string | null;
  dependencyIds?: string[];
};

export type DeadlineUpdateInput = Partial<DeadlineInput> & {
  status?: DeadlineStatus;
  completedAt?: string | null;
};
