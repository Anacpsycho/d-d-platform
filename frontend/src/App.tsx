import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import PasswordReset from './pages/PasswordReset/PasswordReset';
import Dashboard from './pages/Dashboard/Dashboard';
import CharacterSheet from './pages/CharacterSheet/CharacterSheet';
import ActiveSession from './pages/Session/ActiveSession';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/common/Layout';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password-reset" element={<PasswordReset />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/character/:id" element={<CharacterSheet />} />
            <Route path="/session/:id" element={<ActiveSession />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Box>
  );
}

export default App;

// Made with Bob
