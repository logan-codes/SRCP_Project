import React, { useState, useEffect } from 'react';
import TeamCard from '../../components/guide/TeamCard';

const FacultyAllocatedTeams = () => {
    const [allocatedTeams, setAllocatedTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllocatedTeams = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/allocated`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Failed to fetch allocated teams');
                const data = await res.json();
                setAllocatedTeams(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllocatedTeams();
    }, []);

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">My Allocated Teams</h1>
            <p className="text-text-secondary mb-8">View the teams that have been officially allocated to you.</p>

            {allocatedTeams.length === 0 ? (
                <div className="text-center py-12 bg-surface/50 border border-border rounded-2xl">
                    <p className="text-text-secondary">No teams have been allocated to you yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allocatedTeams.map(team => (
                        <div key={team.id} className="relative">
                            <TeamCard 
                                team={team} 
                                showStatus={true}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacultyAllocatedTeams;
