import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge, StatWidget } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { BookOpen, Users, BellRing, UserPlus, CheckCircle, FileText } from 'lucide-react';

const FacultyDashboard = () => {
    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-primary/10 pb-6">
                <div>
                    <Badge text="Faculty Portal" />
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Faculty Workspace</h1>
                    <p className="text-slate-600 mt-2 text-lg">Manage your active Sathyabama research projects and evaluate applicants.</p>
                </div>
                <Button variant="gradient" className="gap-2 shadow-md"><BookOpen size={18} /> Post New Project</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatWidget title="Total Open Projects" value="3" icon={BookOpen} trend={0} />
                <StatWidget title="Pending Applications" value="12" icon={BellRing} trend={5} />
                <StatWidget title="Approved Teams" value="2" icon={Users} trend={2} />
            </div>

            {/* Active Projects Table */}
            <Card className="mb-8 overflow-hidden p-0 border-t-4 border-t-secondary shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-canvas/30">
                    <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-3">
                        <CheckCircle size={24} className="text-primary" /> Active Research Projects
                    </h2>
                    <Button variant="ghost" size="sm" className="text-primary font-bold">View All Projects</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Project Title</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Required Skills</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Applicants</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 pb-2">
                            <tr className="hover:bg-primary/5 transition-colors">
                                <td className="py-5 px-6 text-sm font-bold font-heading text-slate-800">Machine Learning for Early Cancer Detection</td>
                                <td className="py-5 px-6 text-sm text-slate-600">
                                    <div className="flex gap-1.5 flex-wrap"><Badge color="blue">Python</Badge><Badge color="blue">PyTorch</Badge></div>
                                </td>
                                <td className="py-5 px-6 text-sm text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-slate-400" />
                                        <span className="bg-primary/10 text-primary py-1 px-2.5 rounded shadow-sm font-bold border border-primary/20">8</span>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-secondary/20 text-primary-dark border-secondary">Recruiting</span>
                                </td>
                                <td className="py-5 px-6 text-right">
                                    <Button variant="ghost" size="sm" className="font-bold">Manage</Button>
                                </td>
                            </tr>
                            <tr className="hover:bg-primary/5 transition-colors">
                                <td className="py-5 px-6 text-sm font-bold font-heading text-slate-800">Advanced Networking Architecture Simulation</td>
                                <td className="py-5 px-6 text-sm text-slate-600">
                                    <div className="flex gap-1.5 flex-wrap"><Badge color="blue">C++</Badge><Badge color="blue">Cisco</Badge></div>
                                </td>
                                <td className="py-5 px-6 text-sm text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-slate-400" />
                                        <span className="bg-primary/10 text-primary py-1 px-2.5 rounded shadow-sm font-bold border border-primary/20">4</span>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-secondary/20 text-primary-dark border-secondary">Recruiting</span>
                                </td>
                                <td className="py-5 px-6 text-right">
                                    <Button variant="ghost" size="sm" className="font-bold">Manage</Button>
                                </td>
                            </tr>
                            <tr className="hover:bg-primary/5 transition-colors">
                                <td className="py-5 px-6 text-sm font-bold font-heading text-slate-800">Evaluating Edge Cases in Autonomous Systems</td>
                                <td className="py-5 px-6 text-sm text-slate-600">
                                    <div className="flex gap-1.5 flex-wrap"><Badge color="blue">ROS</Badge><Badge color="blue">Computer Vision</Badge></div>
                                </td>
                                <td className="py-5 px-6 text-sm text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-slate-400" />
                                        <span className="bg-slate-100 text-slate-600 py-1 px-2.5 rounded shadow-sm font-bold border border-slate-200">0</span>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">Draft</span>
                                </td>
                                <td className="py-5 px-6 text-right">
                                    <Button variant="ghost" size="sm" className="font-bold">Edit</Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Recent Applications Sidebar/Widget block */}
            <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3 mt-10">
                <UserPlus size={24} className="text-purple-600" /> Candidate Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { name: "Alice Smith", match: "94", proj: "ML Cancer Detection" },
                    { name: "Bob Johnson", match: "89", proj: "Networking Architecture" },
                    { name: "Charlie Delta", match: "85", proj: "ML Cancer Detection" },
                    { name: "Diana Prince", match: "76", proj: "Networking Architecture" },
                ].map((student, i) => (
                    <Card key={i} className="flex flex-col hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold font-heading text-primary text-sm">
                                {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold shadow-sm">
                                {student.match}% Match
                            </span>
                        </div>
                        <h4 className="font-bold font-heading text-slate-800 text-base">{student.name}</h4>
                        <p className="text-sm text-slate-500 mt-1 mb-6 line-clamp-2">Applied: <span className="font-medium text-slate-700">{student.proj}</span></p>
                        <div className="mt-auto grid grid-cols-2 gap-3">
                            <Button variant="outline" size="sm" className="w-full text-xs py-2 font-bold">Reject</Button>
                            <Button variant="primary" size="sm" className="w-full text-xs py-2 font-bold shadow-sm">Review</Button>
                        </div>
                    </Card>
                ))}
            </div>

        </DashboardLayout>
    );
};

export default FacultyDashboard;
