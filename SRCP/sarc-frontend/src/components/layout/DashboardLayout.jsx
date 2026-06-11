import React, { useState } from 'react';
import { LayoutDashboard, Compass, Send, Users, Flag, User, Bell, Search, Menu, X } from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
    const links = [
        { name: 'Dashboard', icon: LayoutDashboard, active: true },
        { name: 'Browse Projects', icon: Compass },
        { name: 'My Applications', icon: Send },
        { name: 'Team Formation', icon: Users },
        { name: 'Milestones', icon: Flag },
        { name: 'Profile', icon: User },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-primary/10">
                    <a href="/" className="text-xl font-bold font-heading text-primary flex items-center gap-2">
                        <img
                            src="/images/SRCP_logo.png"
                            alt="SRCP Logo"
                            className="h-10 w-auto object-contain mix-blend-multiply drop-shadow-sm"
                        />
                        SATHYABAMA
                    </a>
                    <button className="lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Student Portal</p>
                    <nav className="space-y-1">
                        {links.map((link) => (
                            <a
                                key={link.name}
                                href="#"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${link.active
                                    ? 'bg-primary/5 text-primary border-r-4 border-r-primary'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <link.icon size={18} className={link.active ? 'text-primary' : 'text-slate-400'} />
                                {link.name}
                            </a>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-canvas flex font-body">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className="flex-1 lg:ml-64 min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-slate-400 hover:text-slate-600"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden sm:flex relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search Sathyabama projects..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-secondary font-bold text-sm border border-secondary/50 shadow-sm cursor-pointer hover:bg-primary-dark transition-colors">
                            JD
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
