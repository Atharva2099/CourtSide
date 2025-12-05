import { useState, useEffect } from 'react';
import Map from './Map';
import Comparison from './Comparison';
import PlayerView from './PlayerView';
import StateView from './StateView';

function App() {
  const [viewMode, setViewMode] = useState('team');
  const [selectedTeams, setSelectedTeams] = useState(['LAL', 'BOS']);
  const [filters, setFilters] = useState({ decades: [], seasonType: 'all' });

  const handleTeamSelect = (teamAbbrev) => {
    if (selectedTeams.length === 0) {
      setSelectedTeams([teamAbbrev]);
    } else if (selectedTeams.length === 1) {
      setSelectedTeams([selectedTeams[0], teamAbbrev]);
    } else {
      // Replace second team
      setSelectedTeams([selectedTeams[0], teamAbbrev]);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: viewMode === 'player' ? 'white' : 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)' }}>
      {/* Header */}
      <header className="p-6 shadow-2xl" style={{ background: viewMode === 'player' ? 'white' : 'linear-gradient(135deg, #1d428a 0%, #0a0e27 100%)', borderBottom: viewMode === 'player' ? '1px solid #E0E0E0' : '3px solid #c8102e' }}>
        <div className="container mx-auto flex items-center gap-4">
          <div style={{ 
            height: '60px', 
            width: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: viewMode === 'player' ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px'
          }}>
            <img 
              src="https://cdn.nba.com/logos/nba/nba-logo.svg" 
              alt="NBA Logo" 
              style={{ 
                height: '100%', 
                width: '100%',
                objectFit: 'contain',
                display: 'block',
                filter: viewMode === 'player' ? 'none' : 'brightness(0) invert(1)'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h1 className="text-5xl font-bold mb-2" style={{ color: viewMode === 'player' ? '#1D428A' : 'white', fontFamily: "'Inter', sans-serif", textShadow: viewMode === 'player' ? 'none' : '3px 3px 6px rgba(0,0,0,0.7)', letterSpacing: '2px' }}>
              Courtside
            </h1>
            <p className="text-lg" style={{ color: viewMode === 'player' ? '#666' : '#93c5fd', fontFamily: "'Inter', sans-serif", letterSpacing: '0.5px' }}>
              Team & State Rivalries (1946-2024)
            </p>
          </div>
        </div>
      </header>

      {/* View Mode Toggle */}
      <div className="bg-opacity-90 backdrop-blur-sm" style={{ background: 'rgba(26, 31, 58, 0.5)' }}>
        <div className="container mx-auto p-4">
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('team')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'team'
                  ? 'text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-opacity-50'
              }`}
              style={{
                background: viewMode === 'team' ? 'linear-gradient(135deg, #1d428a 0%, #0077c0 100%)' : 'rgba(29, 66, 138, 0.3)',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              <img 
                src="https://cdn.nba.com/logos/nba/nba-logo.svg" 
                alt="" 
                style={{ 
                  height: '20px', 
                  width: 'auto',
                  filter: 'brightness(0) invert(1)'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              Team View
            </button>
            <button
              onClick={() => setViewMode('player')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'player'
                  ? 'text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-opacity-50'
              }`}
              style={{
                background: viewMode === 'player' ? 'linear-gradient(135deg, #1d428a 0%, #0077c0 100%)' : 'rgba(29, 66, 138, 0.3)',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              <img 
                src="https://cdn.nba.com/logos/nba/nba-logo.svg" 
                alt="" 
                style={{ 
                  height: '20px', 
                  width: 'auto',
                  filter: 'brightness(0) invert(1)'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              Player View
            </button>
            <button
              onClick={() => setViewMode('state')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'state'
                  ? 'text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-opacity-50'
              }`}
              style={{
                background: viewMode === 'state' ? 'linear-gradient(135deg, #1d428a 0%, #0077c0 100%)' : 'rgba(29, 66, 138, 0.3)',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              <img 
                src="https://cdn.nba.com/logos/nba/nba-logo.svg" 
                alt="" 
                style={{ 
                  height: '20px', 
                  width: 'auto',
                  filter: 'brightness(0) invert(1)'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              State View
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6" style={{ background: viewMode === 'player' ? 'white' : 'transparent' }}>
        {viewMode === 'team' && (
          <>
            {/* Map Section - Full Width Landscape */}
            <div className="rounded-xl p-5" style={{ background: 'transparent' }}>
              <h2 className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>
                US Map
              </h2>
              <div className="w-full rounded-lg overflow-hidden" style={{ height: '500px', background: 'rgba(15, 20, 25, 0.4)' }}>
                <Map
                  onTeamSelect={handleTeamSelect}
                  selectedTeams={selectedTeams}
                />
              </div>
            </div>

            {/* Comparison Section - Full Width Landscape */}
            <div className="w-full">
              <Comparison
                selectedTeams={selectedTeams}
                filters={filters}
              />
            </div>
          </>
        )}
        
        {viewMode === 'player' && (
          <PlayerView />
        )}
        
        {viewMode === 'state' && (
          <StateView />
        )}
      </div>

      {/* Footer */}
      <footer className="p-4 mt-8" style={{ background: 'transparent' }}>
        <div className="container mx-auto text-center text-sm text-gray-400">
          <p style={{ fontFamily: "'Inter', sans-serif" }}>
            Courtside - Data from Kaggle Dataset | 
            <span className="ml-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>NBA logo used for educational purposes only</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

