import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Users, FileText, Wallet, ShieldCheck, ShieldAlert,
  CheckCircle, XCircle, MoreVertical, Search, Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatDZD } from '../services/chargilyService';

export default function AdminDashboardModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-md overflow-y-auto" dir="rtl">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              لوحة الإدارة والأدمن (Admin Control)
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">Admin</span>
            </h1>
            <p className="text-xs text-slate-400">إدارة المستخدمين والحملات والصفقات المالية للمنصة</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-white/10">
          {[
            { id: 'overview', label: 'الإحصائيات العامة', icon: Activity },
            { id: 'users', label: 'إدارة المستخدمين', icon: Users },
            { id: 'campaigns', label: 'مراجعة الحملات', icon: FileText },
            { id: 'financial', label: 'إدارة الضمان والمالية 💰', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 scale-105'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-6 tracking-wide">{t('adminOverview')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">{t('adminTotalCreators')}</p>
                <p className="text-3xl font-black text-white">{stats.creators.toLocaleString()}</p>
              </div>
              <div className="glass-card p-6 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">{t('adminTotalBrands')}</p>
                <p className="text-3xl font-black text-white">{stats.brands.toLocaleString()}</p>
              </div>
              <div className="glass-card p-6 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">{t('adminTotalTx')}</p>
                <p className="text-3xl font-black text-blue-400">{formatDZD(stats.txVolume)}</p>
              </div>
              <div className="glass-card p-6 border border-purple-500/30 bg-purple-500/10">
                <p className="text-sm text-purple-300 mb-2">{t('adminPlatformFee')}</p>
                <p className="text-3xl font-black text-purple-400">{formatDZD(stats.revenue)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white tracking-wide">{t('adminUsers')}</h3>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder={t('searchPlaceholder')} className="input-field py-2 pr-10 text-sm" />
              </div>
            </div>
            
            <div className="glass-card border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
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
                    {mockUsers.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{userItem.name}</td>
                        <td className="px-6 py-4 text-slate-300">
                          {userItem.role === 'creator' ? 'صانع محتوى' : 'متجر'}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{userItem.joinDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            userItem.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {userItem.status === 'verified' ? t('verified') : 'قيد الانتظار'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                          <button className="text-emerald-400 hover:text-emerald-300 px-3 py-1 bg-emerald-400/10 rounded font-bold">{t('adminActionVerify')}</button>
                          <button className="text-red-400 hover:text-red-300 px-3 py-1 bg-red-400/10 rounded font-bold">{t('adminActionSuspend')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Campaigns */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white tracking-wide mb-6">{t('adminCampaigns')} Moderation</h3>
            <div className="grid gap-4">
              {mockCampaigns.map((camp) => (
                <div key={camp.id} className="glass-card p-6 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-wide">حملة من: {camp.brand}</h4>
                    <p className="text-sm text-slate-400 mt-1">{t('budget')}: {formatDZD(camp.budget)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="btn-primary px-4 py-2 text-sm font-bold">{t('adminActionApprove')}</button>
                    <button className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-bold">{t('adminActionReject')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Financial */}
        {activeTab === 'financial' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white tracking-wide mb-6">{t('adminEscrow')} Control</h3>
            <div className="glass-card border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
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
          </div>
        )}
      </div>
    </div>
  );
}
