import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';
import ChangePassword from './pages/public/ChangePassword';
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
import ProtectedRoute from './components/auth/ProtectedRoute';
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
                <Route path="/login" element={<Login />} />

                <Route path="/change-password" element={<ChangePassword />} />

                <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
                <Route path="/student/projects" element={<ProtectedRoute allowedRoles={['STUDENT']}><BrowseProjects /></ProtectedRoute>} />
                <Route path="/faculty" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
                <Route path="/faculty/projects" element={<ProtectedRoute allowedRoles={['FACULTY']}><BrowseProjects /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={['ADMIN']}><BrowseProjects /></ProtectedRoute>} />
                {/* Shared authenticated routes */}
                <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
                <Route path="/faculty/profile" element={<ProtectedRoute allowedRoles={['FACULTY']}><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
                
                {/* New Feature Routes (Student) */}
                <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentApplications /></ProtectedRoute>} />
                <Route path="/student/teams" element={<ProtectedRoute allowedRoles={['STUDENT']}><TeamFormation /></ProtectedRoute>} />
                <Route path="/student/milestones" element={<ProtectedRoute allowedRoles={['STUDENT']}><Milestones /></ProtectedRoute>} />
                <Route path="/student/directory" element={<ProtectedRoute allowedRoles={['STUDENT']}><FacultyDirectory /></ProtectedRoute>} />
                <Route path="/student/directory/:id" element={<ProtectedRoute allowedRoles={['STUDENT']}><FacultyProfileView /></ProtectedRoute>} />

                {/* New Feature Routes (Faculty) */}
                <Route path="/faculty/applications" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyApplications /></ProtectedRoute>} />
                <Route path="/faculty/teams" element={<ProtectedRoute allowedRoles={['FACULTY']}><TeamFormation /></ProtectedRoute>} />
                <Route path="/faculty/milestones" element={<ProtectedRoute allowedRoles={['FACULTY']}><Milestones /></ProtectedRoute>} />

                {/* Guide Selection Routes */}
                <Route path="/guide/team/create" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><GuideTeamCreate /></DashboardLayout></ProtectedRoute>} />
                <Route path="/guide/team/my" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><GuideTeamMy /></DashboardLayout></ProtectedRoute>} />
                <Route path="/guide/invites" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><GuideInvites /></DashboardLayout></ProtectedRoute>} />
                <Route path="/guide/invites/team" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><TeamInvites /></DashboardLayout></ProtectedRoute>} />
                <Route path="/guide/select" element={<ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><GuideSelect /></DashboardLayout></ProtectedRoute>} />
                <Route path="/guide/faculty/select" element={<ProtectedRoute allowedRoles={['FACULTY']}><DashboardLayout><FacultyTeamSelect /></DashboardLayout></ProtectedRoute>} />
                <Route path="/guide/faculty/my-picks" element={<ProtectedRoute allowedRoles={['FACULTY']}><DashboardLayout><FacultyMyPicks /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/guide/config" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><GuideAdminConfig /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminUserManagement /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/teams/finalize" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminTeamFinalization /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/milestones/config" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminMilestonesConfig /></DashboardLayout></ProtectedRoute>} />
                <Route path="/guide/dashboard" element={<ProtectedRoute><DashboardLayout><GuideDashboard /></DashboardLayout></ProtectedRoute>} />
            </Routes>
        </div>
    );
}

export default App;
