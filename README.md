# Courtside

An interactive web dashboard for visualizing NBA team and state rivalries from 1946-2024 with an interactive US map and comparison tools.

## Project Structure

```
Courtside/
├── process_data.py          # Data processing script (stream, clean, generate summaries)
├── backend/
│   ├── app.py              # FastAPI application
│   ├── data/               # Generated JSON files
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx         # Main app component
    │   ├── Map.jsx         # D3.js interactive US map
    │   ├── Comparison.jsx # Comparison panel with Plotly charts
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
uv pip install --python venv/bin/python 'kagglehub[pandas-datasets]' pandas python-dotenv
```

2. Set up Kaggle API credentials:
   - Go to https://www.kaggle.com/settings
   - Create API token
   - Create a `.env` file in the root directory:
   ```
   KAGGLE_USERNAME=your_username
   KAGGLE_KEY=your_api_key
   ```

3. Run the data processing script:
```bash
python process_data.py
```

This will:
- Stream CSV files directly from Kaggle (no local download needed)
- Clean and process the data
- Generate 4 JSON summary files in `backend/data/`

### 2. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
uv pip install --python ../venv/bin/python -r requirements.txt
```

Or if you're in the project root:
```bash
uv pip install --python venv/bin/python -r backend/requirements.txt
```

3. Start the FastAPI server:
```bash
uvicorn app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

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

## API Endpoints

- `GET /api/teams` - Get all teams with stats
- `GET /api/teams/{team_id}` - Get single team details
- `GET /api/players` - Get all players
- `GET /api/compare?team1=LAL&team2=BOS&decade=1980s` - Compare two teams
- `GET /api/map-data` - Get all teams with coordinates for map
- `GET /api/states/{state}` - Get state-level aggregated stats

## Features

- **Interactive US Map**: Click on team cities to select teams for comparison
- **Team Comparison**: Compare any two teams with head-to-head records and statistics
- **Decade Filtering**: Filter comparisons by decade (1940s-2020s)
- **Visualizations**: Bar charts and statistics comparison using Plotly
- **Responsive Design**: Works on desktop and mobile devices

## Default Test Case

The dashboard defaults to comparing the Los Angeles Lakers (LAL) vs Boston Celtics (BOS) - one of the greatest rivalries in NBA history.

## Technologies Used

- **Backend**: FastAPI, Python
- **Frontend**: React, Vite, Tailwind CSS
- **Visualization**: D3.js (map), Plotly.js (charts)
- **Data**: Kaggle NBA dataset

## Notes

- Team coordinates are hardcoded for current and historical locations
- Data is served from JSON files loaded in memory (no database required)
- The data processing script only needs to be run once to generate summary files

