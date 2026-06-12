import React from 'react';
import { Users, FileText, LayoutTemplate, MapPin } from 'lucide-react';
import Button from '../common/Button';

const TeamCard = ({ team, onAction, actionLabel, showStatus, onReject }) => {
    return (
        <div className="bg-surface/50 border border-border p-6 rounded-2xl hover:border-accent/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-semibold text-accent/80 bg-accent/10 px-2 py-1 rounded-md mb-2 inline-block">
                        {team.domain}
                    </span>
                    <h3 className="text-xl font-bold text-text-primary">{team.teamName}</h3>
                    <p className="text-sm text-text-secondary">ID: {team.teamId}</p>
                </div>
                {showStatus && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        team.guideStatus === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' :
                        team.guideStatus === 'FACULTY_SELECTED' ? 'bg-yellow-500/10 text-yellow-500' :
                        team.guideStatus === 'STUDENT_SELECTED' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-gray-500/10 text-gray-400'
                    }`}>
                        {team.guideStatus.replace('_', ' ')}
                    </span>
                )}
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-text-primary">{team.projectTitle}</p>
                        <p className="text-sm text-text-secondary line-clamp-2">{team.description}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent flex-shrink-0" />
                    <p className="text-sm text-text-secondary">
                        Members: {team.members?.length || 0}
                    </p>
                </div>
            </div>

            {team.members && team.members.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider">Team Members</p>
                    <ul className="space-y-1">
                        {team.members.map((member) => (
                            <li key={member.id} className="text-sm text-text-primary flex items-center justify-between">
                                <span>{member.student?.fullName || 'Student'} {member.isLeader ? '👑' : ''}</span>
                                <span className={`text-xs ${
                                    member.inviteStatus === 'ACCEPTED' ? 'text-green-500' :
                                    member.inviteStatus === 'PENDING' ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                    {member.inviteStatus}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(actionLabel || onReject) && (
                 <div className="mt-6 flex gap-3">
                     {actionLabel && (
                         <Button onClick={() => onAction(team)} className="flex-1">
                             {actionLabel}
                         </Button>
                     )}
                     {onReject && (
                         <Button onClick={() => onReject(team)} variant="outline" className="flex-1 text-red-400 hover:bg-red-400/10">
                             Reject
                         </Button>
                     )}
                 </div>
            )}
        </div>
    );
};

export default TeamCard;
