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
        if (storedAnalysis) return JSON.parse(storedAnalysis);
      }
      const generalAnalysis = localStorage.getItem('ecoroute_analysis_guest') || localStorage.getItem('ecoroute_latest_analysis');
      return generalAnalysis ? JSON.parse(generalAnalysis) : null;
    } catch {
      return null;
    }
  });

  const [analysisHistory, setAnalysisHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('ecoroute_analysis_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('ecoroute_user', JSON.stringify(user));
        const storedAnalysis = localStorage.getItem(`ecoroute_analysis_${user.email.toLowerCase()}`);
        if (storedAnalysis) {
          setAnalysisData(JSON.parse(storedAnalysis));
        }
      } else {
        localStorage.removeItem('ecoroute_user');
      }
    } catch (e) {
      console.error('Failed to sync user state with localStorage', e);
    }
  }, [user]);

  const login = async (email, _password) => {
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
      const storedAnalysis = localStorage.getItem(`ecoroute_analysis_${email.toLowerCase()}`) 
        || localStorage.getItem('ecoroute_latest_analysis');
      setAnalysisData(storedAnalysis ? JSON.parse(storedAnalysis) : null);
    } catch {
      setAnalysisData(null);
    }

    setIsLoading(false);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ecoroute_user');
    // Keep general latest analysis or clear as desired
    const latest = localStorage.getItem('ecoroute_latest_analysis');
    setAnalysisData(latest ? JSON.parse(latest) : null);
  };

  const saveAnalysis = (data) => {
    if (!data) return;
    try {
      const timestamp = data.timestamp || new Date().toISOString();
      const id = data.id || `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const enrichedData = {
        ...data,
        id,
        timestamp,
      };

      // 1. General latest analysis
      localStorage.setItem('ecoroute_latest_analysis', JSON.stringify(enrichedData));

      // 2. User or guest keyed analysis
      if (user?.email) {
        localStorage.setItem(`ecoroute_analysis_${user.email.toLowerCase()}`, JSON.stringify(enrichedData));
      } else {
        localStorage.setItem('ecoroute_analysis_guest', JSON.stringify(enrichedData));
      }

      // 3. Update history log (retaining up to 500 previous analyses)
      const existingHistory = JSON.parse(localStorage.getItem('ecoroute_analysis_history') || '[]');
      const updatedHistory = [enrichedData, ...existingHistory.filter(item => item.id ? item.id !== id : item.timestamp !== timestamp)].slice(0, 500);
      localStorage.setItem('ecoroute_analysis_history', JSON.stringify(updatedHistory));

      setAnalysisData(enrichedData);
      setAnalysisHistory(updatedHistory);
    } catch (e) {
      console.error('Failed to save analysis data', e);
    }
  };

  const clearAnalysis = () => {
    try {
      if (user?.email) {
        localStorage.removeItem(`ecoroute_analysis_${user.email.toLowerCase()}`);
      }
      localStorage.removeItem('ecoroute_analysis_guest');
      localStorage.removeItem('ecoroute_latest_analysis');
      localStorage.removeItem('ecoroute_analysis_history');
      setAnalysisData(null);
      setAnalysisHistory([]);
    } catch (e) {
      console.error('Failed to clear analysis data', e);
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
      analysisHistory,
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

