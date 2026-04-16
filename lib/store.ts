'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSession, PropertySchema } from '@/types';

interface OnboardingState {
  // 選択済み設定
  selectedProjectId: string | null;
  selectedPropertyId: string | null;
  selectedPropertyName: string | null;
  selectedDataset: string | null;
  bqLinkStatus: 'linked' | 'not_linked' | 'fallback_api' | null;
  schema: PropertySchema | null;
  onboardingCompleted: boolean;

  // ステップ管理
  currentStep: number;

  // セッター
  setProject: (id: string) => void;
  setProperty: (id: string, name: string) => void;
  setBQStatus: (status: 'linked' | 'not_linked' | 'fallback_api', dataset?: string) => void;
  setSchema: (schema: PropertySchema) => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      selectedPropertyId: null,
      selectedPropertyName: null,
      selectedDataset: null,
      bqLinkStatus: null,
      schema: null,
      onboardingCompleted: false,
      currentStep: 1,

      setProject: (id) => set({ selectedProjectId: id }),
      setProperty: (id, name) => set({ selectedPropertyId: id, selectedPropertyName: name }),
      setBQStatus: (status, dataset) =>
        set({ bqLinkStatus: status, selectedDataset: dataset ?? null }),
      setSchema: (schema) => set({ schema }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      goToStep: (step) => set({ currentStep: step }),
      reset: () =>
        set({
          selectedProjectId: null,
          selectedPropertyId: null,
          selectedPropertyName: null,
          selectedDataset: null,
          bqLinkStatus: null,
          schema: null,
          onboardingCompleted: false,
          currentStep: 1,
        }),
    }),
    { name: 'ga-agent-onboarding' }
  )
);
