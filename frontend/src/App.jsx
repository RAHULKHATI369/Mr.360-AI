import React, { useState, useEffect } from 'react';
import { Camera, Activity, Mic, Users, Utensils, AlertCircle, PlayCircle, Share2, MapPin, Upload } from 'lucide-react';
import { useWebcam } from './hooks/useWebcam';
import { processFrame } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('shot-insights');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const { videoRef, canvasRef, startWebcam, stopWebcam, isRecording, captureFrame, error } = useWebcam();

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, [startWebcam, stopWebcam]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(async () => {
        try {
          const frameBlob = await captureFrame();
          if (frameBlob) {
            setLoading(true);
            setApiError(null);
            const resultData = await processFrame(frameBlob, activeTab);
            setData(resultData);
          }
        } catch (err) {
          console.error("Error processing frame:", err);
          setApiError(err.message);
        } finally {
          setLoading(false);
        }
      }, 3000); // 3-second live processing
    }
    return () => clearInterval(interval);
  }, [isRecording, activeTab, captureFrame]);

  const tabs = [
    { id: 'shot-insights', label: 'Analysis', icon: <Activity className="w-6 h-6" /> },
    { id: 'live-voice', label: 'Commentary', icon: <Mic className="w-6 h-6" /> },
    { id: 'gate-guide', label: 'Crowd', icon: <Users className="w-6 h-6" /> },
    { id: 'food-meter', label: 'Food', icon: <Utensils className="w-6 h-6" /> },
  ];

  // Dynamic Component Renderers based on Tab
  const renderDashboardContent = () => {
    if (apiError) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{apiError}</p>
        </div>
      );
    }

    if (loading && !data) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-slate-700/50 rounded-full w-3/4"></div>
          <div className="h-4 bg-slate-700/50 rounded-full w-1/2"></div>
          <div className="h-32 bg-slate-700/30 rounded-2xl w-full"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'shot-insights':
        return (
          <div className="space-y-4">
            <div className="flex gap-4 mb-2">
              <div className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">SRH (Bowling): Pat Cummins</div>
              <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">KKR (Batting): Shreyas Iyer</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
                <h4 className="text-slate-400 text-xs uppercase mb-1">Current Over Stats</h4>
                <div className="text-2xl font-bold text-emerald-400">{data?.predicted_runs !== undefined ? `+${data.predicted_runs} Runs` : 'Waiting...'}</div>
                <div className="text-sm text-slate-300 mt-2">Efficiency: {data?.shot_efficiency || '--'}</div>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
                <h4 className="text-slate-400 text-xs uppercase mb-1">Batter Shot Map</h4>
                <div className="text-lg font-semibold text-blue-400">{data?.pitch_zone || 'Analyzing pitch...'}</div>
              </div>
            </div>
          </div>
        );

      case 'live-voice':
        return (
          <div className="space-y-6">
            <div className="bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Mic className="w-16 h-16 text-indigo-300" /></div>
              <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" /> Live Broadcasting
              </h4>
              <p className="text-lg font-medium text-slate-100 italic">
                "{data?.commentary || 'Connecting to comm box...'}"
              </p>
            </div>
            
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-slate-200">Sync with Friends</div>
                <div className="text-xs text-slate-400">Share live audio stream</div>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                <Share2 className="w-4 h-4" /> Share Link
              </button>
            </div>
          </div>
        );

      case 'gate-guide':
        return (
          <div className="space-y-4">
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
              <MapPin className="w-6 h-6 text-red-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-red-400 font-bold mb-1">Live Advisory (Rajiv Gandhi Stadium)</h4>
                <p className="text-sm text-slate-300">{data?.gate_status || 'Scanning stadium perimeters...'}</p>
                {data?.density_percentage && (
                  <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${data.density_percentage}%` }}></div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 text-center">
                <h4 className="text-slate-400 text-xs uppercase mb-2">Organizers Update</h4>
                <p className="text-sm font-medium text-yellow-400">"Gate 3 closed for VVIP movement."</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                <Upload className="w-6 h-6 text-blue-400 mb-2" />
                <h4 className="text-blue-400 text-xs uppercase font-bold">Upload Fan Post</h4>
              </div>
            </div>
          </div>
        );

      case 'food-meter':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-700">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center rounded-full border-4 border-green-500 bg-green-500/10">
                <span className="text-3xl font-black text-green-400">{data?.quality_score || '-'}</span>
                <span className="absolute bottom-1 text-[10px] text-green-500 font-bold">/ 10</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-200 mb-1">Hygiene & Quality Score</h4>
                <p className="text-sm text-slate-400">Hyderabad Stadium Standards</p>
              </div>
            </div>
            
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
              <h4 className="text-slate-400 text-xs uppercase mb-2">AI Visual Assessment</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {data?.comments || 'Scan food item to assess freshness and portion size...'}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Left Sidebar (Navbar) */}
      <aside className="w-24 lg:w-64 bg-slate-800 border-r border-slate-700 flex flex-col items-center lg:items-start py-6 shadow-xl z-10">
        <div className="flex flex-col lg:flex-row items-center gap-3 px-0 lg:px-6 mb-10 w-full justify-center lg:justify-start">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0">
            <img src="/logo.png" alt="Mr. 360 AI Logo" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Logo' }} />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Mr. 360 AI
            </h1>
            <p className="text-[10px] text-slate-400 tracking-widest font-bold">KKR vs SRH LIVE</p>
          </div>
        </div>

        <nav className="flex-1 w-full px-3 flex flex-col gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setData(null); setApiError(null); }}
              className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                activeTab === tab.id 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className={`${activeTab === tab.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`}>
                {tab.icon}
              </div>
              <span className="font-semibold text-sm hidden lg:block tracking-wide">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Dashboard (Right Side) */}
      <main className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-slate-950">
        <header className="mb-6 flex justify-between items-end bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              {tabs.find(t => t.id === activeTab)?.label}
              <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold tracking-wider uppercase animate-pulse">Live</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Rajiv Gandhi International Stadium, Hyderabad
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-slate-700 shadow-inner">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-500'}`} />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isRecording ? 'System Online' : 'Offline'}
            </span>
          </div>
        </header>
        
        <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
          {/* Camera View */}
          <div className="flex-1 xl:flex-[1.5] flex flex-col">
            <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-slate-800 flex-1 min-h-[300px] xl:min-h-0 group">
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-red-400 bg-slate-900/80 backdrop-blur-sm">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p className="font-medium text-lg text-center px-4">{error}</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    playsInline 
                    muted 
                  />
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-0 border-[1px] border-emerald-500/20 pointer-events-none">
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-500"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-500"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-500"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-500"></div>
                  </div>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* AI Results Panel */}
          <div className="flex-1 xl:flex-[1.2] flex flex-col">
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 lg:p-8 flex-1 shadow-2xl border border-slate-700 flex flex-col relative overflow-hidden">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              
              <h3 className="text-lg font-black text-slate-100 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-2 h-6 bg-emerald-500 rounded-sm"></div>
                Real-Time Intelligence
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {renderDashboardContent()}
              </div>

              {/* Raw JSON Debug (Collapsible or small) */}
              {data && (
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-300 transition-colors">View Raw JSON Matrix</summary>
                    <pre className="mt-2 p-2 bg-black/50 rounded-lg overflow-x-auto text-[10px] text-emerald-400/70 border border-slate-800">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
