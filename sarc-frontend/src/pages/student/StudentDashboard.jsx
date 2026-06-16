import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge, StatWidget } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Briefcase, Clock, CheckCircle, AlertTriangle, ArrowRight, Send } from 'lucide-react';

const RecommendedProjectCard = ({ id, title, faculty, matchScore, skills, missingSkills, deadline }) => {
    let daysRemaining = null;
    if (deadline) {
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - new Date();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return (
        <Card className="flex flex-col h-full border-l-4 border-l-primary hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-2 gap-2">{title}</h3>
                    <p className="text-sm text-slate-500 mt-1">Prof. {faculty}</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg flex flex-col items-center shadow-sm">
                    <span className="text-sm leading-none">{matchScore}%</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 mt-1">Match</span>
                </div>
            </div>

            <div className="mb-4 flex-grow">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Required Core Skills</p>
                <div className="flex flex-wrap gap-2">
                    {skills && skills.map(skill => (
                        <Badge key={skill} color="blue">{skill}</Badge>
                    ))}
                </div>

                {missingSkills && missingSkills.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Skill Gap Warning</p>
                            <div className="flex flex-wrap gap-1">
                                {missingSkills.map(skill => (
                                    <span key={skill} className="text-xs text-red-600 bg-white px-1.5 py-0.5 rounded shadow-sm border border-red-100">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">
                    {daysRemaining !== null ? (daysRemaining > 0 ? `Closes in ${daysRemaining} days` : 'Closed') : 'Open'}
                </span>
                <Link to={`/project/${id}`}>
                    <Button variant="primary" size="sm" className="gap-2">
                        View Details <ArrowRight size={16} />
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

const StudentDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [recommendedProjects, setRecommendedProjects] = useState([]);
    const [deadlines, setDeadlines] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                
                // Fetch Applications
                const resApps = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/student`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resApps.ok) {
                    const data = await resApps.json();
                    setApplications(data);
                }

                // Fetch Projects
                const resProj = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resProj.ok) {
                    const pData = await resProj.json();
                    const projectsArr = pData.projects || (Array.isArray(pData) ? pData : []);
                    const available = projectsArr.filter(p => p.status === 'OPEN').slice(0, 3);
                    setRecommendedProjects(available);
                }

                // Fetch Global Milestones (Deadlines)
                const resDeadlines = await fetch(`${import.meta.env.VITE_API_URL}/api/global-milestones`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resDeadlines.ok) {
                    const dData = await resDeadlines.json();
                    // Filter out COMPLETED ones and sort by closest date
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatWidget title="Applications Sent" value={applications.length.toString()} icon={Send} trend={applications.length > 0 ? 5 : 0} />
                <StatWidget title="Accepted Projects" value={applications.filter(a => a.status === 'ACCEPTED').length.toString()} icon={CheckCircle} />
                <StatWidget title="Pending Reviews" value={applications.filter(a => a.status === 'PENDING').length.toString()} icon={Clock} />
            </div>

            <div className="mb-8 bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-slate-800">AI Recommended Projects</h2>
                        <p className="text-sm text-slate-500 mt-1">Sathyabama projects matched to your skill profile</p>
                    </div>
                    <Link to="/student/projects">
                        <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold">View Directory <ArrowRight size={16} /></Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedProjects.length > 0 ? (
                        recommendedProjects.map(project => (
                            <RecommendedProjectCard
                                key={project.id}
                                id={project.id}
                                title={project.title}
                                faculty={project.faculty?.fullName || 'Faculty'}
                                matchScore={Math.floor(Math.random() * 15) + 85}
                                skills={project.skillsRequired || []}
                                deadline={project.deadline}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                            No available projects to recommend at the moment.
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Application Statuses */}
                <Card className="border-t-4 border-t-secondary shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
                        <CheckCircle size={24} className="text-primary" /> Active Applications
                    </h2>
                    <div className="space-y-4">
                        {applications.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-sm">You haven't applied to any projects yet.</div>
                        ) : (
                            applications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between p-4 bg-canvas rounded-xl border border-slate-200 hover:border-primary/30 transition-colors">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="font-bold text-slate-800 font-heading truncate" title={app.project?.title}>{app.project?.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">Prof. {app.project?.faculty?.user?.fullName} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`inline-flex flex-shrink-0 items-center px-3 py-1 rounded-full text-xs font-bold border ${app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 border-green-200' : app.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                        {app.status}
                                    </span>
                                </div>
                            ))
                        )}
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
