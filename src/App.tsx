/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Guestbook from './pages/Guestbook';
import Appointments from './pages/Appointments';
import PublicAppointment from './pages/PublicAppointment';
import Packages from './pages/Packages';
import TeacherSchedule from './pages/TeacherSchedule';
import UserManagement from './pages/UserManagement';
import AppointmentList from './pages/AppointmentList';
import Reports from './pages/Reports';
import VisitInput from './pages/VisitInput';
import PublicVisit from './pages/PublicVisit';
import StudentDispensation from './pages/StudentDispensation';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/public/appointment" element={<PublicAppointment />} />
          <Route path="/public/visit" element={<PublicVisit />} />
          
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="guestbook" element={<Guestbook />} />
            <Route path="visit-input" element={<VisitInput />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="appointment-list" element={<AppointmentList />} />
            <Route path="packages" element={<Packages />} />
            <Route path="teacher-schedule" element={<TeacherSchedule />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="student-dispensation" element={<StudentDispensation />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
