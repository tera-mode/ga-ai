'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { BarChart2 } from 'lucide-react';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { Step1and2 } from '@/components/onboarding/Step1and2';
import { Step3BQDiagnose } from '@/components/onboarding/Step3BQDiagnose';
import { Step3aSetupGuide } from '@/components/onboarding/Step3aSetupGuide';
import { Step4Test } from '@/components/onboarding/Step4Test';
import { Step5Schema } from '@/components/onboarding/Step5Schema';
import { useOnboardingStore } from '@/lib/store';
import type { PropertySchema } from '@/types';
import { ContextualHelpButton } from '@/components/faq/ContextualHelpButton';
import type { OnboardingStep } from '@/content/faq/faq-data';

type SubStep = 'main' | 'setup_guide';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    currentStep,
    selectedProjectId,
    selectedPropertyId,
    selectedPropertyName,
    selectedDataset,
    bqLinkStatus,
    onboardingCompleted,
    setProject,
    setProperty,
    setBQStatus,
    setSchema,
    completeOnboarding,
    nextStep,
    goToStep,
  } = useOnboardingStore();

  const [subStep, setSubStep] = [
    (() => {
      if (typeof window !== 'undefined') {
        return (window as Window & { __sub?: SubStep }).__sub ?? 'main';
      }
      return 'main';
    })(),
    (v: SubStep) => {
      if (typeof window !== 'undefined') {
        (window as Window & { __sub?: SubStep }).__sub = v;
      }
    },
  ] as const;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && bqLinkStatus === 'fallback_api' && !onboardingCompleted) {
      completeOnboarding();
      router.push('/dashboard');
    }
  }, [user, bqLinkStatus, onboardingCompleted, completeOnboarding, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  // Map current wizard state to OnboardingStep for contextual help
  const faqStep: OnboardingStep = (() => {
    if (currentStep === 1 || currentStep === 2) return 'step1-project';
    if (currentStep === 3 && subStep === 'setup_guide') return 'step3a-bq-setup';
    if (currentStep === 3) return 'step3-bq-diagnosis';
    if (currentStep === 4) return 'step4-test';
    return 'step5-schema';
  })();

  const handleComplete = (schema: PropertySchema) => {
    setSchema(schema);
    completeOnboarding();
    router.push('/dashboard');
  };

  const handleFallback = () => {
    setBQStatus('fallback_api');
    completeOnboarding();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <BarChart2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">GA4 Analytics Agent</span>
          </div>
          <span className="text-xs text-gray-400">{user?.email}</span>
        </div>
      </header>

      {/* Contextual help FAB */}
      <ContextualHelpButton step={faqStep} variant="fab" />

      <div className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        {/* タイトル */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">セットアップ</h1>
          <p className="mt-1 text-sm text-gray-500">数分で分析を始められます</p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex justify-center">
          <StepIndicator current={currentStep} />
        </div>

        {/* ステップコンテンツ */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
          {(currentStep === 1 || currentStep === 2) && (
            <Step1and2
              onNext={(projectId, propertyId, propertyName) => {
                setProject(projectId);
                setProperty(propertyId, propertyName);
                goToStep(3);
              }}
            />
          )}
          {currentStep === 3 && subStep === 'main' && selectedPropertyId && selectedPropertyName && (
            <Step3BQDiagnose
              propertyId={selectedPropertyId}
              propertyName={selectedPropertyName}
              onLinked={(dataset, projectId) => {
                setBQStatus('linked', dataset);
                setProject(projectId);
                nextStep();
              }}
              onFallback={handleFallback}
              onSetupGuide={() => setSubStep('setup_guide')}
              onBack={() => goToStep(1)}
            />
          )}
          {currentStep === 3 && subStep === 'setup_guide' && selectedPropertyId && selectedProjectId && (
            <Step3aSetupGuide
              propertyId={selectedPropertyId}
              projectId={selectedProjectId}
              onLinked={(dataset, projectId) => {
                setBQStatus('linked', dataset);
                setProject(projectId);
                setSubStep('main');
                nextStep();
              }}
              onFallback={() => { setSubStep('main'); handleFallback(); }}
              onBack={() => setSubStep('main')}
            />
          )}
          {currentStep === 4 && selectedProjectId && selectedDataset && (
            <Step4Test
              projectId={selectedProjectId}
              dataset={selectedDataset}
              onSuccess={() => nextStep()}
              onBack={() => goToStep(3)}
            />
          )}
          {currentStep === 5 && selectedProjectId && selectedDataset && selectedPropertyId && selectedPropertyName && (
            <Step5Schema
              projectId={selectedProjectId}
              dataset={selectedDataset}
              propertyId={selectedPropertyId}
              propertyName={selectedPropertyName}
              onComplete={handleComplete}
              onBack={() => goToStep(4)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
