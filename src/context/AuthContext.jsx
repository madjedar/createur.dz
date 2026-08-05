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
        console.log('Current User Profile:', data)
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

    // FORCE PARSE URL HASH
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      console.log('Forcing session from URL hash...');
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error) console.error('Error forcing session:', error);
          const currentUser = data?.session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            fetchProfile(currentUser.id);
          }
          setLoading(false);
          // Clean the URL
          window.history.replaceState({}, '', window.location.pathname);
        });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          fetchProfile(currentUser.id)
        }
        setLoading(false)
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          if (currentUser) {
            await fetchProfile(currentUser.id)
          } else {
            setProfile(null)
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

  const logout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const ADMIN_EMAILS = ['madjedalirachedi291@gmail.com'];

  const updateProfileData = async (profileFields) => {
    if (!user || !supabase) return;
    try {
      const payload = {
        id: user.id,
        updated_at: new Date().toISOString(),
        ...profileFields
      };
      const { error } = await supabase
        .from('profiles')
        .upsert(payload);
      if (error) console.error('Error saving profile:', error);
      setProfile(prev => ({ ...(prev || {}), ...payload }));
    } catch (err) {
      console.error('Error in updateProfileData:', err);
    }
  };

  const updateRole = async (role) => {
    if (!user || !supabase) return
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, role, full_name: user.user_metadata?.full_name || '' })
      
      await supabase.auth.updateUser({ data: { role } })

      setProfile(prev => ({ ...(prev || {}), id: user.id, role }))
    } catch (err) {
      console.error('Error updating role:', err)
    }
  }

  const isAdminEmail = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
  const resolvedRole = isAdminEmail 
    ? 'admin' 
    : (profile?.role || user?.user_metadata?.role || 'creator');

  const userWithRole = user ? { 
    ...user, 
    role: resolvedRole, 
    profile 
  } : null

  return (
    <AuthContext.Provider value={{ user: userWithRole, profile, loading, logout, updateRole, updateProfileData, fetchProfile }}>
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
