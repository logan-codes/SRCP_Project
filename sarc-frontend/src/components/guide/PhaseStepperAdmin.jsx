import React from 'react';

const phases = [
    { id: 'CLOSED', label: '1. Team Formation (Closed)' },
    { id: 'FACULTY_SELECTION', label: '2. Faculty Selection' },
    { id: 'STUDENT_SELECTION', label: '3. Student Selection' },
    { id: 'COMPLETED', label: '4. Completed' }
];

const PhaseStepperAdmin = ({ currentPhase }) => {
    const currentIndex = phases.findIndex(p => p.id === currentPhase);

    return (
        <div className="flex items-center w-full my-8 overflow-x-auto pb-4">
            {phases.map((phase, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                
                return (
                    <React.Fragment key={phase.id}>
                        {/* Step Circle & Label */}
                        <div className="flex flex-col items-center relative min-w-[120px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors z-10 ${
                                isCompleted ? 'bg-accent border-accent text-canvas' :
                                isCurrent ? 'bg-canvas border-accent text-accent' :
                                'bg-canvas border-border text-text-secondary'
                            }`}>
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            <span className={`text-xs font-medium mt-2 whitespace-nowrap ${
                                isCurrent ? 'text-accent' : 
                                isCompleted ? 'text-text-primary' : 'text-text-secondary'
                            }`}>
                                {phase.label.split('.')[1].trim()}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < phases.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                isCompleted ? 'bg-accent' : 'bg-border'
                            }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default PhaseStepperAdmin;
