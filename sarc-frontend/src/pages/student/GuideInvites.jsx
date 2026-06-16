import React, { useState, useEffect } from 'react';
import InviteCard from '../../components/guide/InviteCard';

const GuideInvites = () => {
    const [facultyInvites, setFacultyInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const fetchInvites = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const facRes = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invites/faculty`, { headers: { 'Authorization': `Bearer ${token}` } });

            const facData = facRes.ok ? await facRes.json() : [];

            setFacultyInvites(Array.isArray(facData) ? facData : []);
        } catch (error) {
            console.error('Error fetching invites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const respondToFacultyInvite = async (teamId, facultyId, action) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/${teamId}/respond-faculty`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ facultyId, action })
            });

            if (!res.ok) throw new Error((await res.json()).message);
            setMessage(`Faculty invitation ${action.toLowerCase()}ed.`);
            fetchInvites();
        } catch (error) {
            setMessage(error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Guide Invitations</h1>

            {message && (
                <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl mb-6">
                    {message}
                </div>
            )}

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-bold text-text-primary mb-4 border-b border-border pb-2">Guide Invitations from Faculty</h2>
                    {facultyInvites.length === 0 ? (
                        <p className="text-text-secondary">No pending faculty guide invitations.</p>
                    ) : (
                        <div className="space-y-4">
                            {facultyInvites.map(invite => (
                                <InviteCard 
                                    key={invite.id}
                                    type="faculty"
                                    title={`Prof. ${invite.faculty.fullName}`}
                                    subtitle={invite.faculty.facultyProfile?.department || 'Department'}
                                    details={`Research Areas: ${(invite.faculty.facultyProfile?.researchAreas || []).join(', ')}`}
                                    onAccept={() => respondToFacultyInvite(invite.teamId, invite.facultyId, 'ACCEPT')}
                                    onReject={() => respondToFacultyInvite(invite.teamId, invite.facultyId, 'REJECT')}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default GuideInvites;
