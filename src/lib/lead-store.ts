import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

type Lead = {
  name: string;
  email: string;
  industry: string;
  submitted_at: string;
};

type LeadStore = {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  addLead: (lead: Lead) => Promise<void>;
  clearError: () => void;
};

export const useLeadStore = create<LeadStore>((set) => ({
  leads: [],
  isLoading: false,
  error: null,
  addLead: async (lead) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select();

      if (error) throw error;

      // Update local state with the returned data
      set((state) => ({
        leads: [...state.leads, ...(data || [lead])], // Fallback to the original lead if no data returned
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error adding lead:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Failed to add lead',
        isLoading: false 
      });
    }
  },
  clearError: () => set({ error: null }),
}));