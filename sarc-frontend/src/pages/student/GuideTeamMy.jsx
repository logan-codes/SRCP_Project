import React, { useState, useEffect } from 'react';
import TeamCard from '../../components/guide/TeamCard';
import Button from '../../components/common/Button';

const GuideTeamMy = () => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchMyTeam = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch('http://localhost:5000/api/guide/teams/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeam(data);
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

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch('http://localhost:5000/api/guide/teams/invite', {
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

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-8">My Guide Team</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <TeamCard team={team} showStatus={true} />
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
