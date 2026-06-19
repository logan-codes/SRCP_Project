import React, { useState, useEffect } from 'react';
import TeamCard from '../../components/guide/TeamCard';
import Button from '../../components/common/Button';

const GuideTeamMy = () => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        projectTitle: '', description: '', domain: '', customDomain: ''
    });
    const [editLoading, setEditLoading] = useState(false);

    const getUserId = () => {
        try {
            const token = localStorage.getItem('sarc_token');
            if(!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user.id;
        } catch (e) {
            return null;
        }
    };

    const fetchMyTeam = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeam(data);
                if (data) {
                    const isCustomDomain = data.domain && !['AI/ML', 'Web Development', 'Mobile Development', 'Cybersecurity', 'IoT', 'Blockchain'].includes(data.domain);
                    setEditData({
                        projectTitle: data.projectTitle,
                        description: data.description,
                        domain: isCustomDomain ? 'Other' : data.domain,
                        customDomain: isCustomDomain ? data.domain : ''
                    });
                }
            } else {
                setTeam(null);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
            setTeam(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTeam();
    }, []);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const token = localStorage.getItem('sarc_token');
            const submitData = {
                projectTitle: editData.projectTitle,
                description: editData.description,
                domain: editData.domain === 'Other' ? editData.customDomain : editData.domain
            };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update team');
            }
            setIsEditing(false);
            fetchMyTeam();
        } catch (error) {
            alert(error.message);
        } finally {
            setEditLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    teamId: team.teamId,
                    registerNumberOrEmail: inviteEmail
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send invite');
            
            setMessage(data.message);
            setInviteEmail('');
            fetchMyTeam();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
        
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete team');
            }
            alert('Team deleted successfully');
            setTeam(null);
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    if (!team) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="bg-surface/50 p-8 rounded-2xl border border-border">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">No Team Found</h2>
                    <p className="text-text-secondary mb-6">You are not part of any guide selection team yet.</p>
                    <Button onClick={() => window.location.href='/guide/team/create'}>Create a Team</Button>
                </div>
            </div>
        );
    }

    const activeMembersCount = team.members?.filter(m => m.inviteStatus === 'PENDING' || m.inviteStatus === 'ACCEPTED').length || 0;
    const canInvite = activeMembersCount < 2 && !team.isFinalized; // Max 2 members
    const isLeader = team.leaderId === getUserId();
    const canEdit = isLeader && !team.isFinalized;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-text-primary">My Team</h1>
                {canEdit && !isEditing && (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                            Edit Team
                        </Button>
                        <Button onClick={handleDeleteTeam} variant="outline" className="!text-red-500 !border-red-500 hover:!bg-red-500/10">
                            Delete Team
                        </Button>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {isEditing ? (
                        <div className="bg-surface/50 border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 text-text-primary">Edit Team Details</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Project Title</label>
                                    <input type="text" value={editData.projectTitle} onChange={e => setEditData({...editData, projectTitle: e.target.value})} className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" placeholder="e.g., Smart Attendance System" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Project Description</label>
                                    <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all min-h-[120px]" placeholder="Briefly describe what your project does..." required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Domain</label>
                                    <select value={editData.domain} onChange={e => setEditData({...editData, domain: e.target.value})} className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" required>
                                        <option value="AI/ML">AI / Machine Learning</option>
                                        <option value="Web Development">Web Development</option>
                                        <option value="Mobile Development">Mobile App Development</option>
                                        <option value="Cybersecurity">Cybersecurity</option>
                                        <option value="IoT">Internet of Things (IoT)</option>
                                        <option value="Blockchain">Blockchain</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                {editData.domain === 'Other' && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">Custom Domain Name</label>
                                        <input type="text" value={editData.customDomain} onChange={e => setEditData({...editData, customDomain: e.target.value})} className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" placeholder="Enter your domain name" required />
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <TeamCard team={team} showStatus={true} />
                    )}
                </div>
                
                <div>
                    <div className="bg-surface/50 border border-border rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Invite Member</h3>
                        
                        {!canInvite ? (
                            <p className="text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                {team.isFinalized ? 'Team is finalized. No more invites can be sent.' : 'Your team is full (max 2 members including pending invites).'}
                            </p>
                        ) : (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <p className="text-sm text-text-secondary mb-2">Invite your partner using their email or register number.</p>
                                <input 
                                    type="text" 
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="Email or Register Number"
                                    className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                                    required
                                />
                                <Button type="submit" className="w-full" disabled={inviteLoading}>
                                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                                </Button>
                            </form>
                        )}
                        
                        {message && (
                            <div className="mt-4 text-sm p-3 rounded-xl bg-accent/10 text-accent border border-accent/20">
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideTeamMy;
