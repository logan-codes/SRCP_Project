import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge, StatWidget } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Briefcase, Clock, CheckCircle, AlertTriangle, ArrowRight, Send } from 'lucide-react';


const StudentDashboard = () => {
    const [deadlines, setDeadlines] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fire all requests concurrently
                const [resMe, resDeadlines] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/global-milestones`, { headers })
                ]);

                if (resDeadlines.ok) {
                    const dData = await resDeadlines.json();
                    const upcoming = dData.filter(d => d.status !== 'COMPLETED')
                                          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                                          .slice(0, 3);
                    setDeadlines(upcoming);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);


    const getMonthAndDay = (dateString) => {
        const d = new Date(dateString);
        return {
            month: d.toLocaleString('default', { month: 'short' }),
            day: d.getDate()
        };
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <Badge text="Class of 2026" />
                <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Student Dashboard</h1>
                <p className="text-slate-600 mt-2 text-lg">Welcome back. Here is your academic research and collaboration overview.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Guide Selection Info - Placeholder or future features */}
                <Card className="border-t-4 border-t-primary shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
                        <CheckCircle size={24} className="text-primary" /> Guide Selection Phase
                    </h2>
                    <div className="space-y-4">
                        <div className="text-center py-6 text-slate-500 text-sm">
                            Welcome to the Guide Selection Portal. Here you can form teams, invite members, and select a project guide. Use the sidebar to navigate to your team and guide selection options.
                        </div>
                    </div>
                </Card>

                {/* Upcoming Deadlines */}
                <Card className="border-t-4 border-t-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
                        <Clock size={24} className="text-red-500" /> Upcoming Deadlines
                    </h2>
                    <div className="space-y-4">
                        {deadlines.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-sm">No upcoming deadlines configured by the administration.</div>
                        ) : (
                            deadlines.map((deadline) => {
                                const { month, day } = getMonthAndDay(deadline.dueDate);
                                return (
                                    <div key={deadline.id} className="flex gap-4 p-4 border border-red-100 bg-red-50 rounded-xl hover:shadow-sm transition-shadow">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-red-100 text-center min-w-[70px] flex flex-col justify-center">
                                            <span className="block text-xs font-bold text-red-500 uppercase tracking-widest">{month}</span>
                                            <span className="block text-2xl font-black text-slate-900">{day}</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h4 className="font-bold text-slate-900 text-lg">{deadline.title}</h4>
                                            <p className="text-sm text-slate-600 mt-1 font-medium">{deadline.description}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
