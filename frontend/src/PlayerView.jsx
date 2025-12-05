import { useState, useEffect } from 'react';
import { getPlayers } from './api';

// Team color mapping - primary colors for each NBA team
const getTeamColors = (teamAbbrev) => {
  const teamColors = {
    'ATL': { primary: '#E03A3E', secondary: '#C1D32F', name: 'Atlanta Hawks' },
    'BOS': { primary: '#007A33', secondary: '#BA9653', name: 'Boston Celtics' },
    'BRK': { primary: '#000000', secondary: '#FFFFFF', name: 'Brooklyn Nets' },
    'CHA': { primary: '#1D1160', secondary: '#00788C', name: 'Charlotte Hornets' },
    'CHO': { primary: '#1D1160', secondary: '#00788C', name: 'Charlotte Hornets' },
    'CHI': { primary: '#CE1141', secondary: '#000000', name: 'Chicago Bulls' },
    'CLE': { primary: '#860038', secondary: '#FDBB30', name: 'Cleveland Cavaliers' },
    'DAL': { primary: '#00538C', secondary: '#002B5E', name: 'Dallas Mavericks' },
    'DEN': { primary: '#0E2240', secondary: '#FEC524', name: 'Denver Nuggets' },
    'DET': { primary: '#C8102E', secondary: '#1D42BA', name: 'Detroit Pistons' },
    'GSW': { primary: '#1D428A', secondary: '#FFC72C', name: 'Golden State Warriors' },
    'HOU': { primary: '#CE1141', secondary: '#000000', name: 'Houston Rockets' },
    'IND': { primary: '#002D62', secondary: '#FDBB30', name: 'Indiana Pacers' },
    'LAC': { primary: '#C8102E', secondary: '#1D42BA', name: 'LA Clippers' },
    'LAL': { primary: '#552583', secondary: '#FDB927', name: 'Los Angeles Lakers' },
    'MEM': { primary: '#5D76A9', secondary: '#12173F', name: 'Memphis Grizzlies' },
    'MIA': { primary: '#98002E', secondary: '#F9A01B', name: 'Miami Heat' },
    'MIL': { primary: '#00471B', secondary: '#EEE1C6', name: 'Milwaukee Bucks' },
    'MIN': { primary: '#0C2340', secondary: '#236192', name: 'Minnesota Timberwolves' },
    'NOP': { primary: '#0C2340', secondary: '#C8102E', name: 'New Orleans Pelicans' },
    'NYK': { primary: '#006BB6', secondary: '#F58426', name: 'New York Knicks' },
    'OKC': { primary: '#007AC1', secondary: '#EF1B24', name: 'Oklahoma City Thunder' },
    'ORL': { primary: '#0077C0', secondary: '#C4CED4', name: 'Orlando Magic' },
    'PHI': { primary: '#006BB6', secondary: '#ED174C', name: 'Philadelphia 76ers' },
    'PHX': { primary: '#1D1160', secondary: '#E56020', name: 'Phoenix Suns' },
    'POR': { primary: '#E03A3E', secondary: '#000000', name: 'Portland Trail Blazers' },
    'SAC': { primary: '#5A2D81', secondary: '#63727A', name: 'Sacramento Kings' },
    'SAS': { primary: '#C4CED4', secondary: '#000000', name: 'San Antonio Spurs' },
    'TOR': { primary: '#CE1141', secondary: '#000000', name: 'Toronto Raptors' },
    'UTA': { primary: '#002B5C', secondary: '#F9A01B', name: 'Utah Jazz' },
    'WAS': { primary: '#002B5C', secondary: '#E31837', name: 'Washington Wizards' },
  };
  
  return teamColors[teamAbbrev?.toUpperCase()] || { primary: '#1d428a', secondary: '#c8102e', name: 'NBA' };
};

// Get player's primary team
const getPlayerPrimaryTeam = (player) => {
  if (player.teams && player.teams.length > 0) {
    return player.teams[0];
  }
  return null;
};

