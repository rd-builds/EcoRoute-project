import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ecoroute_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [analysisData, setAnalysisData] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ecoroute_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const storedAnalysis = localStorage.getItem(`ecoroute_analysis_${parsed.email.toLowerCase()}`);
        return storedAnalysis ? JSON.parse(storedAnalysis) : null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('ecoroute_user', JSON.stringify(user));
        const storedAnalysis = localStorage.getItem(`ecoroute_analysis_${user.email.toLowerCase()}`);
        setAnalysisData(storedAnalysis ? JSON.parse(storedAnalysis) : null);
      } else {
        localStorage.removeItem('ecoroute_user');
        setAnalysisData(null);
      }
    } catch (e) {
      console.error('Failed to sync user state with localStorage', e);
    }
  }, [user]);

  const login = async (email, password) => {
    setIsLoading(true);
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const name = email.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    const newUser = {
      email,
      name: formattedName,
      initial: formattedName.charAt(0).toUpperCase(),
      signedInAt: new Date().toISOString()
    };

    setUser(newUser);
    
    // Load that specific user's analysis data
    try {
      const storedAnalysis = localStorage.getItem(`ecoroute_analysis_${email.toLowerCase()}`);
      setAnalysisData(storedAnalysis ? JSON.parse(storedAnalysis) : null);
    } catch {
      setAnalysisData(null);
    }

    setIsLoading(false);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setAnalysisData(null);
    localStorage.removeItem('ecoroute_user');
  };

  const saveAnalysis = (data) => {
    if (!user) return;
    try {
      localStorage.setItem(`ecoroute_analysis_${user.email.toLowerCase()}`, JSON.stringify(data));
      setAnalysisData(data);
    } catch (e) {
      console.error('Failed to save user analysis', e);
    }
  };

  const clearAnalysis = () => {
    if (!user) return;
    try {
      localStorage.removeItem(`ecoroute_analysis_${user.email.toLowerCase()}`);
      setAnalysisData(null);
    } catch (e) {
      console.error('Failed to clear user analysis', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout,
      analysisData,
      saveAnalysis,
      clearAnalysis
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
