import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import AuditFlow from './pages/AuditFlow';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/">
              <h1 className="text-xl font-black tracking-tight text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                AuditMate
              </h1>
            </Link>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/audit" element={<AuditFlow />} />
            <Route path="/results" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
