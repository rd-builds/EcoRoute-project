import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from './components/Loader';
import DotPointer from './components/DotPointer';
import Header from './components/Header';
import Hero from './sections/Hero';
import Trust from './sections/Trust';
import Footer from './components/Footer';
import HowItWorks from './pages/HowItWorks';
import Extension from './pages/Extension';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import { AuthProvider } from './context/AuthContext';

function HomeView() {
  return (
    <>
      <Hero />
      <Trust />
    </>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      document.body.classList.add('loading');
    } else {
      document.body.classList.remove('loading');
    }
  }, [loading]);

  return (
    <AuthProvider>
      <DotPointer />
      {loading && <Loader onComplete={() => setLoading(false)} />}
      
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/extension" element={<Extension />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace" element={<HomeView />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="*" element={<HomeView />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  );
}

export default App;
