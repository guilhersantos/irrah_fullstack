import './styles/index.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthContainer from './components/AuthContainer'
import NotFound from './pages/NotFound'
import AdminMessages from './pages/AdminMessages'
import AdminLogin from './pages/AdminLogin'
import AdminRegister from './pages/AdminRegister'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <Router>
      <div className="app">
        <div className="main-container">
          <Routes>
            <Route path="/" element={<AuthContainer />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin" element={<AdminDashboard onLogout={() => window.location.href = '/'} />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
