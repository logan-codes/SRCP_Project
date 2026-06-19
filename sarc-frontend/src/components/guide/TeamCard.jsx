import React from 'react';
import { Users, FileText, LayoutTemplate, MapPin, Award } from 'lucide-react';
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
                        Members: {team.members?.filter(m => m.inviteStatus !== 'REJECTED').length || 0}
                    </p>
                </div>

                {team.abstractFile && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                        <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                        <a 
                            href={`${import.meta.env.VITE_API_URL}/uploads/${team.abstractFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-accent hover:underline font-medium"
                        >
                            View Project Abstract
                        </a>
                    </div>
                )}

                {team.guide && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-accent/5 to-transparent border border-accent/20 rounded-xl flex items-center gap-3">
                        <div className="bg-accent/10 p-2 rounded-lg">
                            <Award className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">Assigned Guide</p>
                            <p className="text-sm font-bold text-text-primary">{team.guide.fullName}</p>
                        </div>
                    </div>
                )}
            </div>

            {team.members && team.members.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider">Team Members</p>
                    <ul className="space-y-1">
                        {team.members.filter(m => m.inviteStatus !== 'REJECTED').map((member) => (
                            <li key={member.id} className="text-sm text-text-primary flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                                <div className="flex flex-col">
                                    <span>{member.student?.fullName || 'Student'} {member.isLeader ? '👑' : ''}</span>
                                    {member.student?.studentProfile?.studentId && (
                                        <span className="text-xs text-text-secondary">{member.student.studentProfile.studentId}</span>
                                    )}
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                    member.inviteStatus === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' :
                                    member.inviteStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
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
