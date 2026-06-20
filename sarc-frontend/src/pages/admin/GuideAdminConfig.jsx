import React, { useState, useEffect } from 'react';
import PhaseStepperAdmin from '../../components/guide/PhaseStepperAdmin';
import Button from '../../components/common/Button';
import * as XLSX from 'xlsx';

const GuideAdminConfig = () => {
    const [configData, setConfigData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [dropIncomplete, setDropIncomplete] = useState(false);
    const [systemConfig, setSystemConfig] = useState(null);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setConfigData(data);
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemConfig = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSystemConfig(data);
        } catch (error) {
            console.error('Error fetching system config:', error);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchSystemConfig();
    }, []);

    const handleToggleResearchCollab = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isResearchCollaborationActive: !systemConfig.isResearchCollaborationActive })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(data.message);
            fetchSystemConfig();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleChangePhase = async (newPhase) => {
        if (!window.confirm(`Are you sure you want to advance to the ${newPhase} phase? This cannot be undone.`)) return;

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/config/phase`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ phase: newPhase, dropIncompleteTeams: dropIncomplete })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage(data.message);
            fetchConfig();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleUpdateSlot = async (facultyId, newSlots) => {
        try {
            const token = localStorage.getItem('sarc_token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty-slots/${facultyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ totalSlots: newSlots })
            });
            fetchConfig();
        } catch (error) {
            console.error('Error updating slot:', error);
        }
    };

    const handleRestartPhase = async () => {
        if (!window.confirm('Are you absolutely sure you want to RESTART the guide selection phase? This will wipe ALL team formations, invitations, and faculty selections! This action is PERMANENT.')) return;
        
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/config/reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(data.message);
            fetchConfig();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleExportExcel = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch export data');
            const data = await res.json();
            
            const formattedData = data.map(team => ({
                'Team ID': team.teamId,
                'Project Title': team.projectTitle,
                'Domain': team.domain,
                'Guide Name': team.guide?.fullName || 'N/A',
                'Guide Department': team.guide?.facultyProfile?.department || 'N/A',
                'Leader Name': team.leader?.fullName || 'N/A',
                'Leader ID': team.leader?.studentProfile?.studentId || 'N/A',
                'Member 1 Name': team.members[0]?.student?.fullName || '',
                'Member 1 ID': team.members[0]?.student?.studentProfile?.studentId || '',
                'Member 2 Name': team.members[1]?.student?.fullName || '',
                'Member 2 ID': team.members[1]?.student?.studentProfile?.studentId || '',
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams');
            XLSX.writeFile(workbook, 'Guide_Selection_Finalized_Teams.xlsx');
            
            setMessage('Data exported successfully!');
        } catch (error) {
            console.error('Error exporting teams:', error);
            setMessage('Error exporting teams to Excel.');
        }
    };

    if (loading || !configData) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    const { config, stats, facultySlots } = configData;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">System & Guide Configuration</h1>
            <p className="text-text-secondary mb-8">Manage system features and phases for the project guide selection process.</p>

            {message && (
                <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl mb-6">
                    {message}
                </div>
            )}

            <div className="bg-surface/50 border border-border p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-bold text-text-primary mb-4">Global Features</h2>
                <div className="flex items-center justify-between border border-border p-4 rounded-xl bg-canvas">
                    <div>
                        <h3 className="font-semibold text-text-primary">Research Collaboration Module</h3>
                        <p className="text-sm text-text-secondary">Enable or disable the research collaboration section for students.</p>
                    </div>
                    {systemConfig && (
                        <button 
                            onClick={handleToggleResearchCollab}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${systemConfig.isResearchCollaborationActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        >
                            {systemConfig.isResearchCollaborationActive ? 'Enabled' : 'Disabled'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-surface/50 border border-border p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-bold text-text-primary mb-4">Phase Control</h2>
                <PhaseStepperAdmin currentPhase={config.phase} />
                
                <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-border pt-6">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="dropIncomplete"
                            checked={dropIncomplete}
                            onChange={(e) => setDropIncomplete(e.target.checked)}
                            className="w-4 h-4 rounded text-accent focus:ring-accent"
                        />
                        <label htmlFor="dropIncomplete" className="text-sm text-text-secondary">
                            Drop incomplete teams when moving to Faculty Selection phase
                        </label>
                    </div>

                    <div className="flex gap-2">
                        {config.phase === 'CLOSED' && (
                            <Button onClick={() => handleChangePhase('FACULTY_SELECTION')}>Open Faculty Selection</Button>
                        )}
                        {config.phase === 'FACULTY_SELECTION' && (
                            <>
                                <Button onClick={() => handleChangePhase('STUDENT_SELECTION')}>Open Student Selection</Button>
                                <Button onClick={() => handleChangePhase('CLOSED')} className="bg-yellow-600 hover:bg-yellow-700">Revert to Closed</Button>
                            </>
                        )}
                        {config.phase === 'STUDENT_SELECTION' && (
                            <>
                                <Button onClick={() => handleChangePhase('COMPLETED')} className="bg-green-600 hover:bg-green-700">Mark Completed</Button>
                                <Button onClick={() => handleChangePhase('FACULTY_SELECTION')} className="bg-yellow-600 hover:bg-yellow-700">Revert to Faculty Selection</Button>
                            </>
                        )}
                        {config.phase === 'COMPLETED' && (
                            <>
                                <Button onClick={handleExportExcel} className="bg-blue-600 hover:bg-blue-700">Export Excel</Button>
                                <Button onClick={() => handleChangePhase('STUDENT_SELECTION')} className="bg-yellow-600 hover:bg-yellow-700">Reopen Student Selection</Button>
                            </>
                        )}
                        <Button onClick={handleRestartPhase} className="bg-red-600 hover:bg-red-700">Wipe & Restart</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-text-primary mb-1">{stats.totalTeams}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Total Teams</p>
                </div>
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-accent mb-1">{stats.teamsMatchedFaculty + stats.teamsMatchedStudent}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Matched Teams</p>
                </div>
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-yellow-500 mb-1">{stats.unmatchedTeams}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Unmatched Teams</p>
                </div>
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-green-500 mb-1">{stats.openSlotsFacultyCount}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Faculty w/ Slots</p>
                </div>
            </div>

            <div className="bg-surface/50 border border-border p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-text-primary mb-4">Faculty Slot Management</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="p-3 text-sm font-medium text-text-secondary">Faculty Name</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Department</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Used Slots</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Total Slots</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facultySlots.map(slot => (
                                <tr key={slot.id} className="border-b border-border/50 hover:bg-surface/80">
                                    <td className="p-3 text-sm text-text-primary font-medium">{slot.faculty.fullName}</td>
                                    <td className="p-3 text-sm text-text-secondary">{slot.faculty.facultyProfile?.department}</td>
                                    <td className="p-3 text-sm text-text-primary">{slot.usedSlots}</td>
                                    <td className="p-3 text-sm">
                                        <input 
                                            type="number" 
                                            defaultValue={slot.totalSlots}
                                            onBlur={(e) => handleUpdateSlot(slot.facultyId, e.target.value)}
                                            className="w-20 bg-canvas border border-border rounded-lg px-2 py-1 text-text-primary text-sm focus:outline-none focus:border-accent"
                                            min={slot.usedSlots}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {facultySlots.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-text-secondary">No faculty slots initialized. This happens when Faculty Selection phase begins.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GuideAdminConfig;
