import React from 'react';

const SlotProgressBar = ({ used, total }) => {
    const percentage = Math.min((used / total) * 100, 100);
    const isFull = used >= total;

    return (
        <div>
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-text-secondary">Slots Fill</span>
                <span className={`text-xs font-bold ${isFull ? 'text-red-400' : 'text-accent'}`}>
                    {used} / {total}
                </span>
            </div>
            <div className="h-2 w-full bg-canvas rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-accent'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {isFull && <p className="text-xs text-red-400 mt-1">This guide is full</p>}
        </div>
    );
};

export default SlotProgressBar;
