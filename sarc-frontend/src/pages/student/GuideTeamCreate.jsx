import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

const GuideTeamCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        teamName: '',
        projectTitle: '',
        description: '',
        domain: '',
        inviteMember: ''
    });
    const [abstractFile, setAbstractFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('sarc_token');

            const submitData = new FormData();
            submitData.append('teamName', formData.teamName);
            submitData.append('projectTitle', formData.projectTitle);
            submitData.append('description', formData.description);
            submitData.append('domain', formData.domain);
            if (abstractFile) {
                submitData.append('abstractFile', abstractFile);
            }

            const res = await fetch('http://localhost:5000/api/guide/teams', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: submitData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create team');
            }

            const teamData = await res.json();

            if (formData.inviteMember) {
                const inviteRes = await fetch('http://localhost:5000/api/guide/teams/invite', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        teamId: teamData.teamId,
                        registerNumberOrEmail: formData.inviteMember
                    })
                });

                if (!inviteRes.ok) {
                    const inviteData = await inviteRes.json();
                    console.error('Failed to invite member:', inviteData.message);
                    alert(`Team created successfully, but failed to invite member: ${inviteData.message}`);
                }
            }

            navigate('/guide/team/my');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">My project team</h1>
            <p className="text-text-secondary mb-8">Register your team for the final year project guide selection process.</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-surface/50 p-6 md:p-8 rounded-2xl border border-border">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Team Name</label>
                    <input 
                        type="text" 
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="e.g., CodeCrafters"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Project Title</label>
                    <input 
                        type="text" 
                        name="projectTitle"
                        value={formData.projectTitle}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="e.g., Smart Attendance System"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Project Description</label>
                    <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all min-h-[120px]"
                        placeholder="Briefly describe what your project does..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Domain</label>
                    <select 
                        name="domain"
                        value={formData.domain}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        required
                    >
                        <option value="">Select Domain...</option>
                        <option value="AI/ML">AI / Machine Learning</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Development">Mobile App Development</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="IoT">Internet of Things (IoT)</option>
                        <option value="Blockchain">Blockchain</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Project Abstract (PDF) <span className="text-text-secondary text-xs font-normal">(Optional)</span></label>
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => setAbstractFile(e.target.files[0])}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                    />
                </div>

                <div className="pt-4 border-t border-border">
                    <label className="block text-sm font-medium text-text-primary mb-2">Invite Team Member (Optional)</label>
                    <p className="text-xs text-text-secondary mb-2">Enter the email or register number of your partner to invite them.</p>
                    <input 
                        type="text" 
                        name="inviteMember"
                        value={formData.inviteMember}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="Email or Register Number"
                    />
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Team'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default GuideTeamCreate;
