import React, { useState, useEffect } from 'react';
import TeamCard from '../../components/guide/TeamCard';
import Button from '../../components/common/Button';

const FacultyTeamSelect = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const res = await fetch('http://localhost:5000/api/guide/faculty/teams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Failed to fetch teams');
                const data = await res.json();
                setTeams(data);
            } catch (error) {
                console.error(error);
                setMessage('Error loading available teams.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const handleToggleSelect = (team) => {
        if (selectedTeamIds.includes(team.id)) {
            setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
        } else {
            if (selectedTeamIds.length >= 2) {
                alert('You can only select a maximum of 2 teams at once.');
                return;
            }
            setSelectedTeamIds([...selectedTeamIds, team.id]);
        }
    };

    const handleSubmitSelections = async () => {
        if (selectedTeamIds.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        setMessage('');

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch('http://localhost:5000/api/guide/faculty/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ teamIds: selectedTeamIds })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage(data.message);
            setSelectedTeamIds([]);
            
            // Remove selected teams from list locally to update UI immediately
            setTeams(teams.filter(t => !selectedTeamIds.includes(t.id)));
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Select Project Teams</h1>
                    <p className="text-text-secondary">Browse and select up to 2 teams to guide for their final year project.</p>
                </div>
                
                <div className="bg-surface/80 p-4 rounded-xl border border-border flex items-center gap-4">
                    <span className="text-sm font-medium text-text-secondary">
                        Selected: <strong className="text-accent">{selectedTeamIds.length} / 2</strong>
                    </span>
                    <Button 
                        onClick={handleSubmitSelections} 
                        disabled={selectedTeamIds.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Sending...' : 'Send Invitations'}
                    </Button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 ${message.includes('successfully') ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                    {message}
                </div>
            )}

            {teams.length === 0 ? (
                <div className="text-center py-12 bg-surface/50 border border-border rounded-2xl">
                    <p className="text-text-secondary">No available teams to select at this moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => {
                        const isSelected = selectedTeamIds.includes(team.id);
                        return (
                            <div key={team.id} className="relative">
                                <TeamCard 
                                    team={team} 
                                    actionLabel={isSelected ? "Deselect" : "Select Team"}
                                    onAction={handleToggleSelect}
                                    showStatus={false}
                                />
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 bg-accent text-canvas w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-canvas">
                                        ✓
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FacultyTeamSelect;
