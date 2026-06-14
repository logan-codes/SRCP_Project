import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Flag, Plus, Trash2, Edit2, Calendar } from 'lucide-react';

const AdminMilestonesConfig = () => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        status: 'PENDING'
    });

    const fetchMilestones = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch('http://localhost:5000/api/global-milestones', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMilestones(data);
            }
        } catch (err) {
            console.error("Failed to fetch milestones", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMilestones();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sarc_token');
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId 
                ? `http://localhost:5000/api/global-milestones/${editingId}`
                : 'http://localhost:5000/api/global-milestones';
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: '', description: '', dueDate: '', status: 'PENDING' });
                fetchMilestones();
            }
        } catch (err) {
            console.error("Failed to save milestone", err);
        }
    };

    const handleEdit = (m) => {
        setFormData({
            title: m.title,
            description: m.description,
            dueDate: new Date(m.dueDate).toISOString().slice(0, 16),
            status: m.status
        });
        setEditingId(m.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this milestone?")) return;
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/global-milestones/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchMilestones();
            }
        } catch (err) {
            console.error("Failed to delete milestone", err);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-8 border-b border-primary/10 pb-6">
                <div>
                    <Badge text="Admin Configuration" />
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Global Milestones & Deadlines</h1>
                    <p className="text-slate-600 mt-2 text-lg">Manage portal-wide deadlines for team creation, guide selection, and proposals.</p>
                </div>
                {!showForm && (
                    <Button variant="gradient" onClick={() => {
                        setFormData({ title: '', description: '', dueDate: '', status: 'PENDING' });
                        setEditingId(null);
                        setShowForm(true);
                    }} className="shadow-md gap-2"><Plus size={18} /> Add Milestone</Button>
                )}
            </div>

            {showForm && (
                <Card className="mb-8 border border-primary/20 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800 font-heading mb-4">{editingId ? 'Edit Milestone' : 'Create New Milestone'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                <input required type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full md:w-1/3 px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                                    <option value="PENDING">PENDING</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" variant="primary">{editingId ? 'Update Milestone' : 'Save Milestone'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-10">Loading milestones...</div>
            ) : milestones.length === 0 ? (
                <Card className="text-center py-16 flex flex-col items-center">
                    <Flag size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No Global Milestones</h3>
                    <p className="text-slate-500 mt-2">Create the first milestone to guide users.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {milestones.map((m) => (
                        <Card key={m.id} className="flex justify-between items-center group hover:border-primary/30 transition-colors">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-slate-800">{m.title}</h3>
                                    <Badge color={m.status === 'COMPLETED' ? 'green' : 'yellow'}>{m.status}</Badge>
                                </div>
                                <p className="text-slate-600 text-sm mb-2">{m.description}</p>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                    <Calendar size={14} />
                                    Due: {new Date(m.dueDate).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(m)} className="p-2 text-slate-400 hover:text-primary bg-slate-50 rounded-lg transition-colors">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminMilestonesConfig;
