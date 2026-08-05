import React, { useState } from 'react';
import { 
  X, Activity, Users, FileText, Wallet, ShieldCheck, ShieldAlert,
  CheckCircle, XCircle, MoreVertical, Search
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatDZD } from '../services/chargilyService';

export default function AdminDashboardModal({ isOpen, onClose }) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  // Mock Admin Data
  const stats = {
    creators: 1245,
    brands: 320,
    activeCampaigns: 48,
    txVolume: 4500000,
    revenue: 450000
  };

  const mockUsers = [
    { id: 1, name: 'أحمد ديزاد', role: 'creator', status: 'verified', joinDate: '2023-10-15' },
    { id: 2, name: 'متجر ستايل', role: 'brand', status: 'pending', joinDate: '2023-10-20' },
    { id: 3, name: 'ياسمين بيوتي', role: 'creator', status: 'verified', joinDate: '2023-11-01' },
  ];

  const mockCampaigns = [
    { id: 101, brand: 'متجر ستايل', budget: 50000, status: 'pending_review' },
    { id: 102, brand: 'وكالة تيك', budget: 120000, status: 'active' },
  ];

  const mockTx = [
    { id: 'TX-902', amount: 50000, method: 'Edahabia', status: 'escrow' },
    { id: 'TX-901', amount: 15000, method: 'CIB', status: 'released' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir={document.documentElement.dir}>
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-6xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">{t('adminDashboard')}</h2>
              <p className="text-xs text-slate-400">{t('adminOverview')} Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.open('/', '_blank')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-bold"
            >
              <Globe className="w-4 h-4 text-purple-400" />
              <span>{t('browseWebsite')}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-l border-white/5 bg-slate-900/30 p-4 flex flex-col gap-2 overflow-y-auto">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Activity className="w-5 h-5" /> {t('adminOverview')}
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'users' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" /> {t('adminUsers')}
            </button>
            <button 
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'campaigns' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" /> {t('adminCampaigns')}
            </button>
            <button 
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'financial' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Wallet className="w-5 h-5" /> {t('adminEscrow')}
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#080C14]">
            
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 tracking-wide">{t('adminOverview')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-6 border border-white/5">
                    <p className="text-sm text-slate-400 mb-2">{t('adminTotalCreators')}</p>
                    <p className="text-3xl font-black text-white">{stats.creators.toLocaleString()}</p>
                  </div>
                  <div className="glass-card p-6 border border-white/5">
                    <p className="text-sm text-slate-400 mb-2">{t('adminTotalBrands')}</p>
                    <p className="text-3xl font-black text-white">{stats.brands.toLocaleString()}</p>
                  </div>
                  <div className="glass-card p-6 border border-white/5">
                    <p className="text-sm text-slate-400 mb-2">{t('adminTotalTx')}</p>
                    <p className="text-3xl font-black text-blue-400">{formatDZD(stats.txVolume)}</p>
                  </div>
                  <div className="glass-card p-6 border border-purple-500/20 bg-purple-500/5">
                    <p className="text-sm text-purple-400 mb-2">{t('adminPlatformFee')}</p>
                    <p className="text-3xl font-black text-purple-400">{formatDZD(stats.revenue)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white tracking-wide">{t('adminUsers')}</h3>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder={t('searchPlaceholder')} className="input-field py-2 pr-10 text-sm" />
                  </div>
                </div>
                
                <div className="glass-card border border-white/5 overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-white/5 text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">الاسم</th>
                        <th className="px-6 py-4 font-semibold">الدور</th>
                        <th className="px-6 py-4 font-semibold">تاريخ الانضمام</th>
                        <th className="px-6 py-4 font-semibold">الحالة</th>
                        <th className="px-6 py-4 font-semibold text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mockUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                          <td className="px-6 py-4 text-slate-300">
                            {user.role === 'creator' ? 'صانع محتوى' : 'متجر'}
                          </td>
                          <td className="px-6 py-4 text-slate-400">{user.joinDate}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              user.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {user.status === 'verified' ? t('verified') : 'قيد الانتظار'}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex items-center justify-center gap-2">
                            <button className="text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-400/10 rounded">{t('adminActionVerify')}</button>
                            <button className="text-red-400 hover:text-red-300 px-2 py-1 bg-red-400/10 rounded">{t('adminActionSuspend')}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white tracking-wide mb-6">{t('adminCampaigns')} Moderation</h3>
                <div className="grid gap-4">
                  {mockCampaigns.map((camp) => (
                    <div key={camp.id} className="glass-card p-6 border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-wide">حملة من: {camp.brand}</h4>
                        <p className="text-sm text-slate-400 mt-1">{t('budget')}: {formatDZD(camp.budget)}</p>
                      </div>
                      <div className="flex gap-3">
                        <button className="btn-primary px-4 py-2 text-sm">{t('adminActionApprove')}</button>
                        <button className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-bold">{t('adminActionReject')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white tracking-wide mb-6">{t('adminEscrow')} Control</h3>
                <div className="glass-card border border-white/5 overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-white/5 text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">ID</th>
                        <th className="px-6 py-4 font-semibold">{t('walletAmountCol')}</th>
                        <th className="px-6 py-4 font-semibold">{t('walletMethod')}</th>
                        <th className="px-6 py-4 font-semibold">{t('walletStatus')}</th>
                        <th className="px-6 py-4 font-semibold text-center">إجراءات يدوية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mockTx.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-slate-400 font-mono">{tx.id}</td>
                          <td className="px-6 py-4 text-emerald-400 font-bold">{formatDZD(tx.amount)}</td>
                          <td className="px-6 py-4 text-slate-300">{tx.method}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              tx.status === 'escrow' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {tx.status === 'escrow' ? 'في الضمان' : 'محرر'}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex items-center justify-center gap-2">
                            {tx.status === 'escrow' ? (
                              <>
                                <button className="text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-400/10 rounded font-bold">Release</button>
                                <button className="text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-400/10 rounded font-bold">Refund</button>
                              </>
                            ) : (
                              <span className="text-slate-500 text-xs">مكتمل</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
