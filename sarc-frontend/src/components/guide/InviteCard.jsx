import React from 'react';
import Button from '../common/Button';
import { UserPlus, User } from 'lucide-react';

const InviteCard = ({ title, subtitle, details, onAccept, onReject, type = 'team' }) => {
    return (
        <div className="bg-surface/50 border border-border p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${type === 'team' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                    {type === 'team' ? <UserPlus className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </div>
                <div>
                    <h4 className="text-lg font-bold text-text-primary">{title}</h4>
                    <p className="text-sm text-text-secondary">{subtitle}</p>
                    {details && <p className="text-xs text-text-secondary mt-1">{details}</p>}
                </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={onAccept} className="flex-1 md:flex-none">Accept</Button>
                <Button onClick={onReject} variant="outline" className="flex-1 md:flex-none text-red-400 hover:bg-red-400/10">Reject</Button>
            </div>
        </div>
    );
};

export default InviteCard;
