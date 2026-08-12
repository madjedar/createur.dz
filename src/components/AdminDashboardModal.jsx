import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Users, FileText, Wallet, ShieldCheck, ShieldAlert,
  CheckCircle, XCircle, MoreVertical, Search, Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatDZD } from '../services/chargilyService';
import { supabase } from '../lib/supabase';

export default function AdminDashboardModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Fetch real data from Supabase
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, campaignsRes, appsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('campaigns').select('*, brand:profiles!campaigns_brand_id_fkey(brand_name, full_name)').order('created_at', { ascending: false }),
          supabase.from('applications').select('*, campaign:campaigns(*), creator:profiles!applications_creator_id_fkey(full_name)').order('created_at', { ascending: false }),
        ]);
        if (usersRes.data) setUsers(usersRes.data);
        if (campaignsRes.data) setCampaigns(campaignsRes.data);
        if (appsRes.data) setApplications(appsRes.data);
      } catch (err) {
        console.error('Admin fetch error:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute real stats
  const creatorCount = users.filter(u => u.role === 'creator').length;
  const brandCount = users.filter(u => u.role === 'brand').length;
  const activeCampaignCount = campaigns.length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  const platformRevenue = Math.round(totalBudget * 0.10); // 10% platform fee

  // Admin actions (persist to Supabase)
  const handleVerifyUser = async (id) => {
    const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', id);
    if (!error) setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: true } : u));
  };

  const handleSuspendUser = async (id) => {
    const { error } = await supabase.from('profiles').update({ role: 'suspended' }).eq('id', id);
    if (!error) setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleApproveCampaign = async (id) => {
    const { error } = await supabase.from('campaigns').update({ status: 'active' }).eq('id', id);
    if (!error) setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c));
  };

  const handleRejectCampaign = async (id) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const handleCompleteApplication = async (id) => {
    const { updateApplicationStatus } = await import('../services/dbService');
    try {
      await updateApplicationStatus(id, 'completed');
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    } catch (err) {
      console.error('Error completing application:', err);
    }
  };

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
            { id: 'overview', label: t('adminOverview'), icon: Activity },
            { id: 'users', label: t('adminUsers'), icon: Users },
            { id: 'campaigns', label: t('adminCampaigns'), icon: FileText },
            { id: 'financial', label: `${t('adminEscrow')} 💰`, icon: Wallet },
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

        {loading && (
          <div className="text-center py-12 text-slate-400 text-sm">جاري التحميل...</div>
        )}

        {/* Tab 1: Overview */}
        {!loading && activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-6 tracking-wide">{t('adminOverview')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">{t('adminTotalCreators')}</p>
                <p className="text-3xl font-black text-white">{creatorCount}</p>
              </div>
              <div className="glass-card p-6 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">{t('adminTotalBrands')}</p>
                <p className="text-3xl font-black text-white">{brandCount}</p>
              </div>
              <div className="glass-card p-6 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">{t('adminTotalTx')}</p>
                <p className="text-3xl font-black text-blue-400">{formatDZD(totalBudget)}</p>
              </div>
              <div className="glass-card p-6 border border-purple-500/30 bg-purple-500/10">
                <p className="text-sm text-purple-300 mb-2">{t('adminPlatformFee')}</p>
                <p className="text-3xl font-black text-purple-400">{formatDZD(platformRevenue)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users */}
        {!loading && activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white tracking-wide">{t('adminUsers')}</h3>
            </div>
            
            <div className="glass-card border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">الاسم</th>
                      <th className="px-6 py-4 font-semibold">الدور</th>
                      <th className="px-6 py-4 font-semibold">البريد</th>
                      <th className="px-6 py-4 font-semibold">الحالة</th>
                      <th className="px-6 py-4 font-semibold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{userItem.full_name || userItem.brand_name || 'بدون اسم'}</td>
                        <td className="px-6 py-4 text-slate-300">
                          {userItem.role === 'creator' ? 'صانع محتوى' : userItem.role === 'brand' ? 'متجر' : userItem.role || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-mono" dir="ltr">{userItem.id?.slice(0, 8)}...</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            userItem.is_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {userItem.is_verified ? t('verified') : 'قيد الانتظار'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                          <button onClick={() => handleVerifyUser(userItem.id)} className="text-emerald-400 hover:text-emerald-300 px-3 py-1 bg-emerald-400/10 rounded font-bold text-xs">{t('adminActionVerify')}</button>
                          <button onClick={() => handleSuspendUser(userItem.id)} className="text-red-400 hover:text-red-300 px-3 py-1 bg-red-400/10 rounded font-bold text-xs">{t('adminActionSuspend')}</button>
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
        {!loading && activeTab === 'campaigns' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white tracking-wide mb-6">{t('adminCampaigns')} Moderation</h3>
            <div className="grid gap-4">
              {campaigns.length === 0 ? (
                <p className="text-slate-400 text-center py-8">لا توجد حملات بعد</p>
              ) : (
                campaigns.map((camp) => (
                  <div key={camp.id} className="glass-card p-6 border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-white tracking-wide">{camp.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">من: {camp.brand?.brand_name || camp.brand?.full_name || 'متجر'} | {t('budget')}: {formatDZD(camp.budget)}</p>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${
                        camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {camp.status === 'active' ? 'نشطة' : camp.status || 'قيد المراجعة'}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {camp.status !== 'active' && (
                        <button onClick={() => handleApproveCampaign(camp.id)} className="btn-primary px-4 py-2 text-sm font-bold">{t('adminActionApprove')}</button>
                      )}
                      <button onClick={() => handleRejectCampaign(camp.id)} className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-bold">{t('adminActionReject')}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Financial (Applications as Escrow) */}
        {!loading && activeTab === 'financial' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white tracking-wide mb-6">{t('adminEscrow')} Control</h3>
            <div className="glass-card border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">الحملة</th>
                      <th className="px-6 py-4 font-semibold">صانع المحتوى</th>
                      <th className="px-6 py-4 font-semibold">{t('walletAmountCol')}</th>
                      <th className="px-6 py-4 font-semibold">{t('walletStatus')}</th>
                      <th className="px-6 py-4 font-semibold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {applications.filter(a => a.status === 'approved' || a.status === 'completed').map((app) => (
                      <tr key={app.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{app.campaign?.title || '—'}</td>
                        <td className="px-6 py-4 text-slate-300">{app.creator?.full_name || '—'}</td>
                        <td className="px-6 py-4 text-emerald-400 font-bold">{formatDZD(app.campaign?.budget || 0)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            app.status === 'approved' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {app.status === 'approved' ? 'في الضمان' : 'مكتمل ومحرر'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                          {app.status === 'approved' ? (
                            <button onClick={() => handleCompleteApplication(app.id)} className="text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-400/10 rounded font-bold text-xs">تحرير الأموال</button>
                          ) : (
                            <span className="text-slate-500 text-xs">مكتمل</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {applications.filter(a => a.status === 'approved' || a.status === 'completed').length === 0 && (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">لا توجد صفقات بعد</td></tr>
                    )}
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
