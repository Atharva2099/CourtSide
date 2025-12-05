/**
 * API service functions - reads from static JSON files for GitHub Pages
 */

// Map API endpoints to JSON file names
const API_FILE_MAP = {
  '/api/teams': '/CourtSide/data/team_summary.json',
  '/api/players': '/CourtSide/data/player_summary.json',
  '/api/map-data': '/CourtSide/data/team_summary.json',
  '/api/states': '/CourtSide/data/state_summary.json',
  '/api/rivalries': '/CourtSide/data/rivalry_summary.json',
};

async function fetchAPI(endpoint) {
  try {
    // For GitHub Pages, read from static JSON files
    const filePath = API_FILE_MAP[endpoint] || endpoint.replace('/api/', '/CourtSide/data/') + '.json';
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export async function getTeams() {
  return fetchAPI('/api/teams');
}

export async function getTeam(teamId) {
  const teams = await fetchAPI('/api/teams');
  return teams.find(t => t.abbreviation === teamId || t.team_id === teamId);
}

export async function getPlayers(limit = null) {
  const players = await fetchAPI('/api/players');
  if (limit) {
    return players.slice(0, limit);
  }
  return players;
}

export async function compareTeams(team1, team2, decade = null) {
  // For static hosting, do comparison client-side
  const [teams, rivalries] = await Promise.all([
    fetchAPI('/api/teams'),
    fetchAPI('/api/rivalries')
  ]);
  
  const team1Data = teams.find(t => t.abbreviation === team1 || t.team_id === team1);
  const team2Data = teams.find(t => t.abbreviation === team2 || t.team_id === team2);
  
  if (!team1Data || !team2Data) {
    throw new Error('Team not found');
  }
  
  // Find rivalry
  const rivalry = rivalries.find(r => 
    (r.team1 === team1Data.abbreviation && r.team2 === team2Data.abbreviation) ||
    (r.team1 === team2Data.abbreviation && r.team2 === team1Data.abbreviation)
  ) || {
    team1: team1Data.abbreviation,
    team2: team2Data.abbreviation,
    team1_wins: 0,
    team2_wins: 0,
    total_meetings: 0
  };
  
  // Ensure team1_wins corresponds to team1
  if (rivalry.team1 !== team1Data.abbreviation) {
    const temp = rivalry.team1_wins;
    rivalry.team1_wins = rivalry.team2_wins;
    rivalry.team2_wins = temp;
    rivalry.team1 = team1Data.abbreviation;
    rivalry.team2 = team2Data.abbreviation;
  }
  
  return {
    team1: team1Data,
    team2: team2Data,
    rivalry: rivalry,
    decade: decade
  };
}

export async function getMapData() {
  return fetchAPI('/api/map-data');
}

export async function getStates() {
  return fetchAPI('/api/states');
}

export async function getStateData(state) {
  const states = await fetchAPI('/api/states');
  return states.find(s => s.state_name.toLowerCase() === state.toLowerCase());
}

