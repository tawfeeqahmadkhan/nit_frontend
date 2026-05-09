import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { BusinessProvider } from './context/BusinessContext'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import MyDashboard from './pages/MyDashboard'
import Dashboard from './pages/Dashboard'
import RegisterBusiness from './pages/RegisterBusiness'
import BusinessList from './pages/BusinessList'
import BusinessDetail from './pages/BusinessDetail'
import MatchList from './pages/MatchList'
import ExploreGraph from './pages/ExploreGraph'
import Messages from './pages/Messages'

export default function App() {
  return (
    <ToastProvider>
      <BusinessProvider>
        <BrowserRouter>
          <Routes>
            {/* Public — no sidebar */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/select" element={<Navigate to="/login" replace />} />

            {/* App — with sidebar layout */}
            <Route element={<Layout />}>
              <Route path="/my-dashboard" element={<MyDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/register" element={<RegisterBusiness />} />
              <Route path="/businesses" element={<BusinessList />} />
              <Route path="/businesses/:id" element={<BusinessDetail />} />
              <Route path="/matches" element={<MatchList />} />
              <Route path="/matches/new" element={<Navigate to="/register" replace />} />
              <Route path="/network" element={<ExploreGraph />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:matchId" element={<Messages />} />
              <Route path="/settings" element={<Dashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </BusinessProvider>
    </ToastProvider>
  )
}
