import React from 'react';
import Button from '../common/Button';
import SlotProgressBar from './SlotProgressBar';

const FacultyGuideCard = ({ faculty, onSelect, isSelectable, isSelected }) => {
    return (
        <div className={`bg-surface/50 border ${isSelected ? 'border-accent' : 'border-border'} p-6 rounded-2xl transition-all relative overflow-hidden`}>
            {isSelected && (
                <div className="absolute top-0 right-0 bg-accent text-canvas text-xs font-bold px-3 py-1 rounded-bl-xl">
                    Selected
                </div>
            )}
            
            <div className="flex items-start gap-3 mb-4">
                {faculty.profilePhoto ? (
                    <img 
                        src={faculty.profilePhoto.startsWith('http') ? faculty.profilePhoto : `http://localhost:5000/uploads/${faculty.profilePhoto.split(/[\\/]/).pop()}`} 
                        alt={faculty.name} 
                        className="w-12 h-12 rounded-full object-cover border border-primary/20 shrink-0"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shrink-0">
                        {faculty.name.charAt(0)}
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-bold text-text-primary leading-tight">{faculty.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">{faculty.department}</p>
                </div>
            </div>
            
            <div className="mb-4">
                <p className="text-xs text-text-secondary uppercase mb-1">Research Areas</p>
                <div className="flex flex-wrap gap-1">
                    {faculty.researchAreas.map((area, idx) => (
                        <span key={idx} className="text-xs bg-canvas px-2 py-1 rounded-md text-text-primary border border-border">
                            {area}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <SlotProgressBar used={faculty.usedSlots} total={faculty.totalSlots} />
            </div>

            {isSelectable && (
                <Button 
                    onClick={() => onSelect(faculty)} 
                    disabled={faculty.usedSlots >= faculty.totalSlots || isSelected}
                    className="w-full"
                >
                    {faculty.usedSlots >= faculty.totalSlots ? 'Full' : isSelected ? 'Selected' : 'Select Guide'}
                </Button>
            )}
        </div>
    );
};

export default FacultyGuideCard;
