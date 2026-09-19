import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from './components/Loader';
import DotPointer from './components/DotPointer';
import Header from './components/Header';
import Hero from './sections/Hero';
import Trust from './sections/Trust';
import Footer from './components/Footer';
import AIWorkspace from './pages/AIWorkspace';

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
    <>
      <DotPointer />
      {loading && <Loader onComplete={() => setLoading(false)} />}
      
      <Header />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/workspace" element={<AIWorkspace />} />
        <Route path="/how-it-works" element={<HomeView />} />
        <Route path="/extension" element={<HomeView />} />
        <Route path="/dashboard" element={<HomeView />} />
        <Route path="*" element={<HomeView />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
