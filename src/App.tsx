import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sprout, 
  FileText, 
  Database,
  Package,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './store';
import Dashboard from './components/Dashboard';
import Farmers from './components/Farmers';
import MasterData from './components/MasterData';
import SeedDistributions from './components/SeedDistributions';
import FertilizerDistributions from './components/FertilizerDistributions';
import Reports from './components/Reports';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'farmers' | 'master' | 'seeds' | 'fertilizers' | 'reports'>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const store = useStore();

  useEffect(() => {
    if (!store.isLoggedIn && !['dashboard', 'reports'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [store.isLoggedIn, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'AdminAK123$') {
      store.setIsLoggedIn(true);
      setShowLoginModal(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Password salah!');
    }
  };

  const handleLogout = () => {
    store.setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-[#1A1A1A]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E9ECEF] flex flex-col sticky top-0 h-screen print:hidden">
        <div className="p-6 border-bottom border-[#E9ECEF]">
          <div className="flex items-center gap-3 text-[#2D6A4F]">
            <Sprout size={32} />
            <h1 className="font-bold text-xl tracking-tight">AgriMonitor</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Beranda" />
          {store.isLoggedIn && (
            <>
              <NavItem active={activeTab === 'master'} onClick={() => setActiveTab('master')} icon={<Database size={20} />} label="Data Master" />
              <NavItem active={activeTab === 'farmers'} onClick={() => setActiveTab('farmers')} icon={<Users size={20} />} label="Data Petani" />
              <NavItem active={activeTab === 'seeds'} onClick={() => setActiveTab('seeds')} icon={<Sprout size={20} />} label="Distribusi Benih" />
              <NavItem active={activeTab === 'fertilizers'} onClick={() => setActiveTab('fertilizers')} icon={<Package size={20} />} label="Distribusi Pupuk" />
            </>
          )}
          <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={20} />} label="Laporan" />
        </nav>

        <div className="p-4 border-t border-[#E9ECEF] space-y-4">
          {store.isLoggedIn ? (
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 w-full p-2 rounded-lg transition-colors font-medium">
              <Unlock size={18} /> Logout Admin
            </button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="flex items-center justify-center gap-2 text-[#2D6A4F] hover:bg-emerald-50 w-full p-2 rounded-lg transition-colors font-medium">
              <Lock size={18} /> Login Admin
            </button>
          )}
          <p className="text-xs text-center text-[#6C757D] font-medium uppercase tracking-wider">Sistem Monitoring Jagung</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-[#E9ECEF] p-6 sticky top-0 z-10 print:hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#212529]">
              {activeTab === 'dashboard' && 'Ringkasan Sistem'}
              {activeTab === 'master' && 'Manajemen Data Master'}
              {activeTab === 'farmers' && 'Manajemen Petani'}
              {activeTab === 'seeds' && 'Distribusi Benih'}
              {activeTab === 'fertilizers' && 'Distribusi Pupuk'}
              {activeTab === 'reports' && 'Laporan Distribusi'}
            </h2>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {activeTab === 'dashboard' && <Dashboard farmers={store.farmers} seeds={store.seeds} fertilizers={store.fertilizers} seedDistributions={store.seedDistributions} fertilizerDistributions={store.fertilizerDistributions} />}
            {activeTab === 'master' && store.isLoggedIn && <MasterData seeds={store.seeds} setSeeds={store.setSeeds} fertilizers={store.fertilizers} setFertilizers={store.setFertilizers} />}
            {activeTab === 'farmers' && store.isLoggedIn && <Farmers farmers={store.farmers} setFarmers={store.setFarmers} />}
            {activeTab === 'seeds' && store.isLoggedIn && <SeedDistributions farmers={store.farmers} seeds={store.seeds} distributions={store.seedDistributions} setDistributions={store.setSeedDistributions} />}
            {activeTab === 'fertilizers' && store.isLoggedIn && <FertilizerDistributions farmers={store.farmers} seeds={store.seeds} fertilizers={store.fertilizers} seedDistributions={store.seedDistributions} fertilizerDistributions={store.fertilizerDistributions} setFertilizerDistributions={store.setFertilizerDistributions} />}
            {activeTab === 'reports' && <Reports farmers={store.farmers} seeds={store.seeds} fertilizers={store.fertilizers} seedDistributions={store.seedDistributions} fertilizerDistributions={store.fertilizerDistributions} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529] flex items-center gap-2"><Lock size={20} /> Login Admin</h3>
              <button onClick={() => { setShowLoginModal(false); setLoginError(''); setPassword(''); }} className="text-[#6C757D] hover:text-[#212529]">✕</button>
            </div>
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  className="w-full px-4 py-2 border rounded-lg" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Masukkan password..."
                />
                {loginError && <p className="text-red-500 text-sm mt-1">{loginError}</p>}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowLoginModal(false); setLoginError(''); setPassword(''); }} className="px-6 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg font-bold hover:bg-[#F8F9FA]">Batal</button>
                <button type="submit" className="px-6 py-2 bg-[#2D6A4F] text-white rounded-lg font-bold hover:bg-[#1B4332]">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-[#2D6A4F] text-white shadow-md' 
          : 'text-[#495057] hover:bg-[#F8F9FA] hover:text-[#212529]'
      }`}
    >
      <div className="flex items-center gap-3 font-medium">
        {icon}
        {label}
      </div>
      {active && <ChevronRight size={16} className="opacity-70" />}
    </button>
  );
}
