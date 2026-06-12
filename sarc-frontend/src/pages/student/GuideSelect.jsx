import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyGuideCard from '../../components/guide/FacultyGuideCard';

const GuideSelect = () => {
    const navigate = useNavigate();
    const [facultyList, setFacultyList] = useState([]);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                
                const [teamRes, facRes] = await Promise.all([
                    fetch('http://localhost:5000/api/guide/teams/my', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:5000/api/guide/faculty/available', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const teamData = await teamRes.json();
                if (teamRes.ok) {
                    setTeam(teamData);
                } else {
                    throw new Error(teamData.message || 'Failed to fetch team data');
                }

                const facData = await facRes.json();
                if (facRes.ok) {
                    setFacultyList(facData);
                } else {
                    throw new Error(facData.message || 'Failed to fetch faculty data');
                }
            } catch (error) {
                console.error(error);
                setMessage(error.message || 'Error loading guide selection data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSelectGuide = async (faculty) => {
        if (!window.confirm(`Are you sure you want to select Prof. ${faculty.name} as your guide? This cannot be undone.`)) return;

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/guide/teams/${team.id}/select-guide`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ facultyId: faculty.facultyId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage(data.message);
            // Refresh team and faculty data
            const teamRes = await fetch('http://localhost:5000/api/guide/teams/my', { headers: { 'Authorization': `Bearer ${token}` } });
            setTeam(await teamRes.json());
        } catch (error) {
            setMessage(error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    if (!team || team.isFinalized === false) {
        return <div className="p-8 text-center text-red-500">Your team is not finalized yet.</div>;
    }

    if (message && message === 'Guide Selection is not currently active.') {
        return (
            <div className="max-w-6xl mx-auto py-8 px-4 text-center">
                 <h1 className="text-3xl font-bold text-text-primary mb-2">Guide Selection is Currently Closed</h1>
                 <p className="text-text-secondary">The administrator has not opened the guide selection phase yet. Please check back later when the phase is active.</p>
            </div>
        );
    }

    const hasGuide = team.guideStatus !== 'PENDING';

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Select Your Guide</h1>
            <p className="text-text-secondary mb-8">Browse available faculty members and select a guide for your project.</p>

            {message && (
                <div className={`p-4 rounded-xl mb-6 border ${message.includes('success') ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {message}
                </div>
            )}

            {hasGuide ? (
                <div className="bg-surface/50 border border-border p-8 rounded-2xl text-center">
                    <h2 className="text-2xl font-bold text-green-500 mb-2">Guide Selected ✅</h2>
                    <p className="text-text-secondary">Your team has already been assigned a guide. Check your dashboard for details.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {facultyList.map(faculty => (
                        <FacultyGuideCard
                            key={faculty.facultyId}
                            faculty={faculty}
                            isSelectable={team.leaderId === team.members.find(m => m.isLeader)?.studentId} // Only leader can click
                            onSelect={handleSelectGuide}
                            isSelected={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuideSelect;
