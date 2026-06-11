import React, { useState } from 'react';
import LandingPage from './pages/public/LandingPage';
import AuthPage from './pages/public/AuthPage';
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProjectDetail from './pages/shared/ProjectDetail';

function App() {
    // Simple state routing for the prototype
    const [currentRoute, setCurrentRoute] = useState('auth');

    return (
        <div className="min-h-screen relative bg-canvas">
            {/* Route Switcher strictly for prototyping/demo purposes */}
            <div className="fixed bottom-4 right-4 z-[9999] bg-white p-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 flex flex-wrap gap-2 max-w-[500px] justify-end backdrop-blur-md bg-white/90">
                <button
                    onClick={() => setCurrentRoute('landing')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${currentRoute === 'landing' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    1. Landing
                </button>
                <button
                    onClick={() => setCurrentRoute('auth')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${currentRoute === 'auth' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    2. Auth (Roles)
                </button>
                <button
                    onClick={() => setCurrentRoute('student')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${currentRoute === 'student' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    3. Student Dash
                </button>
                <button
                    onClick={() => setCurrentRoute('faculty')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${currentRoute === 'faculty' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    4. Faculty Dash
                </button>
                <button
                    onClick={() => setCurrentRoute('admin')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${currentRoute === 'admin' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    5. Admin Dash
                </button>
                <button
                    onClick={() => setCurrentRoute('project')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${currentRoute === 'project' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    6. Project Detail
                </button>
            </div>

            {currentRoute === 'landing' && <LandingPage />}
            {currentRoute === 'auth' && <AuthPage />}
            {currentRoute === 'student' && <StudentDashboard />}
            {currentRoute === 'faculty' && <FacultyDashboard />}
            {currentRoute === 'admin' && <AdminDashboard />}
            {currentRoute === 'project' && <ProjectDetail />}
        </div>
    );
}

export default App;
