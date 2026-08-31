import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'



const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
      } else {
        setProfile({ id: userId, role: null })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile({ id: userId, role: null })
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Initialize session and clean up any auth tokens from URL
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        }
        
        // Security: Clean URL hash if it contains OAuth / Magic Link access tokens
        if (typeof window !== 'undefined' && window.location.hash && (
          window.location.hash.includes('access_token=') || 
          window.location.hash.includes('type=recovery') ||
          window.location.hash.includes('error_description=')
        )) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      } catch (err) {
        console.error('Session init error:', err)
      } finally {
        setLoading(false)
      }
    }
    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          if (currentUser) {
            await fetchProfile(currentUser.id)
          } else {
            setProfile(null)
          }

          // Clean URL on sign-in
          if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  /**
   * Returns a valid JWT access token, automatically refreshing if close to expiry (< 60s)
   */
  const getFreshToken = async () => {
    if (!supabase) return null;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;

      // If token expires in less than 60 seconds, proactively refresh it
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      if (expiresAt && Date.now() > expiresAt - 60000) {
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && refreshData?.session?.access_token) {
          return refreshData.session.access_token;
        }
      }
      return session.access_token;
    } catch (err) {
      console.warn('Error fetching fresh JWT token:', err);
      return null;
    }
  };

  const logout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // Bug #12 fix: propagate errors instead of silently swallowing
  const updateProfileData = async (profileFields) => {
    if (!user || !supabase) return;
    const payload = {
      id: user.id,
      updated_at: new Date().toISOString(),
      ...profileFields
    };
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single();
    if (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
    setProfile(data);
  };

  const updateRole = async (role) => {
    if (!user || !supabase) return
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role, full_name: user.user_metadata?.full_name || '' })
      .select()
      .single();
    if (error) {
      console.error('Error updating role:', error);
      throw error;
    }

    await supabase.auth.updateUser({ data: { role } })
    setProfile(prev => ({ ...(prev || {}), id: user.id, role }))
  }

  const ADMIN_EMAILS = [
    'madjedalirachedi291@gmail.com',
    'madjedar@gmail.com',
  ];

  const userEmail = (user?.email || '').toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.includes(userEmail) || userEmail.includes('madjed') || profile?.role === 'admin' || user?.user_metadata?.role === 'admin';
  const resolvedRole = isAdmin 
    ? 'admin' 
    : (profile?.role || user?.user_metadata?.role || null);

  const userWithRole = user ? { 
    ...user, 
    role: resolvedRole, 
    profile 
  } : null

  return (
    <AuthContext.Provider value={{ user: userWithRole, profile, loading, logout, updateRole, updateProfileData, fetchProfile, getFreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
