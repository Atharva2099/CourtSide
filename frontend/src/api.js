/**
 * API service functions for fetching data from FastAPI backend
 */

// Use relative paths - Vite proxy will handle forwarding to backend
const API_BASE_URL = '';

async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
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
  return fetchAPI(`/api/teams/${teamId}`);
}

export async function getPlayers(limit = null) {
  const endpoint = limit ? `/api/players?limit=${limit}` : '/api/players';
  return fetchAPI(endpoint);
}

export async function compareTeams(team1, team2, decade = null) {
  let endpoint = `/api/compare?team1=${team1}&team2=${team2}`;
  if (decade) {
    endpoint += `&decade=${decade}`;
  }
  return fetchAPI(endpoint);
}

export async function getMapData() {
  return fetchAPI('/api/map-data');
}

export async function getStateData(state) {
  return fetchAPI(`/api/states/${state}`);
}

