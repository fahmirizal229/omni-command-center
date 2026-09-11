import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useWebSocket } from './context/WebSocketContext';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChangePasswordModal } from './components/ChangePasswordModal';

import { LoginView } from './views/LoginView';
import { OverviewView } from './views/OverviewView';
import { TasksView } from './views/TasksView';
import { JobsView } from './views/JobsView';
import { SecondBrainView } from './views/SecondBrainView';
import { WeatherView } from './views/WeatherView';
import { ZeppView } from './views/ZeppView';
import { SchedulesView } from './views/SchedulesView';
import { StorageView } from './views/StorageView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { addListener, wsStatus } = useWebSocket();

  const [activeTab, setActiveTab] = useState(() => {
    return window.location.hash.replace('#', '') || 'overview';
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data Stores
  const [overviewData, setOverviewData] = useState(null);
  const [tasksData, setTasksData] = useState(null);
  const [jobsData, setJobsData] = useState(null);
  const [brainData, setBrainData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [zeppData, setZeppData] = useState(null);
  const [schedulesData, setSchedulesData] = useState(null);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [overview, tasks, jobs, brain, weather, zepp, schedules] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getTasks().catch(() => null),
        api.getJobs().catch(() => null),
        api.getSecondBrain().catch(() => null),
        api.getWeather().catch(() => null),
        api.getZepp().catch(() => null),
        api.getSchedules().catch(() => null),
      ]);

      if (overview) setOverviewData(overview);
      if (tasks) setTasksData(tasks);
      if (jobs) setJobsData(jobs);
      if (brain) setBrainData(brain);
      if (weather) setWeatherData(weather);
      if (zepp) setZeppData(zepp);
      if (schedules) setSchedulesData(schedules);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  // Initial fetch on Auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // WebSocket Live Realtime Event Subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Live telemetry streaming every 2s (CPU, RAM, Disk, Uptime, Network)
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
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0d11] text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d11] text-zinc-100 selection:bg-zinc-700 selection:text-white">
      <Navbar
        onRefresh={() => fetchAllData(false)}
        refreshing={refreshing}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 px-4 lg:px-8 py-6 pb-20 sm:pb-8 max-w-7xl w-full mx-auto">
        {activeTab === 'overview' && (
          <OverviewView overview={overviewData} onNavigate={handleTabChange} />
        )}
        {activeTab === 'storage' && (
          <StorageView />
        )}
        {activeTab === 'tasks' && (
          <TasksView tasksData={tasksData} onRefresh={() => fetchAllData(true)} />
        )}
        {activeTab === 'jobs' && (
          <JobsView jobsData={jobsData} onRefresh={() => fetchAllData(true)} />
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
      </main>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
