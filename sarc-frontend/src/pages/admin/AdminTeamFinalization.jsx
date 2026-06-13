import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const AdminTeamFinalization = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchTeams = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch('http://localhost:5000/api/guide/admin/teams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch teams');
            const data = await res.json();
            setTeams(data);
            setFilteredTeams(data);
        } catch (error) {
            console.error(error);
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredTeams(teams);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredTeams(teams.filter(t => 
                t.teamName.toLowerCase().includes(lower) || 
                t.teamId.toLowerCase().includes(lower) || 
                t.domain.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, teams]);

    const handleToggleFinalize = async (teamId, currentStatus) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/guide/admin/teams/${teamId}/finalize`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isFinalized: !currentStatus })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            setMessage({ text: `Team finalization status updated successfully`, type: 'success' });
            
            // Optimistically update the UI
            setTeams(teams.map(t => t.id === teamId ? { ...t, isFinalized: !currentStatus } : t));
            
            // Clear message after 3 seconds
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleFinalizeAll = async () => {
        if (!window.confirm('Are you sure you want to finalize all teams that have the required number of accepted members (1-2)?')) return;

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch('http://localhost:5000/api/guide/admin/teams/finalize-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            const data = await res.json();
            setMessage({ text: data.message, type: 'success' });
            
            // Refresh teams
            fetchTeams();
            
            setTimeout(() => setMessage({ text: '', type: '' }), 5000);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you ABSOLUTELY sure you want to delete this team? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/guide/admin/teams/${teamId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            setMessage({ text: 'Team successfully deleted.', type: 'success' });
            
            setTeams(teams.filter(t => t.id !== teamId));
            
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Team Finalization</h1>
                    <p className="text-text-secondary">Review and manually finalize student teams before the Guide Selection phase.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleFinalizeAll}
                        className="w-full md:w-auto px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl font-bold transition-colors whitespace-nowrap"
                    >
                        Finalize All Ready
                    </button>
                    <div className="relative w-full md:w-64">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                        <input 
                            type="text" 
                            placeholder="Search teams..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent text-sm"
                        />
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-green-500/10 border border-green-500/20 text-green-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="p-4 text-sm font-medium text-text-secondary">Team Details</th>
                                <th className="p-4 text-sm font-medium text-text-secondary">Members</th>
                                <th className="p-4 text-sm font-medium text-text-secondary">Readiness</th>
                                <th className="p-4 text-sm font-medium text-text-secondary text-right">Finalize Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeams.map(team => {
                                const totalMembers = team.members.length;
                                const acceptedCount = team.members.filter(m => m.inviteStatus === 'ACCEPTED').length;
                                const isReady = acceptedCount >= 1 && acceptedCount <= 2;

                                return (
                                    <tr key={team.id} className={`border-b border-border/50 hover:bg-surface/80 transition-colors ${team.isFinalized ? 'bg-green-500/5' : ''}`}>
                                        <td className="p-4">
                                            <p className="font-bold text-text-primary">{team.teamName}</p>
                                            <p className="text-xs text-text-secondary mb-1">{team.teamId}</p>
                                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">
                                                {team.domain}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="mb-1">
                                                <span className="font-medium text-text-primary">Leader:</span> {team.leader.fullName}
                                            </div>
                                            {team.members.filter(m => !m.isLeader).map(m => (
                                                <div key={m.id} className="text-text-secondary text-xs">
                                                    • {m.student.fullName} ({m.inviteStatus})
                                                </div>
                                            ))}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                isReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                                {acceptedCount} / {totalMembers} Accepted
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleToggleFinalize(team.id, team.isFinalized)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                                        team.isFinalized 
                                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                                                        : 'bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent'
                                                    }`}
                                                >
                                                    {team.isFinalized ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    {team.isFinalized ? 'Finalized' : 'Mark Finalized'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                    title="Delete Team"
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTeams.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-text-secondary">No teams found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminTeamFinalization;
