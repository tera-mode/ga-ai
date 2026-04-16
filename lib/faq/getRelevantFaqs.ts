import { FAQS } from '@/content/faq/faq-data';
import type { FaqItem, OnboardingStep } from '@/content/faq/faq-data';

export function getRelevantFaqs(step: OnboardingStep): FaqItem[] {
  return FAQS
    .filter((faq) => faq.relevantSteps.includes(step))
    .sort((a, b) => a.priority - b.priority);
}
