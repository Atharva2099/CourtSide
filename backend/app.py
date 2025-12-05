"""
FastAPI Backend for Courtside
Serves JSON data files via REST API endpoints
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

app = FastAPI(title="Courtside API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data files on startup
data_dir = Path(__file__).parent / "data"

teams_data = []
players_data = []
rivalries_data = []
states_data = []

def load_data():
    """Load all JSON files into memory"""
    global teams_data, players_data, rivalries_data, states_data
    
    try:
        with open(data_dir / "team_summary.json", "r") as f:
            teams_data = json.load(f)
        
        with open(data_dir / "player_summary.json", "r") as f:
            players_data = json.load(f)
        
        with open(data_dir / "rivalry_summary.json", "r") as f:
            rivalries_data = json.load(f)
        
        with open(data_dir / "state_summary.json", "r") as f:
            states_data = json.load(f)
        
        print(f"Loaded {len(teams_data)} teams, {len(players_data)} players, {len(rivalries_data)} rivalries, {len(states_data)} states")
    except FileNotFoundError as e:
        print(f"Warning: Data files not found. Run process_data.py first. Error: {e}")

@app.on_event("startup")
async def startup_event():
    load_data()

@app.get("/")
async def root():
    return {"message": "Courtside API", "endpoints": ["/api/teams", "/api/players", "/api/compare", "/api/map-data", "/api/states"]}

@app.get("/api/teams")
async def get_teams():
    """Get all teams with stats"""
    return teams_data

@app.get("/api/teams/{team_id}")
async def get_team(team_id: str):
    """Get single team details by ID or abbreviation"""
    team = next((t for t in teams_data if str(t.get("team_id")) == team_id or t.get("abbreviation") == team_id.upper()), None)
    
    if not team:
        raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
    
    return team

@app.get("/api/players")
async def get_players(limit: int = Query(None, description="Limit number of results")):
    """Get all players"""
    if limit:
        return players_data[:limit]
    return players_data

@app.get("/api/compare")
async def compare_teams(
    team1: str = Query(..., description="First team ID or abbreviation"),
    team2: str = Query(..., description="Second team ID or abbreviation"),
    decade: str = Query(None, description="Filter by decade (e.g., '1980s')")
):
    """Compare two teams head-to-head"""
    # Find teams
    team1_data = next((t for t in teams_data if str(t.get("team_id")) == team1 or t.get("abbreviation") == team1.upper()), None)
    team2_data = next((t for t in teams_data if str(t.get("team_id")) == team2 or t.get("abbreviation") == team2.upper()), None)
    
    if not team1_data:
        raise HTTPException(status_code=404, detail=f"Team {team1} not found")
    if not team2_data:
        raise HTTPException(status_code=404, detail=f"Team {team2} not found")
    
    # Find rivalry
    team1_abbrev = team1_data.get("abbreviation")
    team2_abbrev = team2_data.get("abbreviation")
    
    rivalry = next(
        (r for r in rivalries_data 
         if (r.get("team1") == team1_abbrev and r.get("team2") == team2_abbrev) or
            (r.get("team1") == team2_abbrev and r.get("team2") == team1_abbrev)),
        None
    )
    
    if not rivalry:
        # Create empty rivalry if none exists
        rivalry = {
            "team1": team1_abbrev,
            "team2": team2_abbrev,
            "total_meetings": 0,
            "team1_wins": 0,
            "team2_wins": 0,
        }
    
    # Ensure team1_wins corresponds to team1_abbrev
    if rivalry.get("team1") != team1_abbrev:
        rivalry["team1_wins"], rivalry["team2_wins"] = rivalry["team2_wins"], rivalry["team1_wins"]
        rivalry["team1"], rivalry["team2"] = rivalry["team2"], rivalry["team1"]
    
    return {
        "team1": team1_data,
        "team2": team2_data,
        "rivalry": rivalry,
        "decade": decade,
    }

@app.get("/api/map-data")
async def get_map_data():
    """Get all teams with coordinates and stats for map visualization"""
    return teams_data

@app.get("/api/states/{state}")
async def get_state(state: str):
    """Get state-level aggregated stats"""
    state_data = next((s for s in states_data if s.get("state_name").lower() == state.lower()), None)
    
    if not state_data:
        raise HTTPException(status_code=404, detail=f"State {state} not found")
    
    # Also include teams in this state
    state_teams = [t for t in teams_data if t.get("state").lower() == state.lower()]
    state_data["teams"] = state_teams
    
    return state_data

