import { useState, useEffect } from 'react';
import { getStates } from './api';

export default function StateView() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('wins');

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStates()
      .then(data => {
        setStates(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load states');
        setLoading(false);
      });
  }, []);

  const sortedStates = [...states].sort((a, b) => {
    if (sortBy === 'name') {
      return a.state_name.localeCompare(b.state_name);
    } else if (sortBy === 'wins') {
      return (b.aggregate_wins || 0) - (a.aggregate_wins || 0);
    } else if (sortBy === 'teams') {
      return (b.total_teams || 0) - (a.total_teams || 0);
    } else if (sortBy === 'championships') {
      return (b.aggregate_championships || 0) - (a.aggregate_championships || 0);
    }
    return 0;
  });

  if (error) {
    return (
      <div className="p-4 rounded-lg" style={{ background: 'rgba(200, 16, 46, 0.15)', color: '#ff6b6b' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl" style={{ background: 'transparent' }}>
      <h2 className="text-3xl font-bold mb-6 text-white" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '2px' }}>
        State Statistics
      </h2>

      {/* Sort Filter */}
      <div className="mb-6">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2.5 rounded-lg text-white"
          style={{ background: 'rgba(29, 66, 138, 0.6)', border: '1px solid #1d428a', fontFamily: "'Inter', sans-serif" }}
        >
          <option value="wins" style={{ background: '#1a1f3a' }}>Sort by Wins</option>
          <option value="teams" style={{ background: '#1a1f3a' }}>Sort by Number of Teams</option>
          <option value="championships" style={{ background: '#1a1f3a' }}>Sort by Championships</option>
          <option value="name" style={{ background: '#1a1f3a' }}>Sort by Name</option>
        </select>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-300" style={{ fontFamily: "'Inter', sans-serif" }}>
          Loading states...
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStates.map((state) => {
            const winPct = state.aggregate_wins + state.aggregate_losses > 0
              ? (state.aggregate_wins / (state.aggregate_wins + state.aggregate_losses) * 100).toFixed(1)
              : 0;

            return (
              <div
                key={state.state_name}
                className="p-5 rounded-lg transition-all hover:scale-105"
                style={{
                  background: 'rgba(15, 20, 25, 0.4)',
                  border: '1px solid rgba(29, 66, 138, 0.3)'
                }}
              >
                <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                  {state.state_name}
                </h3>
                <div className="space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Teams:</span>
                    <span className="text-white font-semibold">{state.total_teams || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Wins:</span>
                    <span className="text-white font-semibold">{state.aggregate_wins || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Losses:</span>
                    <span className="text-white font-semibold">{state.aggregate_losses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Win %:</span>
                    <span className="text-white font-semibold">{winPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Championships:</span>
                    <span className="text-white font-semibold">{state.aggregate_championships || 0}</span>
                  </div>
                  {state.teams && state.teams.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-gray-300 text-xs mb-1">Teams:</div>
                      <div className="text-white text-xs">
                        {state.teams.map(t => t.abbreviation || t.name).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

