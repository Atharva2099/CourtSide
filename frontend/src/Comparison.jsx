import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getTeams, compareTeams } from './api';

export default function Comparison({ selectedTeams = [], filters = {} }) {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState(selectedTeams[0] || 'LAL');
  const [team2, setTeam2] = useState(selectedTeams[1] || 'BOS');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDecade, setSelectedDecade] = useState(filters.decade || null);

  const decades = ['1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

  useEffect(() => {
    // Load teams for dropdown
    getTeams()
      .then(data => setTeams(data))
      .catch(err => setError('Failed to load teams'));
  }, []);

  useEffect(() => {
    // Update when selectedTeams prop changes
    if (selectedTeams.length > 0) {
      setTeam1(selectedTeams[0]);
      if (selectedTeams.length > 1) {
        setTeam2(selectedTeams[1]);
      }
    }
  }, [selectedTeams]);

  useEffect(() => {
    // Fetch comparison data when teams or decade changes
    if (team1 && team2) {
      setLoading(true);
      setError(null);
      compareTeams(team1, team2, selectedDecade)
        .then(data => {
          setComparisonData(data);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load comparison data');
          setLoading(false);
        });
    }
  }, [team1, team2, selectedDecade]);

  if (error) {
    return (
      <div className="p-4 rounded-lg" style={{ background: 'rgba(200, 16, 46, 0.15)', color: '#ff6b6b' }}>
        {error}
      </div>
    );
  }

  const team1Data = comparisonData?.team1;
  const team2Data = comparisonData?.team2;
  const rivalry = comparisonData?.rivalry;

  // Prepare bar chart data
  const barChartData = team1Data && team2Data ? [
    {
      x: ['Wins', 'Championships', 'Win %'],
      y: [
        team1Data.total_wins,
        team1Data.championships,
        (team1Data.win_pct * 100).toFixed(1)
      ],
      name: team1Data.name,
      type: 'bar',
      marker: { color: '#1d428a' }
    },
    {
      x: ['Wins', 'Championships', 'Win %'],
      y: [
        team2Data.total_wins,
        team2Data.championships,
        (team2Data.win_pct * 100).toFixed(1)
      ],
      name: team2Data.name,
      type: 'bar',
      marker: { color: '#c8102e' }
    }
  ] : [];

  return (
    <div className="p-6 rounded-xl" style={{ background: 'transparent' }}>
      <h2 className="text-3xl font-bold mb-6 text-white" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '2px' }}>Team Comparison</h2>

      {/* Team Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>Team 1</label>
          <select
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
            className="w-full p-2.5 rounded-lg text-white transition-all"
            style={{ background: 'rgba(29, 66, 138, 0.6)', border: '1px solid #1d428a', fontFamily: "'Inter', sans-serif" }}
          >
            {teams.map(team => (
              <option key={team.abbreviation} value={team.abbreviation} style={{ background: '#1a1f3a' }}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Team 2</label>
          <select
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
            className="w-full p-2.5 rounded-lg text-white transition-all"
            style={{ background: 'rgba(29, 66, 138, 0.6)', border: '1px solid #1d428a', fontFamily: "'Inter', sans-serif" }}
          >
            {teams.map(team => (
              <option key={team.abbreviation} value={team.abbreviation} style={{ background: '#1a1f3a' }}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Decade Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2 text-gray-300" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>Filter by Decade</label>
        <div className="flex flex-wrap gap-2 max-w-4xl">
          <button
            onClick={() => setSelectedDecade(null)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedDecade === null
                ? 'text-white shadow-lg transform scale-105'
                : 'text-gray-300 hover:text-white'
            }`}
            style={{
              background: selectedDecade === null ? 'linear-gradient(135deg, #1d428a 0%, #0077c0 100%)' : 'rgba(29, 66, 138, 0.3)',
              fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
              letterSpacing: '1px'
            }}
          >
            All Time
          </button>
          {decades.map(decade => (
            <button
              key={decade}
              onClick={() => setSelectedDecade(decade)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                selectedDecade === decade
                  ? 'text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={{
                background: selectedDecade === decade ? 'linear-gradient(135deg, #1d428a 0%, #0077c0 100%)' : 'rgba(29, 66, 138, 0.3)',
                fontFamily: "'Roboto Condensed', sans-serif"
              }}
            >
              {decade}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-300" style={{ fontFamily: "'Inter', sans-serif" }}>Loading comparison data...</div>
      )}

      {comparisonData && !loading && (
        <>
          {/* Head-to-Head Record */}
          <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(15, 20, 25, 0.3)' }}>
            <h3 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>Head-to-Head Record</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>{team1Data.name}</div>
                <div className="text-2xl font-bold" style={{ color: '#1d428a' }}>{rivalry.team1_wins}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Total Meetings</div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>{rivalry.total_meetings}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>{team2Data.name}</div>
                <div className="text-2xl font-bold" style={{ color: '#c8102e' }}>{rivalry.team2_wins}</div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          {barChartData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>Statistics Comparison</h3>
              <div className="w-full rounded-lg overflow-hidden" style={{ background: 'rgba(15, 20, 25, 0.3)', padding: '20px' }}>
                <Plot
                  data={barChartData.map((trace, idx) => ({
                    ...trace,
                    marker: {
                      color: trace.marker.color,
                      line: {
                        color: idx === 0 ? '#0a4a8a' : '#8b0000',
                        width: 2
                      },
                      opacity: 0.9
                    },
                    width: 0.4
                  }))}
                  layout={{
                    barmode: 'group',
                    height: 450,
                    width: null,
                    xaxis: { 
                      title: { text: 'Statistic', font: { color: '#ffffff', family: "'Bebas Neue', 'Oswald', sans-serif", size: 18 }, standoff: 10 }, 
                      tickfont: { color: '#ffffff', family: "'Inter', sans-serif", size: 12 }, 
                      tickangle: 0,
                      tickmode: 'array',
                      tickvals: [0, 1, 2],
                      ticktext: ['Wins', 'Championships', 'Win %'],
                      gridcolor: 'rgba(255,255,255,0.08)',
                      gridwidth: 1,
                      showline: true,
                      linecolor: 'rgba(255,255,255,0.2)',
                      zeroline: false,
                      automargin: false,
                      side: 'bottom',
                      ticklabelposition: 'outside',
                      ticklen: 5
                    },
                    yaxis: { 
                      title: { text: 'Value', font: { color: '#ffffff', family: "'Bebas Neue', 'Oswald', sans-serif", size: 18 } }, 
                      tickfont: { color: '#ffffff', family: "'Inter', sans-serif", size: 12 }, 
                      gridcolor: 'rgba(255,255,255,0.08)',
                      gridwidth: 1,
                      showline: true,
                      linecolor: 'rgba(255,255,255,0.2)',
                      zeroline: false
                    },
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#ffffff', family: "'Inter', sans-serif" },
                    margin: { l: 70, r: 50, t: 80, b: 60 },
                    showlegend: true,
                    legend: {
                      x: 0.5,
                      y: 1.02,
                      xanchor: 'center',
                      yanchor: 'bottom',
                      orientation: 'h',
                      font: { color: '#ffffff', family: "'Bebas Neue', 'Oswald', sans-serif", size: 16 },
                      bgcolor: 'rgba(0,0,0,0)',
                      bordercolor: 'rgba(0,0,0,0)',
                      borderwidth: 0,
                      traceorder: 'normal'
                    },
                    hovermode: 'x unified',
                    hoverlabel: {
                      bgcolor: 'rgba(29, 66, 138, 0.95)',
                      bordercolor: '#ffffff',
                      font: { color: '#ffffff', family: "'Inter', sans-serif", size: 12 }
                    }
                  }}
                  config={{ 
                    displayModeBar: false,
                    responsive: true
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Team Details */}
          <div className="flex justify-between gap-8 w-full">
            <div className="p-5 rounded-lg flex-1 max-w-md" style={{ background: 'rgba(29, 66, 138, 0.15)' }}>
              <h4 className="font-semibold mb-3 text-white text-lg" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>{team1Data.name}</h4>
              <div className="text-sm space-y-2 text-gray-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p><strong className="text-white">Record:</strong> {team1Data.total_wins}-{team1Data.total_losses}</p>
                <p><strong className="text-white">Win %:</strong> {(team1Data.win_pct * 100).toFixed(1)}%</p>
                <p><strong className="text-white">Championships:</strong> {team1Data.championships}</p>
                <p><strong className="text-white">Location:</strong> {team1Data.city}, {team1Data.state}</p>
              </div>
            </div>
            <div className="p-5 rounded-lg flex-1 max-w-md ml-auto" style={{ background: 'rgba(200, 16, 46, 0.15)' }}>
              <h4 className="font-semibold mb-3 text-white text-lg" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>{team2Data.name}</h4>
              <div className="text-sm space-y-2 text-gray-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p><strong className="text-white">Record:</strong> {team2Data.total_wins}-{team2Data.total_losses}</p>
                <p><strong className="text-white">Win %:</strong> {(team2Data.win_pct * 100).toFixed(1)}%</p>
                <p><strong className="text-white">Championships:</strong> {team2Data.championships}</p>
                <p><strong className="text-white">Location:</strong> {team2Data.city}, {team2Data.state}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

