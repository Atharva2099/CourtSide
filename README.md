# Courtside

An interactive web dashboard for visualizing NBA team and state rivalries from 1946-2024 with an interactive US map, team comparisons, player statistics, and state-level analytics.

## Project Structure

```
Courtside/
├── process_data.py          # Data processing script (downloads, cleans, generates summaries)
├── backend/
│   ├── app.py              # FastAPI application
│   ├── data/               # Generated JSON files (team_summary.json, player_summary.json, etc.)
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx         # Main app component with view mode toggle
    │   ├── Map.jsx         # D3.js interactive US map (Team View)
    │   ├── StateMap.jsx    # D3.js interactive US map (State View)
    │   ├── Comparison.jsx  # Team comparison with Plotly charts
    │   ├── PlayerView.jsx  # Player vs Player comparison and leaderboard
    │   ├── StateView.jsx   # State statistics and cards
    │   ├── api.js          # API fetch functions
    │   └── main.css        # Tailwind + custom styles
    └── package.json        # Node dependencies
```

## Setup Instructions

### Prerequisites

- Python 3.8+ with UV package manager
- Node.js 18+ and npm
- Kaggle API credentials (for data download)

### 1. Data Pipeline Setup

1. Install Python dependencies using UV:
```bash
uv pip install --python venv/bin/python -r backend/requirements.txt
```

2. Set up Kaggle API credentials:
   - Go to https://www.kaggle.com/settings
   - Create API token
   - Create a `.env` file in the root directory:
   ```
   KAGGLE_USERNAME=your_username
   KAGGLE_KEY=your_api_key
   ```

3. Place championship data CSV file:
   - Place `champs_and_runner_ups_series_averages.csv` in the root directory
   - This file contains championship data from 1980-2017

4. Run the data processing script:
```bash
python process_data.py
```

This will:
- Download CSV files from Kaggle datasets
- Load championship data from the CSV file
- Clean and process the data
- Generate 4 JSON summary files in `backend/data/`:
  - `team_summary.json` - Team statistics with championships and years
  - `player_summary.json` - Player career statistics
  - `rivalry_summary.json` - Head-to-head records between teams
  - `state_summary.json` - State-level aggregated statistics

### 2. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies (if not already done):
```bash
uv pip install --python ../venv/bin/python -r requirements.txt
```

3. Start the FastAPI server:
```bash
uvicorn app:app --reload --port 8001
```

The API will be available at `http://localhost:8001`

### 3. Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns)

## Features

### Team View
- **Interactive US Map**: Click on team cities to select teams for comparison
- **Team Comparison**: Compare any two teams with:
  - Head-to-head records
  - Multiple chart types (Basic, Offensive, Defensive, Shooting, Advanced, Championships)
  - Radar chart for multi-dimensional comparison
  - Championship counts and years
  - Per-game and advanced statistics
- **Decade Filtering**: Filter comparisons by decade (1940s-2020s)
- **Visualizations**: Bar charts, radar charts, and statistics comparison using Plotly

### Player View
- **Player vs Player Comparison**: Side-by-side comparison of two players
- **Player Statistics**: 
  - Basic stats (PPG, RPG, APG, SPG, BPG, Games)
  - Shooting stats (FG%, 3P%, FT%, TS%, eFG%)
  - Advanced stats (PER, BPM, VORP, Win Shares, Usage Rate)
- **Achievement Badges**: All-Star appearances, MVP, All-NBA
- **Searchable Leaderboard**: Filter by category (PPG, RPG, APG, etc.)
- **Player Images**: Multi-source image loading with fallback avatars

### State View
- **Interactive State Map**: Hover and click states to view statistics
- **State Statistics Cards**: 
  - Aggregate wins, losses, win percentage
  - Total teams and championships
  - Team logos in background
  - Individual team championships with years
- **State Filtering**: Click on map to filter cards by state
- **Sorting Options**: Sort by wins, teams, championships, or name

## API Endpoints

- `GET /api/teams` - Get all teams with stats
- `GET /api/teams/{team_id}` - Get single team details
- `GET /api/players` - Get all players
- `GET /api/compare?team1=LAL&team2=BOS&decade=1980s` - Compare two teams
- `GET /api/map-data` - Get all teams with coordinates for map
- `GET /api/states` - Get all states with aggregated stats and teams
- `GET /api/states/{state}` - Get state-level aggregated stats

## Data Sources

- **Primary Dataset**: `wyattowalsh/basketball` (Kaggle) - Team, player, and game data
- **Extended Stats**: `rodneycarroll78/nba-stats-1980-2024` (Kaggle) - Advanced player and team statistics
- **Championship Data**: `champs_and_runner_ups_series_averages.csv` - Championship and runner-up data (1980-2017)

## Technologies Used

- **Backend**: FastAPI, Python, Pandas
- **Frontend**: React, Vite, Tailwind CSS
- **Visualization**: D3.js (maps), Plotly.js (charts)
- **Data Processing**: Kaggle Hub, Pandas
- **Package Management**: UV (Python), npm (Node.js)

## Notes

- Team coordinates are hardcoded for current and historical locations
- Data is served from JSON files loaded in memory (no database required)
- The data processing script only needs to be run once to generate summary files
- Championship data is loaded from the CSV file during data processing
- Player images are loaded from multiple CDN sources with fallback to generated avatars
