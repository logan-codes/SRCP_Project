import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, Send, Users, Flag, User, Bell, Search, Menu, X, LogOut, Settings, Building, Check } from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen, userData }) => {
    const location = useLocation();

    const role = userData?.role?.toLowerCase() || 'student';
    const basePath = role;

    let menuSections = [];

    if (role === 'faculty') {
        menuSections = [
            {
                title: 'Main Menu',
                links: [
                    { name: 'Dashboard', icon: LayoutDashboard, path: `/${basePath}` },
                    { name: 'Browse Projects', icon: Compass, path: `/${basePath}/projects` },
                    { name: 'Student Applications', icon: Send, path: `/${basePath}/applications` },
                    { name: 'Team Formation', icon: Users, path: `/${basePath}/teams` },
                    { name: 'Milestones', icon: Flag, path: `/${basePath}/milestones` },
                    { name: 'Profile', icon: User, path: `/${basePath}/profile` },
                ]
            },
            {
                title: 'Guide Selection',
                links: [
                    { name: 'Guide Dashboard', icon: LayoutDashboard, path: '/guide/dashboard' },
                    { name: 'Select Project Teams', icon: Users, path: '/guide/faculty/select' },
                    { name: 'My Selected Teams', icon: Flag, path: '/guide/faculty/my-picks' },
                ]
            }
        ];
    } else if (role === 'admin') {
        menuSections = [
            {
                title: 'Admin Controls',
                links: [
                    { name: 'Dashboard', icon: LayoutDashboard, path: `/${basePath}` },
                    { name: 'User Management', icon: Users, path: '/admin/users' },
                    { name: 'Team Finalization', icon: Check, path: '/admin/teams/finalize' },
                    { name: 'Profile', icon: User, path: `/${basePath}/profile` },
                ]
            },
            {
                title: 'Guide Config',
                links: [
                    { name: 'Guide Dashboard', icon: LayoutDashboard, path: '/guide/dashboard' },
                    { name: 'Guide Config', icon: Settings, path: '/admin/guide/config' },
                ]
            }
        ];
    } else {
        // Student role
        menuSections = [
            {
                title: 'Main Menu',
                links: [
                    { name: 'Dashboard', icon: LayoutDashboard, path: `/${basePath}` },
                    { name: 'Browse Projects', icon: Compass, path: `/${basePath}/projects` },
                    { name: 'My Applications', icon: Send, path: `/${basePath}/applications` },
                    { name: 'Team Formation', icon: Users, path: `/${basePath}/teams` },
                    { name: 'Milestones', icon: Flag, path: `/${basePath}/milestones` },
                    { name: 'Faculty Directory', icon: Building, path: `/${basePath}/directory` },
                    { name: 'Profile', icon: User, path: `/${basePath}/profile` },
                ]
            },
            {
                title: 'Guide Selection',
                links: [
                    { name: 'Guide Dashboard', icon: LayoutDashboard, path: '/guide/dashboard' },
                    { name: 'Project Team', icon: Users, path: '/guide/team/my' },
                    { name: 'Team Invites', icon: Bell, path: '/guide/invites/team' },
                    { name: 'Select Guide', icon: User, path: '/guide/select' },
                    { name: 'Guide Invites', icon: Bell, path: '/guide/invites' },
                ]
            }
        ];
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-primary/10">
                    <Link to="/" className="text-xl font-bold font-heading text-primary flex items-center gap-2">
                        <img
                            src="/images/SRCP_logo.png"
                            alt="SRCP Logo"
                            className="h-10 w-auto object-contain mix-blend-multiply drop-shadow-sm"
                        />
                        SATHYABAMA
                    </Link>
                    <button className="lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
                    {menuSections.map((section, idx) => (
                        <div key={section.title} className={idx > 0 ? "mt-6" : ""}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                                {section.title}
                            </p>
                            <nav className="space-y-1">
                                {section.links.map((link) => {
                                    const isActive = location.pathname === link.path || (link.path === `/${basePath}` && location.pathname === `/${basePath}`);
                                    return (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive
                                                ? 'bg-primary/5 text-primary border-r-4 border-r-primary'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <link.icon size={18} className={isActive ? 'text-primary' : 'text-slate-400'} />
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
};

export const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [userInitials, setUserInitials] = useState('U');
    const [notifications, setNotifications] = useState([]);
    
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            if (!token) return;
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Error fetching notifications", err);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                if (!token) return;

                const response = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.fullName) {
                        setUserData(data);
                        const nameParts = data.fullName.trim().split(' ');
                        let initials = '';
                        if (nameParts.length > 1) {
                            initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
                        } else if (nameParts.length === 1 && nameParts[0]) {
                            initials = nameParts[0].substring(0, 2);
                        }
                        setUserInitials(initials.toUpperCase());
                    }
                }
            } catch (err) {
                console.error("Error fetching user data", err);
            }
        };
        fetchUser();
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('sarc_token');
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Error marking notification as read", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sarc_token');
        window.location.href = '/login';
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-canvas flex font-body">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userData={userData} />

            <main className="flex-1 lg:ml-64 min-w-0">
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
                        <div className="relative" ref={notificationRef}>
                            <button 
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transform transition-all z-50">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{unreadCount} new</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                                                            <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                                                            <span className="text-[10px] text-slate-400 mt-2 block">
                                                                {new Date(notif.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {!notif.isRead && (
                                                            <button 
                                                                onClick={() => markAsRead(notif.id)}
                                                                className="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={profileRef}>
                            <div
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-secondary font-bold text-sm border border-secondary/50 shadow-sm cursor-pointer hover:bg-primary-dark transition-colors"
                                title="User Profile"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                {userInitials}
                            </div>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transform transition-all z-50">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                            {userData?.fullName || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            {userData?.email || 'Loading email...'}
                                        </p>
                                    </div>
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                            Role
                                        </div>
                                        <div className="px-3 py-2 text-sm text-slate-700 bg-slate-50 rounded-md mx-2 capitalize">
                                            {userData?.role?.toLowerCase() || 'Student'}
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <Link
                                            to={userData?.role === 'FACULTY' ? '/faculty/profile' : userData?.role === 'ADMIN' ? '/admin/profile' : '/student/profile'}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <Settings size={16} />
                                            Account Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                                        >
                                            <LogOut size={16} />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
