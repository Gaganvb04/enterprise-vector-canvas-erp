import React from 'react';
import { UserCheck, Palette, Eye, Send, Check } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

export const StepNavigationHeader: React.FC = () => {
  const { currentStep, setStep } = useStudioStore();

  const STEPS = [
    { id: 1, label: 'STEP 1 — Your Details', icon: UserCheck },
    { id: 2, label: 'STEP 2 — Customize Design', icon: Palette },
    { id: 3, label: 'STEP 3 — Preview', icon: Eye },
    { id: 4, label: 'STEP 4 — Export / Send', icon: Send },
  ];

  const handleStepClick = (stepId: number) => {
    setStep(stepId as any);
  };

  return (
    <div className="flex items-center gap-1 bg-[#141210] p-1 rounded-xl border border-[#252118] text-xs font-bold select-none">
      {STEPS.map(s => {
        const Icon = s.icon;
        const isActive = currentStep === s.id;
        const isCompleted = currentStep > s.id;

        return (
          <button
            key={s.id}
            onClick={() => handleStepClick(s.id)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              isActive
                ? 'bg-[#C9956C] text-[#161412] shadow-lg font-bold'
                : isCompleted
                ? 'bg-[#252118] text-[#C9956C] hover:bg-[#322C22]'
                : 'text-[#8C8073] hover:text-[#E5D7C5] hover:bg-[#1f1c19]'
            }`}
          >
            {isCompleted ? (
              <Check className="h-3.5 w-3.5 text-[#C9956C]" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">Step {s.id}</span>
          </button>
        );
      })}
    </div>
  );
};

export default StepNavigationHeader;
