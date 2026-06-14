import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import AuthPage from './pages/public/AuthPage';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import VerifyEmail from './pages/public/VerifyEmail';
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProjectDetail from './pages/shared/ProjectDetail';
import Profile from './pages/shared/Profile';
import BrowseProjects from './pages/student/BrowseProjects';
import StudentApplications from './pages/student/StudentApplications';
import FacultyApplications from './pages/faculty/FacultyApplications';
import TeamFormation from './pages/shared/TeamFormation';
import Milestones from './pages/shared/Milestones';
import FacultyDirectory from './pages/shared/FacultyDirectory';
import FacultyProfileView from './pages/shared/FacultyProfileView';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Guide Selection Pages
import GuideTeamCreate from './pages/student/GuideTeamCreate';
import GuideTeamMy from './pages/student/GuideTeamMy';
import GuideInvites from './pages/student/GuideInvites';
import TeamInvites from './pages/student/TeamInvites';
import GuideSelect from './pages/student/GuideSelect';
import FacultyTeamSelect from './pages/faculty/FacultyTeamSelect';
import FacultyMyPicks from './pages/faculty/FacultyMyPicks';
import GuideAdminConfig from './pages/admin/GuideAdminConfig';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminTeamFinalization from './pages/admin/AdminTeamFinalization';
import AdminMilestonesConfig from './pages/admin/AdminMilestonesConfig';
import GuideDashboard from './pages/shared/GuideDashboard';

function App() {
    return (
        <div className="min-h-screen relative bg-canvas">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/projects" element={<BrowseProjects />} />
                <Route path="/faculty" element={<FacultyDashboard />} />
                <Route path="/faculty/projects" element={<BrowseProjects />} />
                <Route path="/admin" element={<AdminDashboard />} />

                {/* Shared authenticated routes */}
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/student/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="/faculty/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="/admin/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                
                {/* New Feature Routes (Student) */}
                <Route path="/student/applications" element={<StudentApplications />} />
                <Route path="/student/teams" element={<TeamFormation />} />
                <Route path="/student/milestones" element={<Milestones />} />
                <Route path="/student/directory" element={<FacultyDirectory />} />
                <Route path="/student/directory/:id" element={<FacultyProfileView />} />

                {/* New Feature Routes (Faculty) */}
                <Route path="/faculty/applications" element={<FacultyApplications />} />
                <Route path="/faculty/teams" element={<TeamFormation />} />
                <Route path="/faculty/milestones" element={<Milestones />} />

                {/* Guide Selection Routes */}
                <Route path="/guide/team/create" element={<DashboardLayout><GuideTeamCreate /></DashboardLayout>} />
                <Route path="/guide/team/my" element={<DashboardLayout><GuideTeamMy /></DashboardLayout>} />
                <Route path="/guide/invites" element={<DashboardLayout><GuideInvites /></DashboardLayout>} />
                <Route path="/guide/invites/team" element={<DashboardLayout><TeamInvites /></DashboardLayout>} />
                <Route path="/guide/select" element={<DashboardLayout><GuideSelect /></DashboardLayout>} />
                <Route path="/guide/faculty/select" element={<DashboardLayout><FacultyTeamSelect /></DashboardLayout>} />
                <Route path="/guide/faculty/my-picks" element={<DashboardLayout><FacultyMyPicks /></DashboardLayout>} />
                <Route path="/admin/guide/config" element={<DashboardLayout><GuideAdminConfig /></DashboardLayout>} />
                <Route path="/admin/users" element={<DashboardLayout><AdminUserManagement /></DashboardLayout>} />
                <Route path="/admin/teams/finalize" element={<DashboardLayout><AdminTeamFinalization /></DashboardLayout>} />
                <Route path="/admin/milestones/config" element={<DashboardLayout><AdminMilestonesConfig /></DashboardLayout>} />
                <Route path="/guide/dashboard" element={<DashboardLayout><GuideDashboard /></DashboardLayout>} />
            </Routes>
        </div>
    );
}

export default App;
