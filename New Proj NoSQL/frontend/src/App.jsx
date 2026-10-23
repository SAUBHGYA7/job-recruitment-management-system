import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layouts/AppLayout';

// Auth Pages
import LoginPage from './pages/Login/LoginPage';

// User Actor Pages
import UserDashboard from './pages/user/UserDashboard';
import CandidatesPage from './pages/user/CandidatesPage';
import JobsPage from './pages/user/JobsPage';
import ApplicationsPage from './pages/user/ApplicationsPage';
import InterviewsPage from './pages/user/InterviewsPage';
import EmployersPage from './pages/user/EmployersPage';
import SkillsPage from './pages/user/SkillsPage';
import UserReportsPage from './pages/user/UserReportsPage';

// Designer Actor Pages
import DesignerDashboard from './pages/designer/DesignerDashboard';
import TablesPage from './pages/designer/TablesPage';
import TableDetailPage from './pages/designer/TableDetailPage';
import ColumnsPage from './pages/designer/ColumnsPage';
import PrimaryKeysPage from './pages/designer/PrimaryKeysPage';
import ForeignKeysPage from './pages/designer/ForeignKeysPage';
import ConstraintsPage from './pages/designer/ConstraintsPage';
import RelationshipsPage from './pages/designer/RelationshipsPage';
import SchemaOverviewPage from './pages/designer/SchemaOverviewPage';
import DesignerReportsPage from './pages/designer/DesignerReportsPage';

// DBA Actor Pages
import DbaDashboard from './pages/dba/DbaDashboard';
import SqlQueryPage from './pages/dba/SqlQueryPage';
import DbaTablesPage from './pages/dba/DbaTablesPage';
import DatabaseObjectsPage from './pages/dba/DatabaseObjectsPage';
import UsersRolesPage from './pages/dba/UsersRolesPage';
import IndexesPage from './pages/dba/IndexesPage';
import ConstraintsHealthPage from './pages/dba/ConstraintsHealthPage';
import DatabaseStatsPage from './pages/dba/DatabaseStatsPage';
import ActivityAuditPage from './pages/dba/ActivityAuditPage';
import MaintenancePage from './pages/dba/MaintenancePage';

// Route Guard by Role
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">Authenticating user...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'DBA') return <Navigate to="/dba/dashboard" replace />;
    if (user.role === 'DATABASE_DESIGNER') return <Navigate to="/designer/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
}

function RoleRootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'DBA') return <Navigate to="/dba/dashboard" replace />;
  if (user.role === 'DATABASE_DESIGNER') return <Navigate to="/designer/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RoleRootRedirect />} />

            {/* Authenticated Layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* User Actor Routes */}
              <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><UserDashboard /></ProtectedRoute>} />
              <Route path="/user/candidates" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><CandidatesPage /></ProtectedRoute>} />
              <Route path="/user/jobs" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><JobsPage /></ProtectedRoute>} />
              <Route path="/user/applications" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><ApplicationsPage /></ProtectedRoute>} />
              <Route path="/user/interviews" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><InterviewsPage /></ProtectedRoute>} />
              <Route path="/user/employers" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><EmployersPage /></ProtectedRoute>} />
              <Route path="/user/skills" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><SkillsPage /></ProtectedRoute>} />
              <Route path="/user/reports" element={<ProtectedRoute allowedRoles={['USER', 'DATABASE_DESIGNER', 'DBA']}><UserReportsPage /></ProtectedRoute>} />

              {/* Database Designer Routes */}
              <Route path="/designer/dashboard" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><DesignerDashboard /></ProtectedRoute>} />
              <Route path="/designer/tables" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><TablesPage /></ProtectedRoute>} />
              <Route path="/designer/tables/:tableName" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><TableDetailPage /></ProtectedRoute>} />
              <Route path="/designer/columns" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><ColumnsPage /></ProtectedRoute>} />
              <Route path="/designer/primary-keys" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><PrimaryKeysPage /></ProtectedRoute>} />
              <Route path="/designer/foreign-keys" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><ForeignKeysPage /></ProtectedRoute>} />
              <Route path="/designer/constraints" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><ConstraintsPage /></ProtectedRoute>} />
              <Route path="/designer/relationships" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><RelationshipsPage /></ProtectedRoute>} />
              <Route path="/designer/normalization" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><SchemaOverviewPage /></ProtectedRoute>} />
              <Route path="/designer/reports" element={<ProtectedRoute allowedRoles={['DATABASE_DESIGNER', 'DBA']}><DesignerReportsPage /></ProtectedRoute>} />

              {/* DBA Routes (Strictly DBA Only) */}
              <Route path="/dba/dashboard" element={<ProtectedRoute allowedRoles={['DBA']}><DbaDashboard /></ProtectedRoute>} />
              <Route path="/dba/sql-query" element={<ProtectedRoute allowedRoles={['DBA']}><SqlQueryPage /></ProtectedRoute>} />
              <Route path="/dba/tables" element={<ProtectedRoute allowedRoles={['DBA']}><DbaTablesPage /></ProtectedRoute>} />
              <Route path="/dba/objects" element={<ProtectedRoute allowedRoles={['DBA']}><DatabaseObjectsPage /></ProtectedRoute>} />
              <Route path="/dba/users" element={<ProtectedRoute allowedRoles={['DBA']}><UsersRolesPage /></ProtectedRoute>} />
              <Route path="/dba/indexes" element={<ProtectedRoute allowedRoles={['DBA']}><IndexesPage /></ProtectedRoute>} />
              <Route path="/dba/constraints-health" element={<ProtectedRoute allowedRoles={['DBA']}><ConstraintsHealthPage /></ProtectedRoute>} />
              <Route path="/dba/statistics" element={<ProtectedRoute allowedRoles={['DBA']}><DatabaseStatsPage /></ProtectedRoute>} />
              <Route path="/dba/audit-log" element={<ProtectedRoute allowedRoles={['DBA']}><ActivityAuditPage /></ProtectedRoute>} />
              <Route path="/dba/maintenance" element={<ProtectedRoute allowedRoles={['DBA']}><MaintenancePage /></ProtectedRoute>} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
