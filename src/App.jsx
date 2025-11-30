import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import { storage } from './services/hybridStorage';

// Placeholder pages
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import DailyLogs from './pages/DailyLogs';
import AddLog from './pages/AddLog';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import Playbook from './pages/Playbook';
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    storage.syncFromFirestore();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/new" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="logs" element={<DailyLogs />} />
          <Route path="logs/new" element={<AddLog />} />
          <Route path="logs/edit/:id" element={<AddLog />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="reports" element={<Reports />} />
          <Route path="playbook" element={<Playbook />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
