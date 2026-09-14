import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useWebSocket } from './context/WebSocketContext';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { LoginView } from './views/LoginView';
import { Loader2 } from 'lucide-react';

// Dynamic Code-Splitting / Lazy-Loaded Views
const OverviewView = lazy(() => import('./views/OverviewView').then(m => ({ default: m.OverviewView })));
const TasksView = lazy(() => import('./views/TasksView').then(m => ({ default: m.TasksView })));
const JobsView = lazy(() => import('./views/JobsView').then(m => ({ default: m.JobsView })));
const SecondBrainView = lazy(() => import('./views/SecondBrainView').then(m => ({ default: m.SecondBrainView })));
const WeatherView = lazy(() => import('./views/WeatherView').then(m => ({ default: m.WeatherView })));
const ZeppView = lazy(() => import('./views/ZeppView').then(m => ({ default: m.ZeppView })));
const SchedulesView = lazy(() => import('./views/SchedulesView').then(m => ({ default: m.SchedulesView })));
const StorageView = lazy(() => import('./views/StorageView').then(m => ({ default: m.StorageView })));
const ProfileEditorView = lazy(() => import('./views/ProfileEditorView').then(m => ({ default: m.ProfileEditorView })));
const SessionsView = lazy(() => import('./views/SessionsView').then(m => ({ default: m.SessionsView })));

function TabLoader() {
  return (
    <div className="p-16 flex flex-col items-center justify-center gap-3 text-zinc-500 font-mono text-xs">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      <span>Memuat halaman...</span>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  const { addListener, wsStatus } = useWebSocket();

  const [activeTab, setActiveTab] = useState(() => {
    return window.location.hash.replace('#', '') || 'overview';
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Per-Tab Data Stores (Loaded on-demand)
  const [overviewData, setOverviewData] = useState(null);
  const [tasksData, setTasksData] = useState(null);
  const [jobsData, setJobsData] = useState(null);
  const [brainData, setBrainData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [zeppData, setZeppData] = useState(null);
  const [schedulesData, setSchedulesData] = useState(null);

  // Fetch only the data needed for the current active tab
  const fetchTabData = useCallback(async (tab, silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      if (tab === 'overview') {
        const overview = await api.getOverview().catch(() => null);
        if (overview) setOverviewData(overview);
      } else if (tab === 'tasks') {
        const tasks = await api.getTasks().catch(() => null);
        if (tasks) setTasksData(tasks);
      } else if (tab === 'jobs') {
        const jobs = await api.getJobs().catch(() => null);
        if (jobs) setJobsData(jobs);
      } else if (tab === 'brain') {
        const brain = await api.getSecondBrain().catch(() => null);
        if (brain) setBrainData(brain);
      } else if (tab === 'weather') {
        const weather = await api.getWeather().catch(() => null);
        if (weather) setWeatherData(weather);
      } else if (tab === 'zepp') {
        const zepp = await api.getZepp().catch(() => null);
        if (zepp) setZeppData(zepp);
      } else if (tab === 'schedules') {
        const schedules = await api.getSchedules().catch(() => null);
        if (schedules) setSchedulesData(schedules);
      }
    } catch (err) {
      console.error(`Error loading data for tab ${tab}:`, err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  // Fetch data on initial auth or tab switch
  useEffect(() => {
    if (isAuthenticated) {
      fetchTabData(activeTab, false);
    }
  }, [isAuthenticated, activeTab, fetchTabData]);

  // WebSocket Live Realtime Event Subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Live telemetry streaming every 2s (CPU, RAM, Disk, Uptime, Fail2ban)
    const unsubTelemetry = addListener('telemetry', (msg) => {
      if (msg.system) {
        setOverviewData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            system: {
              ...prev.system,
              ...msg.system,
            },
          };
        });
      }
    });

    // 2. Realtime Tasks mutation broadcast (instant updates on create/update/delete)
    const unsubTasks = addListener('tasks_updated', () => {
      api.getTasks().then((res) => setTasksData(res)).catch(() => {});
      api.getOverview().then((res) => setOverviewData(res)).catch(() => {});
    });

    // 3. Realtime Jobs mutation broadcast
    const unsubJobs = addListener('jobs_updated', () => {
      api.getJobs().then((res) => setJobsData(res)).catch(() => {});
      api.getOverview().then((res) => setOverviewData(res)).catch(() => {});
    });

    // 4. Targeted payload updates
    const unsubOverviewData = addListener('overview_data', (msg) => {
      if (msg.data) setOverviewData(msg.data);
    });
    const unsubTasksData = addListener('tasks_data', (msg) => {
      if (msg.data) setTasksData(msg.data);
    });
    const unsubJobsData = addListener('jobs_data', (msg) => {
      if (msg.data) setJobsData(msg.data);
    });

    return () => {
      unsubTelemetry();
      unsubTasks();
      unsubJobs();
      unsubOverviewData();
      unsubTasksData();
      unsubJobsData();
    };
  }, [isAuthenticated, addListener]);

  // Sync tab with URL hash
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auto-refresh schedules in realtime when schedules tab is active
  useEffect(() => {
    if (isAuthenticated && activeTab === 'schedules') {
      const interval = setInterval(() => {
        api.getSchedules().then((res) => {
          if (res) setSchedulesData(res);
        }).catch(() => {});
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080e] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#07080e] text-zinc-100 selection:bg-indigo-500/30 selection:text-white antialiased">
      {/* Sleek Left Sidebar Navigation (Desktop Static & Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={() => fetchTabData(activeTab, false)}
        refreshing={refreshing}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenLogoutConfirm={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Full-Page View Container (Offset for Sidebar) */}
      <div className="md:pl-64 lg:pl-72 flex-1 min-h-screen flex flex-col transition-all duration-300">
        <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-16 md:pt-6 pb-12 max-w-[1780px] w-full mx-auto">
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'overview' && (
              <OverviewView overview={overviewData} onNavigate={handleTabChange} />
            )}
            {activeTab === 'profile' && (
              <ProfileEditorView />
            )}
            {activeTab === 'storage' && (
              <StorageView />
            )}
            {activeTab === 'tasks' && (
              <TasksView tasksData={tasksData} onRefresh={() => fetchTabData('tasks', true)} />
            )}
            {activeTab === 'jobs' && (
              <JobsView jobsData={jobsData} onRefresh={() => fetchTabData('jobs', true)} />
            )}
            {activeTab === 'brain' && (
              <SecondBrainView brainData={brainData} />
            )}
            {activeTab === 'weather' && (
              <WeatherView weatherData={weatherData} />
            )}
            {activeTab === 'zepp' && (
              <ZeppView zeppData={zeppData} />
            )}
            {activeTab === 'schedules' && (
              <SchedulesView schedulesData={schedulesData} />
            )}
            {activeTab === 'sessions' && (
              <SessionsView />
            )}
          </Suspense>
        </main>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Custom Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
}
