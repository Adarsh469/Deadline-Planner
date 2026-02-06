import { create } from "zustand";
import { Deadline, DeadlinePriority, DeadlineStatus } from "@prisma/client";

export type DeadlineFilters = {
  status?: DeadlineStatus;
  priority?: DeadlinePriority;
  category?: string;
};

type DeadlineState = {
  deadlines: Deadline[];
  filters: DeadlineFilters;
  setDeadlines: (deadlines: Deadline[]) => void;
  upsertDeadline: (deadline: Deadline) => void;
  removeDeadline: (id: string) => void;
  setFilters: (filters: DeadlineFilters) => void;
};

export const useDeadlineStore = create<DeadlineState>((set) => ({
  deadlines: [],
  filters: {},
  setDeadlines: (deadlines) => set({ deadlines }),
  upsertDeadline: (deadline) =>
    set((state) => {
      const exists = state.deadlines.find((item) => item.id === deadline.id);
      if (exists) {
        return {
          deadlines: state.deadlines.map((item) => (item.id === deadline.id ? deadline : item)),
        };
      }
      return { deadlines: [deadline, ...state.deadlines] };
    }),
  removeDeadline: (id) => set((state) => ({ deadlines: state.deadlines.filter((item) => item.id !== id) })),
  setFilters: (filters) => set({ filters }),
}));
