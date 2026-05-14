import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, ProtectedRoute, RoleGuard } from './lib/auth';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import VehicleList from './pages/vehicles/VehicleList';
import ServiceJobList from './pages/serviceJobs/ServiceJobList';
import ServiceJobDetail from './pages/serviceJobs/ServiceJobDetail';
import InventoryList from './pages/inventory/InventoryList';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import Reports from './pages/reports/Reports';
import UserList from './pages/users/UserList';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/service-jobs" element={<ServiceJobList />} />
        <Route path="/service-jobs/:id" element={<ServiceJobDetail />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<UserList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