// Get player image URL - tries multiple sources
const getPlayerImageUrl = (playerId, playerName, teamAbbrev) => {
  // Try NBA.com CDN first (they use player IDs, but format might vary)
  // NBA.com uses format: https://cdn.nba.com/headshots/nba/latest/260x190/{playerId}.png
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png`;
};

// Fallback image generator (trading card style with team colors)
const getFallbackImageUrl = (playerName, teamAbbrev) => {
  const colors = getTeamColors(teamAbbrev);
  const bgColor = colors.primary.replace('#', '');
  const secondaryColor = colors.secondary.replace('#', '');
  
  // Create a more trading card-like avatar with team colors
  // Using initials for a cleaner look
  const initials = playerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=${secondaryColor}&size=300&bold=true&font-size=0.6&length=2`;
};

export default function PlayerView() {
  // Classic NBA colors
  const nbaRed = '#C8102E';
  const nbaBlue = '#1D428A';
  const offWhite = '#F5F5F0';
  const darkGray = '#2C2C2C';

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [leaderboardCategory, setLeaderboardCategory] = useState('ppg');
  const [statCategory1, setStatCategory1] = useState('basic'); // 'basic', 'shooting', 'advanced'
  const [statCategory2, setStatCategory2] = useState('basic'); // 'basic', 'shooting', 'advanced'

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPlayers()
      .then(data => {
        if (!data || data.length === 0) {
          setError('No players data available');
          setLoading(false);
          return;
        }
        setPlayers(data);
        const sortedByPPG = [...data].sort((a, b) => (b.career_ppg || 0) - (a.career_ppg || 0));
        const playersWithStats = sortedByPPG.filter(p => (p.career_ppg || 0) > 0 || (p.total_games || 0) > 0);
        
        if (playersWithStats.length >= 2) {
          setPlayer1(playersWithStats[0]);
          setPlayer2(playersWithStats[1]);
        } else if (playersWithStats.length >= 1) {
          setPlayer1(playersWithStats[0]);
          if (sortedByPPG.length >= 2) {
            setPlayer2(sortedByPPG[1]);
          }
        } else if (sortedByPPG.length >= 2) {
          setPlayer1(sortedByPPG[0]);
          setPlayer2(sortedByPPG[1]);
        } else if (sortedByPPG.length >= 1) {
          setPlayer1(sortedByPPG[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading players:', err);
        setError('Failed to load players: ' + err.message);
        setLoading(false);
      });
  }, []);

  const getTopPlayers = (category) => {
    const sorted = [...players].sort((a, b) => {
      const aVal = category === 'ppg' ? (a.career_ppg || 0) :
                   category === 'rpg' ? (a.career_rpg || 0) :
                   category === 'apg' ? (a.career_apg || 0) :
                   category === 'per' ? (a.career_per || 0) :
                   category === 'bpm' ? (a.career_bpm || 0) :
                   category === 'vorp' ? (a.career_vorp || 0) :
                   category === 'all_star' ? (a.all_star_appearances || 0) :
                   (a.total_games || 0);
      const bVal = category === 'ppg' ? (b.career_ppg || 0) :
                   category === 'rpg' ? (b.career_rpg || 0) :
                   category === 'apg' ? (b.career_apg || 0) :
                   category === 'per' ? (b.career_per || 0) :
                   category === 'bpm' ? (b.career_bpm || 0) :
                   category === 'vorp' ? (b.career_vorp || 0) :
                   category === 'all_star' ? (b.all_star_appearances || 0) :
                   (b.total_games || 0);
      return bVal - aVal;
    });
    return sorted.slice(0, 10);
  };

  const filteredPlayers = searchTerm
    ? players.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 50)
    : getTopPlayers(leaderboardCategory);

  const handlePlayerSelect = (player, side) => {
    if (side === 'left') {
      setPlayer1(player);
    } else {
      setPlayer2(player);
    }
    setSearchTerm('');
  };

  // Compare two players and determine winner for each stat
  const compareStat = (stat, player1Val, player2Val) => {
    if (player1Val > player2Val) return 'player1';
    if (player2Val > player1Val) return 'player2';
    return 'tie';
  };

  const PlayerCard = ({ player, side, onSelect, statCategory, setStatCategory }) => {
    if (!player) {
      return (
        <div className="flex-1 p-6 flex flex-col items-center justify-center" style={{ background: 'white', minHeight: '500px' }}>
          <div className="w-48 h-48 rounded-full mb-4 flex items-center justify-center" style={{ background: '#F5F5F5' }}>
            <span className="text-6xl" style={{ color: '#CCCCCC' }}>?</span>
          </div>
          <p className="text-lg" style={{ color: darkGray, fontFamily: "'Inter', sans-serif" }}>
            Select a player
          </p>
        </div>
      );
    }

    const primaryTeam = getPlayerPrimaryTeam(player);
    const teamColors = getTeamColors(primaryTeam);
    const accentColor = side === 'left' ? nbaRed : nbaBlue;

    return (
      <div 
        className="transition-all"
        style={{ 
          background: 'rgb(255, 254, 245)',
          border: `2px solid ${accentColor}`,
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: '650px'
        }}
      >
        {/* Top Section - Image, Name, Team */}
        <div className="flex flex-col items-center pt-6 pb-4" style={{ background: 'rgb(255, 254, 245)' }}>
          <div className="relative mb-4">
            <img
              src={getPlayerImageUrl(player.player_id, player.name, primaryTeam)}
              alt={player.name}
              className="w-40 h-40 rounded-full object-cover"
              style={{ 
                objectFit: 'cover',
                background: '#F5F5F5'
              }}
              onError={(e) => {
                // Try alternative image sources before falling back to avatar
                const currentSrc = e.target.src;
                const playerId = player.player_id;
                const playerName = player.name;
                let attempts = parseInt(e.target.dataset.attempts || '0');
                
                // Track attempts to prevent infinite loops
                attempts++;
                e.target.dataset.attempts = attempts.toString();
                
                // Try ESPN format
                if (currentSrc.includes('cdn.nba.com') && attempts === 1) {
                  e.target.src = `https://a.espncdn.com/i/headshots/nba/players/full/${playerId}.png`;
                }
                // Try alternative NBA.com format
                else if (currentSrc.includes('espncdn.com') && attempts === 2) {
                  e.target.src = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${playerId}.png`;
                }
                // Try Fantasy Nerds
                else if (currentSrc.includes('ak-static.cms.nba.com') && attempts === 3) {
                  e.target.src = `https://www.fantasynerds.com/images/nba/players_medium/${playerId}.png`;
                }
                // Final fallback to trading card style avatar
                else {
                  e.target.src = getFallbackImageUrl(playerName, primaryTeam);
                  // Prevent infinite loop
                  e.target.onerror = null;
                }
              }}
            />
            {/* Achievement badges */}
            {(player.all_star_appearances > 0 || player.mvp_count > 0 || player.all_nba_count > 0) && (
              <div className="absolute top-0 right-0 flex flex-col gap-1">
                {player.all_star_appearances > 0 && (
                  <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    ⭐ {player.all_star_appearances}
                  </div>
                )}
                {player.mvp_count > 0 && (
                  <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    🏆 {player.mvp_count}x MVP
                  </div>
                )}
                {player.all_nba_count > 0 && (
                  <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    🏀 {player.all_nba_count}x All-NBA
                  </div>
                )}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold mb-1" style={{ color: accentColor, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>
            {player.name}
          </h3>
          {primaryTeam && (
            <p className="text-sm mb-3" style={{ color: darkGray, fontFamily: "'Inter', sans-serif", fontWeight: '600' }}>
              {teamColors.name}
            </p>
          )}
          <button
            onClick={() => onSelect(player, side)}
            className="px-4 py-2 text-sm text-white transition-all hover:scale-105"
            style={{ background: accentColor, fontFamily: "'Inter', sans-serif", border: 'none' }}
          >
            Change Player
          </button>
        </div>
        
        {/* Stat Category Tabs */}
        <div className="flex gap-2 justify-center py-3" style={{ background: 'rgb(255, 254, 245)', borderTop: `1px solid ${accentColor}20`, borderBottom: `1px solid ${accentColor}20` }}>
          <button
            onClick={() => setStatCategory('basic')}
            className={`px-3 py-1 text-xs transition-all ${
              statCategory === 'basic' ? 'text-white' : ''
            }`}
            style={{ 
              background: statCategory === 'basic' ? accentColor : 'transparent',
              color: statCategory === 'basic' ? 'white' : darkGray,
              fontFamily: "'Inter', sans-serif",
              fontWeight: statCategory === 'basic' ? '600' : '400',
              border: 'none'
            }}
          >
            Basic
          </button>
          <button
            onClick={() => setStatCategory('shooting')}
            className={`px-3 py-1 text-xs transition-all ${
              statCategory === 'shooting' ? 'text-white' : ''
            }`}
            style={{ 
              background: statCategory === 'shooting' ? accentColor : 'transparent',
              color: statCategory === 'shooting' ? 'white' : darkGray,
              fontFamily: "'Inter', sans-serif",
              fontWeight: statCategory === 'shooting' ? '600' : '400',
              border: 'none'
            }}
          >
            Shooting
          </button>
          <button
            onClick={() => setStatCategory('advanced')}
            className={`px-3 py-1 text-xs transition-all ${
              statCategory === 'advanced' ? 'text-white' : ''
            }`}
            style={{ 
              background: statCategory === 'advanced' ? accentColor : 'transparent',
              color: statCategory === 'advanced' ? 'white' : darkGray,
              fontFamily: "'Inter', sans-serif",
              fontWeight: statCategory === 'advanced' ? '600' : '400',
              border: 'none'
            }}
          >
            Advanced
          </button>
        </div>
        
        {/* Card-style Stats Section */}
        <div style={{ background: 'rgb(255, 254, 245)', padding: '0', flex: 1 }}>
          {/* Header Banner */}
          <div style={{ background: accentColor, padding: '8px 12px' }}>
            <span style={{ color: 'white', fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: '14px', letterSpacing: '1px' }}>
              {statCategory === 'basic' ? 'CAREER STATS' : statCategory === 'shooting' ? 'SHOOTING STATS' : 'ADVANCED STATS'}
            </span>
          </div>
          
          {/* Stats Table - Two Column Layout */}
          <div style={{ padding: '12px' }}>
            {statCategory === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>G</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{player.total_games || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>PTS</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_ppg || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>REB</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_rpg || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>AST</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_apg || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>STL</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_spg || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>BLK</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_bpg || 0).toFixed(1)}</span>
                </div>
              </div>
            )}
            
            {statCategory === 'shooting' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>FG%</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{((player.career_fg_pct || 0) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>3P%</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{((player.career_3p_pct || 0) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>FT%</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{((player.career_ft_pct || 0) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>TS%</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{((player.career_ts_pct || 0) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>eFG%</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{((player.career_efg_pct || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
            
            {statCategory === 'advanced' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>PER</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_per || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>BPM</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_bpm || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>VORP</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_vorp || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>WS</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{(player.career_ws || 0).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: darkGray }}>USG%</span>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{((player.career_usg_pct || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Teams Footer */}
          {player.teams && player.teams.length > 0 && (
            <div style={{ background: '#F5F5F0', padding: '8px 12px', borderTop: `1px solid ${accentColor}20` }}>
              <span style={{ color: darkGray, fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>Teams: </span>
              <span style={{ color: accentColor, fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: '600' }}>
                {player.teams.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4" style={{ background: 'white', color: nbaRed }}>
        {error}
      </div>
    );
  }

  return (
    <div className="p-6" style={{ background: 'white', minHeight: '100vh' }}>
      <h2 className="text-3xl font-bold mb-6" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '2px' }}>
        Player vs Player
      </h2>

      {/* PvP Comparison Section */}
      <div className="mb-8 flex gap-6 justify-center">
        <div style={{ width: '320px' }}>
          <PlayerCard player={player1} side="left" onSelect={handlePlayerSelect} statCategory={statCategory1} setStatCategory={setStatCategory1} />
        </div>
        <div className="flex flex-col items-center justify-center px-4">
          <div className="text-4xl font-bold mb-4" style={{ color: nbaRed, fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
            VS
          </div>
          {/* Comparison indicators */}
          {player1 && player2 && (
            <div className="text-xs space-y-1" style={{ color: darkGray, fontFamily: "'Inter', sans-serif" }}>
              {compareStat('ppg', player1.career_ppg || 0, player2.career_ppg || 0) === 'player1' && (
                <div style={{ color: nbaRed, fontWeight: '600' }}>← PPG Leader</div>
              )}
              {compareStat('ppg', player1.career_ppg || 0, player2.career_ppg || 0) === 'player2' && (
                <div style={{ color: nbaBlue, fontWeight: '600' }}>PPG Leader →</div>
              )}
            </div>
          )}
        </div>
        <div style={{ width: '320px' }}>
          <PlayerCard player={player2} side="right" onSelect={handlePlayerSelect} statCategory={statCategory2} setStatCategory={setStatCategory2} />
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
          Leaderboard
        </h3>
        
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] p-2.5"
            style={{ background: 'white', border: 'none', borderBottom: `1px solid #E0E0E0`, color: darkGray, fontFamily: "'Inter', sans-serif", outline: 'none' }}
          />
          {!searchTerm && (
            <select
              value={leaderboardCategory}
              onChange={(e) => setLeaderboardCategory(e.target.value)}
              className="p-2.5"
              style={{ background: 'white', border: 'none', borderBottom: `1px solid #E0E0E0`, color: darkGray, fontFamily: "'Inter', sans-serif", outline: 'none' }}
            >
              <option value="ppg" style={{ background: 'white', color: darkGray }}>Top PPG</option>
              <option value="rpg" style={{ background: 'white', color: darkGray }}>Top RPG</option>
              <option value="apg" style={{ background: 'white', color: darkGray }}>Top APG</option>
              <option value="per" style={{ background: 'white', color: darkGray }}>Top PER</option>
              <option value="bpm" style={{ background: 'white', color: darkGray }}>Top BPM</option>
              <option value="vorp" style={{ background: 'white', color: darkGray }}>Top VORP</option>
              <option value="all_star" style={{ background: 'white', color: darkGray }}>Most All-Stars</option>
              <option value="games" style={{ background: 'white', color: darkGray }}>Most Games</option>
            </select>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8" style={{ color: darkGray, fontFamily: "'Inter', sans-serif" }}>
          Loading players...
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden" style={{ background: 'white' }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'white', borderBottom: `1px solid #E0E0E0` }}>
                  <th className="p-4 text-left font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                    Rank
                  </th>
                  <th className="p-4 text-left font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                    Player Name
                  </th>
                  <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                    PPG
                  </th>
                  <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                    RPG
                  </th>
                  <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                    APG
                  </th>
                  {(leaderboardCategory === 'per' || leaderboardCategory === 'bpm' || leaderboardCategory === 'vorp') && (
                    <>
                      <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                        PER
                      </th>
                      <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                        BPM
                      </th>
                      <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                        VORP
                      </th>
                    </>
                  )}
                  {leaderboardCategory === 'all_star' && (
                    <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                      All-Stars
                    </th>
                  )}
                  <th className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                    Games
                  </th>
                  <th className="p-4 text-center font-semibold" style={{ color: nbaBlue, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", letterSpacing: '1px' }}>
                    Select
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, idx) => {
                  const categoryValue = leaderboardCategory === 'ppg' ? (player.career_ppg || 0) :
                                        leaderboardCategory === 'rpg' ? (player.career_rpg || 0) :
                                        leaderboardCategory === 'apg' ? (player.career_apg || 0) :
                                        leaderboardCategory === 'per' ? (player.career_per || 0) :
                                        leaderboardCategory === 'bpm' ? (player.career_bpm || 0) :
                                        leaderboardCategory === 'vorp' ? (player.career_vorp || 0) :
                                        leaderboardCategory === 'all_star' ? (player.all_star_appearances || 0) :
                                        (player.total_games || 0);
                  
                  return (
                    <tr
                      key={player.player_id}
                      className="transition-colors cursor-pointer hover:bg-gray-50"
                      style={{ background: 'white', borderBottom: '1px solid #F0F0F0' }}
                      onClick={() => {
                        if (player1 && player.player_id === player1.player_id) return;
                        if (player2 && player.player_id === player2.player_id) return;
                        if (!player1) {
                          handlePlayerSelect(player, 'left');
                        } else if (!player2) {
                          handlePlayerSelect(player, 'right');
                        } else {
                          handlePlayerSelect(player, 'left');
                        }
                      }}
                    >
                      <td className="p-4 font-medium" style={{ color: darkGray, fontFamily: "'Inter', sans-serif" }}>
                        {idx + 1}
                      </td>
                      <td className="p-4 font-medium" style={{ color: darkGray, fontFamily: "'Inter', sans-serif" }}>
                        {player.name}
                      </td>
                      <td className="p-4 text-right font-semibold" style={{ color: nbaRed, fontFamily: "'Inter', sans-serif" }}>
                        {(player.career_ppg || 0).toFixed(1)}
                      </td>
                      <td className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Inter', sans-serif" }}>
                        {(player.career_rpg || 0).toFixed(1)}
                      </td>
                      <td className="p-4 text-right font-semibold" style={{ color: nbaRed, fontFamily: "'Inter', sans-serif" }}>
                        {(player.career_apg || 0).toFixed(1)}
                      </td>
                      {(leaderboardCategory === 'per' || leaderboardCategory === 'bpm' || leaderboardCategory === 'vorp') && (
                        <>
                          <td className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Inter', sans-serif" }}>
                            {(player.career_per || 0).toFixed(1)}
                          </td>
                          <td className="p-4 text-right font-semibold" style={{ color: nbaRed, fontFamily: "'Inter', sans-serif" }}>
                            {(player.career_bpm || 0).toFixed(1)}
                          </td>
                          <td className="p-4 text-right font-semibold" style={{ color: nbaBlue, fontFamily: "'Inter', sans-serif" }}>
                            {(player.career_vorp || 0).toFixed(1)}
                          </td>
                        </>
                      )}
                      {leaderboardCategory === 'all_star' && (
                        <td className="p-4 text-right font-semibold" style={{ color: nbaRed, fontFamily: "'Inter', sans-serif" }}>
                          {player.all_star_appearances || 0}
                        </td>
                      )}
                      <td className="p-4 text-right font-semibold" style={{ color: darkGray, fontFamily: "'Inter', sans-serif" }}>
                        {player.total_games || 0}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayerSelect(player, 'left');
                            }}
                            className="px-3 py-1 rounded text-xs text-white transition-all hover:scale-105 shadow-md"
                            style={{ background: nbaRed, fontFamily: "'Inter', sans-serif" }}
                          >
                            Left
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayerSelect(player, 'right');
                            }}
                            className="px-3 py-1 rounded text-xs text-white transition-all hover:scale-105 shadow-md"
                            style={{ background: nbaBlue, fontFamily: "'Inter', sans-serif" }}
                          >
                            Right
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPlayers.length === 0 && (
            <div className="p-8 text-center" style={{ color: darkGray, fontFamily: "'Inter', sans-serif" }}>
              {searchTerm ? 'No players found matching your search.' : 'No players available.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
