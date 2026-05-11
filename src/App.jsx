import { useState } from 'react';
import {
  LayoutDashboard, ClipboardList, School,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [dashKey, setDashKey] = useState(0);

  const goToDashboard = () => {
    setDashKey(k => k + 1); // force Dashboard remount → re-fetch
    setPage('dashboard');
  };

  return (
    <div className="min-h-screen relative pb-20 sm:pb-0">
      {/* ─── Floating Orbs (ลูกเว็บ) ─── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />

      {/* ─── Mobile Header (Mobile Only) ─── */}
      <header className="sm:hidden bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-indigo-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <School className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-extrabold text-indigo-900 leading-none">ระบบตรวจร่างกาย</span>
        </div>
      </header>

      {/* ─── Top Navbar (Desktop Only) ─── */}
      <nav className="hidden sm:block bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-indigo-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-indigo-800 leading-none block">ระบบตรวจร่างกาย</span>
              <span className="text-xs text-gray-400">Body Inspection System</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToDashboard}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${page === 'dashboard' ? 'tab-active' : 'tab-inactive'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setPage('entry')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${page === 'entry' ? 'tab-active' : 'tab-inactive'}`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>กรอกข้อมูล</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Pages ─── */}
      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {page === 'dashboard' && <Dashboard key={dashKey} />}
        {page === 'entry'     && <Entry onDone={goToDashboard} />}
      </main>

      {/* ─── Bottom Navigation (Mobile Only) ─── */}
      <nav className="sm:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 z-50 flex justify-around shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <button 
          onClick={goToDashboard} 
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all ${page === 'dashboard' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-full ${page === 'dashboard' ? 'bg-indigo-50' : ''}`}>
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold">แดชบอร์ด</span>
        </button>
        <button 
          onClick={() => setPage('entry')} 
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all ${page === 'entry' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1.5 rounded-full ${page === 'entry' ? 'bg-indigo-50' : ''}`}>
            <ClipboardList className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold">ให้คะแนน</span>
        </button>
      </nav>
    </div>
  );
}
