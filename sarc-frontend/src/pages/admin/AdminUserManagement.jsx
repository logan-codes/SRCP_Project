import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import Button from '../../components/common/Button';
import * as XLSX from 'xlsx';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [activeTab, setActiveTab] = useState('STUDENT'); // STUDENT, FACULTY, ADMIN

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
    const [currentUser, setCurrentUser] = useState({ fullName: '', email: '', role: 'STUDENT', password: '' });

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch('http://localhost:5000/api/users/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        if (mode === 'EDIT' && user) {
            setCurrentUser({ ...user, password: '' });
        } else {
            setCurrentUser({ fullName: '', email: '', role: activeTab, password: '' });
        }
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sarc_token');
            const url = modalMode === 'CREATE' ? 'http://localhost:5000/api/users' : `http://localhost:5000/api/users/${currentUser.id}`;
            const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

            const payload = { ...currentUser };
            if (modalMode === 'EDIT' && !payload.password) {
                delete payload.password; // Don't send empty password on edit
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage({ text: `User ${modalMode === 'CREATE' ? 'created' : 'updated'} successfully`, type: 'success' });
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            setMessage({ text: 'User deleted successfully', type: 'success' });
            fetchUsers();
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const getBatchString = (user) => {
        const dept = user.studentProfile?.department;
        const year = user.studentProfile?.yearOfStudy;
        if (!dept && !year) return 'Unassigned Batch';
        return `${dept || 'Unknown Dept'} - ${year || 'Unknown Year'}`;
    };

    // Filter by role and search term
    const activeUsers = useMemo(() => {
        const roleUsers = users.filter(u => u.role === activeTab);
        if (!searchTerm) return roleUsers;
        
        const lower = searchTerm.toLowerCase();
        return roleUsers.filter(u => 
            u.fullName.toLowerCase().includes(lower) || 
            u.email.toLowerCase().includes(lower)
        );
    }, [users, activeTab, searchTerm]);

    // Group students by batch
    const groupedStudents = useMemo(() => {
        if (activeTab !== 'STUDENT') return {};
        const groups = {};
        activeUsers.forEach(user => {
            const batch = getBatchString(user);
            if (!groups[batch]) groups[batch] = [];
            groups[batch].push(user);
        });
        return groups;
    }, [activeUsers, activeTab]);

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setMessage({ text: 'Excel file is empty', type: 'error' });
                    return;
                }

                const usersPayload = data.map(row => ({
                    fullName: row.Name || row.fullName || '',
                    email: row.Email || row.email || '',
                    password: row.Password || row.password || 'password123',
                    role: (row.Role || row.role || activeTab).toUpperCase(),
                    department: row.Department || row.department || '',
                    yearOfStudy: row.Batch || row.YearOfStudy || row.yearOfStudy || '',
                    designation: row.Designation || row.designation || ''
                })).filter(u => u.email && u.fullName);

                if (usersPayload.length === 0) {
                    setMessage({ text: 'No valid rows found. Please ensure "Name" and "Email" columns exist.', type: 'error' });
                    return;
                }

                if (!window.confirm(`Are you sure you want to import ${usersPayload.length} users?`)) return;

                const token = localStorage.getItem('sarc_token');
                const res = await fetch('http://localhost:5000/api/users/bulk', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ users: usersPayload })
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.message);

                setMessage({ text: `Imported ${result.createdCount} users successfully. ${result.errors?.length > 0 ? result.errors.length + ' duplicates/errors occurred.' : ''}`, type: 'success' });
                fetchUsers();
            } catch (error) {
                console.error(error);
                setMessage({ text: error.message || 'Error parsing Excel file', type: 'error' });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null; // reset input
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">User Management</h1>
                    <p className="text-text-secondary">Add, edit, or remove users and manage their data.</p>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent text-sm"
                        />
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:bg-surface/80 rounded-xl font-medium text-text-primary text-sm cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" /> Import Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} className="hidden" />
                    </label>
                    <Button onClick={() => handleOpenModal('CREATE')} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add User
                    </Button>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-green-500/10 border border-green-500/20 text-green-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border mb-6">
                {['STUDENT', 'FACULTY', 'ADMIN'].map(role => (
                    <button
                        key={role}
                        onClick={() => setActiveTab(role)}
                        className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                            activeTab === role 
                            ? 'border-accent text-accent bg-accent/5' 
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                        }`}
                    >
                        {role === 'FACULTY' ? 'Faculty' : role.charAt(0) + role.slice(1).toLowerCase() + 's'}
                    </button>
                ))}
            </div>

            {/* Content Based on Tab */}
            {activeTab === 'STUDENT' && (
                <div className="space-y-8">
                    {Object.keys(groupedStudents).length === 0 ? (
                        <div className="p-8 text-center text-text-secondary bg-surface/50 border border-border rounded-2xl">
                            No students found.
                        </div>
                    ) : (
                        Object.entries(groupedStudents).map(([batchName, batchUsers]) => (
                            <div key={batchName} className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 bg-surface border-b border-border flex justify-between items-center">
                                    <h3 className="font-bold text-text-primary">{batchName}</h3>
                                    <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-1 rounded-md">
                                        {batchUsers.length} Students
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="p-4 text-sm font-medium text-text-secondary">Name</th>
                                                <th className="p-4 text-sm font-medium text-text-secondary">Email</th>
                                                <th className="p-4 text-sm font-medium text-text-secondary">Joined</th>
                                                <th className="p-4 text-sm font-medium text-text-secondary text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batchUsers.map(user => (
                                                <tr key={user.id} className="border-b border-border/50 hover:bg-surface/80">
                                                    <td className="p-4 text-sm text-text-primary font-medium">{user.fullName}</td>
                                                    <td className="p-4 text-sm text-text-secondary">{user.email}</td>
                                                    <td className="p-4 text-sm text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-4 text-sm">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleOpenModal('EDIT', user)} className="p-1.5 text-text-secondary hover:text-accent transition-colors">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-text-secondary hover:text-red-500 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'FACULTY' && (
                <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface border-b border-border">
                                    <th className="p-4 text-sm font-medium text-text-secondary">Name</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary">Email</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary">Department</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary">Designation</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary">Joined</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeUsers.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-text-secondary">No faculty found.</td></tr>
                                ) : (
                                    activeUsers.map(user => (
                                        <tr key={user.id} className="border-b border-border/50 hover:bg-surface/80">
                                            <td className="p-4 text-sm text-text-primary font-medium">{user.fullName}</td>
                                            <td className="p-4 text-sm text-text-secondary">{user.email}</td>
                                            <td className="p-4 text-sm text-text-secondary">{user.facultyProfile?.department || '-'}</td>
                                            <td className="p-4 text-sm text-text-secondary">{user.facultyProfile?.designation || '-'}</td>
                                            <td className="p-4 text-sm text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenModal('EDIT', user)} className="p-1.5 text-text-secondary hover:text-accent transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-text-secondary hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'ADMIN' && (
                <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface border-b border-border">
                                    <th className="p-4 text-sm font-medium text-text-secondary">Name</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary">Email</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary">Department</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary">Joined</th>
                                    <th className="p-4 text-sm font-medium text-text-secondary text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeUsers.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-text-secondary">No admins found.</td></tr>
                                ) : (
                                    activeUsers.map(user => (
                                        <tr key={user.id} className="border-b border-border/50 hover:bg-surface/80">
                                            <td className="p-4 text-sm text-text-primary font-medium">{user.fullName}</td>
                                            <td className="p-4 text-sm text-text-secondary">{user.email}</td>
                                            <td className="p-4 text-sm text-text-secondary">{user.adminProfile?.department || '-'}</td>
                                            <td className="p-4 text-sm text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenModal('EDIT', user)} className="p-1.5 text-text-secondary hover:text-accent transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-text-secondary hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-text-primary">{modalMode === 'CREATE' ? 'Add New User' : 'Edit User'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                                <input 
                                    type="text" required
                                    value={currentUser.fullName}
                                    onChange={(e) => setCurrentUser({...currentUser, fullName: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                <input 
                                    type="email" required
                                    value={currentUser.email}
                                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                                <select 
                                    value={currentUser.role}
                                    onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                    disabled={modalMode === 'EDIT'} // Prevent changing role of existing users safely
                                >
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="FACULTY">FACULTY</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="INDUSTRY">INDUSTRY</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Password {modalMode === 'EDIT' && <span className="text-xs font-normal opacity-70">(Leave blank to keep unchanged)</span>}
                                </label>
                                <input 
                                    type="password" 
                                    required={modalMode === 'CREATE'}
                                    value={currentUser.password}
                                    onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Save User</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
