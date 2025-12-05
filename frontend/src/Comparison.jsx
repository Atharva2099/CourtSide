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
  const [chartType, setChartType] = useState('basic'); // 'basic', 'offensive', 'defensive', 'shooting', 'advanced'

  const decades = ['1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

  useEffect(() => {
    getTeams()
      .then(data => setTeams(data))
      .catch(err => setError('Failed to load teams'));
  }, []);

  useEffect(() => {
    if (selectedTeams.length > 0) {
      setTeam1(selectedTeams[0]);
      if (selectedTeams.length > 1) {
        setTeam2(selectedTeams[1]);
      }
    }
  }, [selectedTeams]);

  useEffect(() => {
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

  // Prepare chart data based on chart type
  const getChartData = (type) => {
    if (!team1Data || !team2Data) return [];

    switch(type) {
      case 'basic':
        return [
          {
            x: ['Wins', 'Championships', 'Win %'],
            y: [
              team1Data.total_wins,
              (team1Data.championships || 0) * 10, // Scale championships for visibility
              (team1Data.win_pct * 100).toFixed(1)
            ],
            name: team1Data.name,
            type: 'bar',
            marker: { color: '#1d428a' },
            text: [
              team1Data.total_wins,
              team1Data.championships || 0,
              (team1Data.win_pct * 100).toFixed(1) + '%'
            ],
            textposition: 'outside'
          },
          {
            x: ['Wins', 'Championships', 'Win %'],
            y: [
              team2Data.total_wins,
              (team2Data.championships || 0) * 10, // Scale championships for visibility
              (team2Data.win_pct * 100).toFixed(1)
            ],
            name: team2Data.name,
            type: 'bar',
            marker: { color: '#c8102e' },
            text: [
              team2Data.total_wins,
              team2Data.championships || 0,
              (team2Data.win_pct * 100).toFixed(1) + '%'
            ],
            textposition: 'outside'
          }
        ];
      
      case 'offensive':
        return [
          {
            x: ['PPG', 'APG', 'FG%', '3P%', 'FT%', 'TS%'],
            y: [
              team1Data.ppg || 0,
              team1Data.apg || 0,
              ((team1Data.fg_pct || 0) * 100).toFixed(1),
              ((team1Data['3p_pct'] || 0) * 100).toFixed(1),
              ((team1Data.ft_pct || 0) * 100).toFixed(1),
              ((team1Data.ts_pct || 0) * 100).toFixed(1)
            ],
            name: team1Data.name,
            type: 'bar',
            marker: { color: '#1d428a' }
          },
          {
            x: ['PPG', 'APG', 'FG%', '3P%', 'FT%', 'TS%'],
            y: [
              team2Data.ppg || 0,
              team2Data.apg || 0,
              ((team2Data.fg_pct || 0) * 100).toFixed(1),
              ((team2Data['3p_pct'] || 0) * 100).toFixed(1),
              ((team2Data.ft_pct || 0) * 100).toFixed(1),
              ((team2Data.ts_pct || 0) * 100).toFixed(1)
            ],
            name: team2Data.name,
            type: 'bar',
            marker: { color: '#c8102e' }
          }
        ];
      
      case 'defensive':
        return [
          {
            x: ['RPG', 'SPG', 'BPG', 'Def Rating'],
            y: [
              team1Data.rpg || 0,
              team1Data.spg || 0,
              team1Data.bpg || 0,
              team1Data.defensive_rating || 0
            ],
            name: team1Data.name,
            type: 'bar',
            marker: { color: '#1d428a' }
          },
          {
            x: ['RPG', 'SPG', 'BPG', 'Def Rating'],
            y: [
              team2Data.rpg || 0,
              team2Data.spg || 0,
              team2Data.bpg || 0,
              team2Data.defensive_rating || 0
            ],
            name: team2Data.name,
            type: 'bar',
            marker: { color: '#c8102e' }
          }
        ];
      
      case 'advanced':
        return [
          {
            x: ['Off Rating', 'Def Rating', 'Net Rating', 'Pace'],
            y: [
              team1Data.offensive_rating || 0,
              team1Data.defensive_rating || 0,
              team1Data.net_rating || 0,
              team1Data.pace || 0
            ],
            name: team1Data.name,
            type: 'bar',
            marker: { color: '#1d428a' }
          },
          {
            x: ['Off Rating', 'Def Rating', 'Net Rating', 'Pace'],
            y: [
              team2Data.offensive_rating || 0,
              team2Data.defensive_rating || 0,
              team2Data.net_rating || 0,
              team2Data.pace || 0
            ],
            name: team2Data.name,
            type: 'bar',
            marker: { color: '#c8102e' }
          }
        ];
      
      case 'shooting':
        return [
          {
            x: ['FG%', '3P%', 'FT%', 'eFG%', 'TS%'],
            y: [
              ((team1Data.fg_pct || 0) * 100).toFixed(1),
              ((team1Data['3p_pct'] || 0) * 100).toFixed(1),
              ((team1Data.ft_pct || 0) * 100).toFixed(1),
              ((team1Data.efg_pct || 0) * 100).toFixed(1),
              ((team1Data.ts_pct || 0) * 100).toFixed(1)
            ],
            name: team1Data.name,
            type: 'bar',
            marker: { color: '#1d428a' }
          },
          {
            x: ['FG%', '3P%', 'FT%', 'eFG%', 'TS%'],
            y: [
              ((team2Data.fg_pct || 0) * 100).toFixed(1),
              ((team2Data['3p_pct'] || 0) * 100).toFixed(1),
              ((team2Data.ft_pct || 0) * 100).toFixed(1),
              ((team2Data.efg_pct || 0) * 100).toFixed(1),
              ((team2Data.ts_pct || 0) * 100).toFixed(1)
            ],
            name: team2Data.name,
            type: 'bar',
            marker: { color: '#c8102e' }
          }
        ];
      
      case 'championships':
        // Create timeline chart for championships
        const allYears = new Set();
        if (team1Data.championship_years) {
          team1Data.championship_years.forEach(year => allYears.add(year));
        }
        if (team2Data.championship_years) {
          team2Data.championship_years.forEach(year => allYears.add(year));
        }
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        
        return [
          {
            x: sortedYears,
            y: sortedYears.map(year => team1Data.championship_years?.includes(year) ? 1 : 0),
            name: team1Data.name,
            type: 'scatter',
            mode: 'markers+lines',
            marker: { 
              color: '#1d428a',
              size: 15,
              symbol: 'circle'
            },
            line: { color: '#1d428a', width: 2 }
          },
          {
            x: sortedYears,
            y: sortedYears.map(year => team2Data.championship_years?.includes(year) ? 2 : 0),
            name: team2Data.name,
            type: 'scatter',
            mode: 'markers+lines',
            marker: { 
              color: '#c8102e',
              size: 15,
              symbol: 'diamond'
            },
            line: { color: '#c8102e', width: 2 }
          }
        ];
      
      default:
        return [];
    }
  };

  // Radar chart data for multi-dimensional comparison
  const getRadarData = () => {
    if (!team1Data || !team2Data) return null;

    const categories = ['Wins', 'Win %', 'PPG', 'RPG', 'APG', 'FG%'];
    const team1Values = [
      team1Data.total_wins / 100, // Normalize
      team1Data.win_pct * 100,
      team1Data.ppg || 0,
      team1Data.rpg || 0,
      team1Data.apg || 0,
      (team1Data.fg_pct || 0) * 100
    ];
    const team2Values = [
      team2Data.total_wins / 100, // Normalize
      team2Data.win_pct * 100,
      team2Data.ppg || 0,
      team2Data.rpg || 0,
      team2Data.apg || 0,
      (team2Data.fg_pct || 0) * 100
    ];

    return {
      categories,
      team1Values,
      team2Values
    };
  };

  const chartData = getChartData(chartType);
  const radarData = getRadarData();

  return (
    <div className="p-6 rounded-xl" style={{ background: 'transparent' }}>
      <h2 className="text-3xl font-bold mb-6 text-white" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '2px' }}>Team Comparison</h2>

      {/* Team Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>Team 1</label>
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
          <label className="block text-sm font-semibold mb-2 text-gray-300" style={{ fontFamily: "'Inter', sans-serif" }}>Team 2</label>
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
        <label className="block text-sm font-semibold mb-2 text-gray-300" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>Filter by Decade</label>
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
              fontFamily: "'Inter', sans-serif",
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
                fontFamily: "'Inter', sans-serif"
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
            <h3 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>Head-to-Head Record</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>{team1Data.name}</div>
                <div className="text-2xl font-bold" style={{ color: '#1d428a' }}>{rivalry.team1_wins}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Total Meetings</div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>{rivalry.total_meetings}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>{team2Data.name}</div>
                <div className="text-2xl font-bold" style={{ color: '#c8102e' }}>{rivalry.team2_wins}</div>
              </div>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setChartType('basic')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  chartType === 'basic' ? 'text-white' : 'text-gray-300'
                }`}
                style={{
                  background: chartType === 'basic' ? 'rgba(29, 66, 138, 0.6)' : 'rgba(29, 66, 138, 0.3)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '1px'
                }}
              >
                Basic Stats
              </button>
              <button
                onClick={() => setChartType('offensive')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  chartType === 'offensive' ? 'text-white' : 'text-gray-300'
                }`}
                style={{
                  background: chartType === 'offensive' ? 'rgba(29, 66, 138, 0.6)' : 'rgba(29, 66, 138, 0.3)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '1px'
                }}
              >
                Offensive
              </button>
              <button
                onClick={() => setChartType('defensive')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  chartType === 'defensive' ? 'text-white' : 'text-gray-300'
                }`}
                style={{
                  background: chartType === 'defensive' ? 'rgba(29, 66, 138, 0.6)' : 'rgba(29, 66, 138, 0.3)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '1px'
                }}
              >
                Defensive
              </button>
              <button
                onClick={() => setChartType('shooting')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  chartType === 'shooting' ? 'text-white' : 'text-gray-300'
                }`}
                style={{
                  background: chartType === 'shooting' ? 'rgba(29, 66, 138, 0.6)' : 'rgba(29, 66, 138, 0.3)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '1px'
                }}
              >
                Shooting
              </button>
              <button
                onClick={() => setChartType('advanced')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  chartType === 'advanced' ? 'text-white' : 'text-gray-300'
                }`}
                style={{
                  background: chartType === 'advanced' ? 'rgba(29, 66, 138, 0.6)' : 'rgba(29, 66, 138, 0.3)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '1px'
                }}
              >
                Advanced
              </button>
              <button
                onClick={() => setChartType('championships')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  chartType === 'championships' ? 'text-white' : 'text-gray-300'
                }`}
                style={{
                  background: chartType === 'championships' ? 'rgba(29, 66, 138, 0.6)' : 'rgba(29, 66, 138, 0.3)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '1px'
                }}
              >
                Championships
              </button>
            </div>
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>
                {chartType === 'basic' ? 'Statistics Comparison' :
                 chartType === 'offensive' ? 'Offensive Statistics' :
                 chartType === 'defensive' ? 'Defensive Statistics' :
                 chartType === 'shooting' ? 'Shooting Efficiency' :
                 'Advanced Metrics'}
              </h3>
              <div className="w-full rounded-lg overflow-hidden" style={{ background: 'rgba(15, 20, 25, 0.3)', padding: '20px' }}>
                <Plot
                  data={chartData.map((trace, idx) => ({
                    ...trace,
                    marker: {
                      color: trace.marker.color,
                      line: {
                        color: idx === 0 ? '#0a4a8a' : '#8b0000',
                        width: 2
                      },
                      opacity: 0.4
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
                      tickangle: chartType === 'offensive' || chartType === 'shooting' ? -45 : 0,
                      gridcolor: 'rgba(255,255,255,0.08)',
                      gridwidth: 1,
                      showline: true,
                      linecolor: 'rgba(255,255,255,0.2)',
                      zeroline: false,
                      automargin: true
                    },
                    yaxis: { 
                      title: { 
                        text: chartType === 'shooting' ? 'Percentage (%)' : chartType === 'championships' ? 'Team' : 'Value', 
                        font: { color: '#ffffff', family: "'Bebas Neue', 'Oswald', sans-serif", size: 18 } 
                      }, 
                      tickfont: { color: '#ffffff', family: "'Inter', sans-serif", size: 12 }, 
                      gridcolor: 'rgba(255,255,255,0.08)',
                      ...(chartType === 'championships' ? {
                        tickmode: 'array',
                        tickvals: [0, 1, 2],
                        ticktext: ['', team1Data.name, team2Data.name],
                        range: [-0.5, 2.5]
                      } : {}),
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

          {/* Radar Chart for Multi-dimensional Comparison */}
          {radarData && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>
                Multi-Dimensional Comparison
              </h3>
              <div className="w-full rounded-lg overflow-hidden" style={{ background: 'rgba(15, 20, 25, 0.3)', padding: '20px' }}>
                <Plot
                  data={[
                    {
                      type: 'scatterpolar',
                      r: radarData.team1Values,
                      theta: radarData.categories,
                      fill: 'toself',
                      name: team1Data.name,
                      marker: { color: '#1d428a' },
                      line: { color: '#1d428a' }
                    },
                    {
                      type: 'scatterpolar',
                      r: radarData.team2Values,
                      theta: radarData.categories,
                      fill: 'toself',
                      name: team2Data.name,
                      marker: { color: '#c8102e' },
                      line: { color: '#c8102e' }
                    }
                  ]}
                  layout={{
                    polar: {
                      radialaxis: {
                        visible: true,
                        range: [0, Math.max(...radarData.team1Values, ...radarData.team2Values) * 1.2],
                        tickfont: { color: '#ffffff', size: 10 }
                      },
                      angularaxis: {
                        tickfont: { color: '#ffffff', size: 12 }
                      }
                    },
                    height: 500,
                    showlegend: true,
                    legend: {
                      x: 0.5,
                      y: 1.02,
                      xanchor: 'center',
                      yanchor: 'bottom',
                      orientation: 'h',
                      font: { color: '#ffffff', family: "'Bebas Neue', 'Oswald', sans-serif", size: 16 },
                      bgcolor: 'rgba(0,0,0,0)'
                    },
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#ffffff', family: "'Inter', sans-serif" },
                    margin: { t: 80, b: 50 }
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

          {/* Team Details with Enhanced Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-lg" style={{ background: 'rgba(29, 66, 138, 0.15)' }}>
              <h4 className="font-semibold mb-3 text-white text-lg" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>{team1Data.name}</h4>
              <div className="text-sm space-y-2 text-gray-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p><strong className="text-white">Record:</strong> {team1Data.total_wins}-{team1Data.total_losses}</p>
                <p><strong className="text-white">Win %:</strong> {(team1Data.win_pct * 100).toFixed(1)}%</p>
                <p><strong className="text-white">Championships:</strong> {team1Data.championships || 0}</p>
                {team1Data.championship_years && team1Data.championship_years.length > 0 && (
                  <p><strong className="text-white">Championship Years:</strong> <span className="text-gray-300">{team1Data.championship_years.join(', ')}</span></p>
                )}
                <p><strong className="text-white">Location:</strong> {team1Data.city}, {team1Data.state}</p>
                {team1Data.ppg && (
                  <>
                    <p><strong className="text-white">PPG:</strong> {team1Data.ppg.toFixed(1)}</p>
                    <p><strong className="text-white">RPG:</strong> {team1Data.rpg?.toFixed(1) || 'N/A'}</p>
                    <p><strong className="text-white">APG:</strong> {team1Data.apg?.toFixed(1) || 'N/A'}</p>
                  </>
                )}
                {team1Data.offensive_rating && (
                  <>
                    <p><strong className="text-white">Off Rating:</strong> {team1Data.offensive_rating.toFixed(1)}</p>
                    <p><strong className="text-white">Def Rating:</strong> {team1Data.defensive_rating?.toFixed(1) || 'N/A'}</p>
                    <p><strong className="text-white">Net Rating:</strong> {team1Data.net_rating?.toFixed(1) || 'N/A'}</p>
                  </>
                )}
              </div>
            </div>
            <div className="p-5 rounded-lg" style={{ background: 'rgba(200, 16, 46, 0.15)' }}>
              <h4 className="font-semibold mb-3 text-white text-lg" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '1px' }}>{team2Data.name}</h4>
              <div className="text-sm space-y-2 text-gray-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p><strong className="text-white">Record:</strong> {team2Data.total_wins}-{team2Data.total_losses}</p>
                <p><strong className="text-white">Win %:</strong> {(team2Data.win_pct * 100).toFixed(1)}%</p>
                <p><strong className="text-white">Championships:</strong> {team2Data.championships || 0}</p>
                {team2Data.championship_years && team2Data.championship_years.length > 0 && (
                  <p><strong className="text-white">Championship Years:</strong> <span className="text-gray-300">{team2Data.championship_years.join(', ')}</span></p>
                )}
                <p><strong className="text-white">Location:</strong> {team2Data.city}, {team2Data.state}</p>
                {team2Data.ppg && (
                  <>
                    <p><strong className="text-white">PPG:</strong> {team2Data.ppg.toFixed(1)}</p>
                    <p><strong className="text-white">RPG:</strong> {team2Data.rpg?.toFixed(1) || 'N/A'}</p>
                    <p><strong className="text-white">APG:</strong> {team2Data.apg?.toFixed(1) || 'N/A'}</p>
                  </>
                )}
                {team2Data.offensive_rating && (
                  <>
                    <p><strong className="text-white">Off Rating:</strong> {team2Data.offensive_rating.toFixed(1)}</p>
                    <p><strong className="text-white">Def Rating:</strong> {team2Data.defensive_rating?.toFixed(1) || 'N/A'}</p>
                    <p><strong className="text-white">Net Rating:</strong> {team2Data.net_rating?.toFixed(1) || 'N/A'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
