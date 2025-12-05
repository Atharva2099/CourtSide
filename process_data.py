"""
NBA Data Processing Script
Streams data from Kaggle dataset and generates summary JSON files
"""

import os
import json
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
import kagglehub
from kagglehub import KaggleDatasetAdapter

# Load environment variables
load_dotenv()

# Set up Kaggle credentials for kagglehub
# kagglehub uses the same credentials as Kaggle API
kaggle_dir = Path.home() / '.kaggle'
kaggle_dir.mkdir(exist_ok=True)
kaggle_json = kaggle_dir / 'kaggle.json'

# Check if we have credentials in .env
kaggle_username = os.getenv('KAGGLE_USERNAME')
kaggle_key = os.getenv('KAGGLE_KEY')

# If KAGGLE_API_TOKEN is provided as JSON string, parse it
if not kaggle_key and os.getenv('KAGGLE_API_TOKEN'):
    try:
        token_data = json.loads(os.getenv('KAGGLE_API_TOKEN'))
        kaggle_username = token_data.get('username') or kaggle_username
        kaggle_key = token_data.get('key')
    except (json.JSONDecodeError, AttributeError):
        # If it's not JSON, it might just be the key
        kaggle_key = os.getenv('KAGGLE_API_TOKEN')

# Create kaggle.json file if credentials are available
if kaggle_username and kaggle_key and not kaggle_json.exists():
    kaggle_creds = {
        'username': kaggle_username,
        'key': kaggle_key
    }
    with open(kaggle_json, 'w') as f:
        json.dump(kaggle_creds, f)
    # Set restrictive permissions (required by Kaggle)
    os.chmod(kaggle_json, 0o600)

# Set environment variables as backup
if kaggle_username:
    os.environ['KAGGLE_USERNAME'] = kaggle_username
if kaggle_key:
    os.environ['KAGGLE_KEY'] = kaggle_key

# Team abbreviation mapping for relocations
TEAM_ABBREV_MAP = {
    'NJN': 'BRK',  # New Jersey Nets → Brooklyn Nets
    'NOH': 'NOP',  # New Orleans Hornets → New Orleans Pelicans
    'CHA': 'CHO',  # Charlotte Bobcats → Charlotte Hornets (current)
    'CHH': 'CHO',  # Charlotte Hornets (old) → Charlotte Hornets (current)
    'SEA': 'OKC',  # Seattle SuperSonics → Oklahoma City Thunder
    'VAN': 'MEM',  # Vancouver Grizzlies → Memphis Grizzlies
    'NOK': 'NOP',  # New Orleans/Oklahoma City Hornets → New Orleans Pelicans
}

# Team city coordinates (lat, lng) - current and historical locations
TEAM_COORDINATES = {
    'ATL': {'city': 'Atlanta', 'state': 'Georgia', 'lat': 33.749, 'lng': -84.388},
    'BOS': {'city': 'Boston', 'state': 'Massachusetts', 'lat': 42.360, 'lng': -71.058},
    'BRK': {'city': 'Brooklyn', 'state': 'New York', 'lat': 40.678, 'lng': -73.944},
    'NJN': {'city': 'East Rutherford', 'state': 'New Jersey', 'lat': 40.813, 'lng': -74.074},
    'CHO': {'city': 'Charlotte', 'state': 'North Carolina', 'lat': 35.227, 'lng': -80.843},
    'CHA': {'city': 'Charlotte', 'state': 'North Carolina', 'lat': 35.227, 'lng': -80.843},
    'CHH': {'city': 'Charlotte', 'state': 'North Carolina', 'lat': 35.227, 'lng': -80.843},
    'CHI': {'city': 'Chicago', 'state': 'Illinois', 'lat': 41.878, 'lng': -87.629},
    'CLE': {'city': 'Cleveland', 'state': 'Ohio', 'lat': 41.499, 'lng': -81.694},
    'DAL': {'city': 'Dallas', 'state': 'Texas', 'lat': 32.776, 'lng': -96.796},
    'DEN': {'city': 'Denver', 'state': 'Colorado', 'lat': 39.739, 'lng': -104.990},
    'DET': {'city': 'Detroit', 'state': 'Michigan', 'lat': 42.331, 'lng': -83.045},
    'GSW': {'city': 'San Francisco', 'state': 'California', 'lat': 37.774, 'lng': -122.419},
    'HOU': {'city': 'Houston', 'state': 'Texas', 'lat': 29.760, 'lng': -95.369},
    'IND': {'city': 'Indianapolis', 'state': 'Indiana', 'lat': 39.768, 'lng': -86.158},
    'LAC': {'city': 'Los Angeles', 'state': 'California', 'lat': 34.052, 'lng': -118.243},
    'LAL': {'city': 'Los Angeles', 'state': 'California', 'lat': 34.052, 'lng': -118.243},
    'MEM': {'city': 'Memphis', 'state': 'Tennessee', 'lat': 35.149, 'lng': -90.048},
    'VAN': {'city': 'Vancouver', 'state': 'British Columbia', 'lat': 49.282, 'lng': -123.120},
    'MIA': {'city': 'Miami', 'state': 'Florida', 'lat': 25.761, 'lng': -80.191},
    'MIL': {'city': 'Milwaukee', 'state': 'Wisconsin', 'lat': 43.038, 'lng': -87.906},
    'MIN': {'city': 'Minneapolis', 'state': 'Minnesota', 'lat': 44.977, 'lng': -93.265},
    'NOP': {'city': 'New Orleans', 'state': 'Louisiana', 'lat': 29.951, 'lng': -90.071},
    'NOH': {'city': 'New Orleans', 'state': 'Louisiana', 'lat': 29.951, 'lng': -90.071},
    'NOK': {'city': 'Oklahoma City', 'state': 'Oklahoma', 'lat': 35.467, 'lng': -97.516},
    'NYK': {'city': 'New York', 'state': 'New York', 'lat': 40.712, 'lng': -74.005},
    'OKC': {'city': 'Oklahoma City', 'state': 'Oklahoma', 'lat': 35.467, 'lng': -97.516},
    'SEA': {'city': 'Seattle', 'state': 'Washington', 'lat': 47.606, 'lng': -122.332},
    'ORL': {'city': 'Orlando', 'state': 'Florida', 'lat': 28.538, 'lng': -81.379},
    'PHI': {'city': 'Philadelphia', 'state': 'Pennsylvania', 'lat': 39.952, 'lng': -75.165},
    'PHX': {'city': 'Phoenix', 'state': 'Arizona', 'lat': 33.448, 'lng': -112.074},
    'POR': {'city': 'Portland', 'state': 'Oregon', 'lat': 45.515, 'lng': -122.678},
    'SAC': {'city': 'Sacramento', 'state': 'California', 'lat': 38.581, 'lng': -121.494},
    'SAS': {'city': 'San Antonio', 'state': 'Texas', 'lat': 29.424, 'lng': -98.493},
    'TOR': {'city': 'Toronto', 'state': 'Ontario', 'lat': 43.653, 'lng': -79.383},
    'UTA': {'city': 'Salt Lake City', 'state': 'Utah', 'lat': 40.760, 'lng': -111.890},
    'WAS': {'city': 'Washington', 'state': 'District of Columbia', 'lat': 38.907, 'lng': -77.036},
}

def load_data():
    """Stream CSV files directly from Kaggle dataset"""
    print("Streaming data from Kaggle...")
    dataset = 'wyattowalsh/basketball'
    
    # Stream CSV files directly into pandas DataFrames
    print("  Loading team.csv...")
    teams_df = kagglehub.dataset_load(
        dataset,
        path="csv/team.csv",
        adapter=KaggleDatasetAdapter.PANDAS
    )
    print(f"  Loaded {len(teams_df)} teams")
    
    print("  Loading player.csv...")
    players_df = kagglehub.dataset_load(
        dataset,
        path="csv/player.csv",
        adapter=KaggleDatasetAdapter.PANDAS
    )
    print(f"  Loaded {len(players_df)} players")
    
    print("  Loading game.csv...")
    games_df = kagglehub.dataset_load(
        dataset,
        path="csv/game.csv",
        adapter=KaggleDatasetAdapter.PANDAS
    )
    print(f"  Loaded {len(games_df)} games")
    
    # Try to load game_summary.csv for box scores
    print("  Loading game_summary.csv...")
    try:
        box_scores_df = kagglehub.dataset_load(
            dataset,
            path="csv/game_summary.csv",
            adapter=KaggleDatasetAdapter.PANDAS
        )
        print(f"  Loaded {len(box_scores_df)} game summaries")
    except Exception as e:
        print(f"  game_summary.csv not available, using game.csv for box score data...")
        box_scores_df = games_df.copy()
    
    return teams_df, players_df, games_df, box_scores_df

def clean_data(teams_df, players_df, games_df, box_scores_df):
    """Clean and process CSV data"""
    print("Cleaning and processing data...")
    
    # Clean teams - map column names
    if 'abbreviation' in teams_df.columns:
        teams_df['abbreviation'] = teams_df['abbreviation'].replace(TEAM_ABBREV_MAP)
    
    # Clean games - map column names to expected format
    # game.csv has: team_id_home, team_abbreviation_home, pts_home, pts_away, game_date
    if 'game_date' in games_df.columns:
        games_df['date'] = pd.to_datetime(games_df['game_date'], errors='coerce')
        games_df = games_df.dropna(subset=['date'])
        games_df['date'] = games_df['date'].dt.strftime('%Y-%m-%d')
    
    # Map to expected column names for easier processing
    if 'team_abbreviation_home' in games_df.columns:
        games_df['home_team'] = games_df['team_abbreviation_home']
    if 'team_abbreviation_away' in games_df.columns:
        games_df['away_team'] = games_df['team_abbreviation_away']
    if 'pts_home' in games_df.columns:
        games_df['home_pts'] = games_df['pts_home']
    if 'pts_away' in games_df.columns:
        games_df['away_pts'] = games_df['pts_away']
    
    # Add decade
    if 'date' in games_df.columns:
        games_df['year'] = pd.to_datetime(games_df['date']).dt.year
        games_df['decade'] = (games_df['year'] // 10) * 10
        games_df['decade_str'] = games_df['decade'].astype(str) + 's'
    
    # Calculate game margin
    if 'home_pts' in games_df.columns and 'away_pts' in games_df.columns:
        games_df['game_margin'] = games_df['home_pts'] - games_df['away_pts']
    
    # Clean box scores
    if 'minutes' in box_scores_df.columns:
        box_scores_df = box_scores_df[box_scores_df['minutes'] >= 0]
    
    # Calculate FG%
    if 'fgm' in box_scores_df.columns and 'fga' in box_scores_df.columns:
        box_scores_df['fg_pct'] = box_scores_df.apply(
            lambda x: x['fgm'] / x['fga'] if x['fga'] > 0 else 0, axis=1
        )
    
    # Clean player names - map column names
    if 'full_name' in players_df.columns:
        players_df['name'] = players_df['full_name'].str.strip()
    elif 'first_name' in players_df.columns and 'last_name' in players_df.columns:
        players_df['name'] = (players_df['first_name'] + ' ' + players_df['last_name']).str.strip()
    
    # Map player id column
    if 'id' in players_df.columns and 'player_id' not in players_df.columns:
        players_df['player_id'] = players_df['id']
    
    print("Data cleaning complete!")
    return teams_df, players_df, games_df, box_scores_df

def generate_team_summary(teams_df, games_df):
    """Generate team_summary.json"""
    print("Generating team summary...")
    
    team_stats = {}
    
    # Initialize with team info
    for _, team in teams_df.iterrows():
        abbrev = team.get('abbreviation', '')
        if not abbrev:
            continue
        team_stats[abbrev] = {
            'team_id': team.get('id') or team.get('team_id'),
            'name': team.get('full_name') or team.get('name', ''),
            'city': team.get('city', ''),
            'state': team.get('state', ''),
            'abbreviation': abbrev,
            'total_wins': 0,
            'total_losses': 0,
            'championships': 0,
        }
    
    # Calculate wins/losses from games
    if 'home_team' in games_df.columns and 'away_team' in games_df.columns:
        for _, game in games_df.iterrows():
            home_team = game.get('home_team')
            away_team = game.get('away_team')
            home_pts = game.get('home_pts', 0)
            away_pts = game.get('away_pts', 0)
            
            # Skip if missing data
            if pd.isna(home_team) or pd.isna(away_team) or pd.isna(home_pts) or pd.isna(away_pts):
                continue
            
            if home_team in team_stats:
                if home_pts > away_pts:
                    team_stats[home_team]['total_wins'] += 1
                else:
                    team_stats[home_team]['total_losses'] += 1
            
            if away_team in team_stats:
                if away_pts > home_pts:
                    team_stats[away_team]['total_wins'] += 1
                else:
                    team_stats[away_team]['total_losses'] += 1
    
    # Calculate win percentage and add coordinates
    team_summary = []
    for abbrev, stats in team_stats.items():
        total_games = stats['total_wins'] + stats['total_losses']
        win_pct = stats['total_wins'] / total_games if total_games > 0 else 0
        
        coords = TEAM_COORDINATES.get(abbrev, {})
        
        team_summary.append({
            'team_id': stats['team_id'],
            'name': stats['name'],
            'city': coords.get('city', stats['city']),
            'state': coords.get('state', stats['state']),
            'abbreviation': abbrev,
            'total_wins': stats['total_wins'],
            'total_losses': stats['total_losses'],
            'win_pct': round(win_pct, 3),
            'championships': stats['championships'],
            'lat': coords.get('lat', 0),
            'lng': coords.get('lng', 0),
        })
    
    return team_summary

def generate_player_summary(players_df, box_scores_df):
    """Generate player_summary.json"""
    print("Generating player summary...")
    
    player_stats = {}
    
    # For player stats, we'll create a simplified version since box_scores might not have player-level data
    # We'll create player summaries from the players dataframe
    player_summary = []
    for _, player in players_df.iterrows():
        player_id = player.get('player_id') or player.get('id')
        player_name = player.get('name') or player.get('full_name', '')
        
        if not player_id:
            continue
        
        # Initialize with basic info - stats would need to come from a different source
        # For MVP, we'll create placeholder stats
        player_summary.append({
            'player_id': player_id,
            'name': player_name,
            'teams': [],  # Would need to join with game data
            'career_ppg': 0,  # Placeholder - would need box score data
            'career_rpg': 0,
            'career_apg': 0,
            'total_games': 0,
        })
    
    return player_summary

def generate_rivalry_summary(games_df):
    """Generate rivalry_summary.json"""
    print("Generating rivalry summary...")
    
    rivalries = {}
    
    if 'home_team' in games_df.columns and 'away_team' in games_df.columns:
        for _, game in games_df.iterrows():
            home_team = game.get('home_team')
            away_team = game.get('away_team')
            home_pts = game.get('home_pts', 0)
            away_pts = game.get('away_pts', 0)
            
            # Skip if missing data
            if pd.isna(home_team) or pd.isna(away_team) or pd.isna(home_pts) or pd.isna(away_pts):
                continue
            
            # Create sorted pair key
            pair = tuple(sorted([str(home_team), str(away_team)]))
            
            if pair not in rivalries:
                rivalries[pair] = {
                    'team1': pair[0],
                    'team2': pair[1],
                    'total_meetings': 0,
                    'team1_wins': 0,
                    'team2_wins': 0,
                }
            
            rivalries[pair]['total_meetings'] += 1
            
            # Determine winner
            if str(home_team) == pair[0]:
                if home_pts > away_pts:
                    rivalries[pair]['team1_wins'] += 1
                else:
                    rivalries[pair]['team2_wins'] += 1
            else:
                if away_pts > home_pts:
                    rivalries[pair]['team1_wins'] += 1
                else:
                    rivalries[pair]['team2_wins'] += 1
    
    return list(rivalries.values())

def generate_state_summary(team_summary):
    """Generate state_summary.json"""
    print("Generating state summary...")
    
    state_stats = {}
    
    for team in team_summary:
        state = team.get('state', '')
        if not state:
            continue
        
        if state not in state_stats:
            state_stats[state] = {
                'state_name': state,
                'total_teams': 0,
                'aggregate_wins': 0,
                'aggregate_losses': 0,
                'aggregate_championships': 0,
            }
        
        state_stats[state]['total_teams'] += 1
        state_stats[state]['aggregate_wins'] += team.get('total_wins', 0)
        state_stats[state]['aggregate_losses'] += team.get('total_losses', 0)
        state_stats[state]['aggregate_championships'] += team.get('championships', 0)
    
    return list(state_stats.values())

def main():
    """Main execution function"""
    print("Starting NBA data processing...")
    
    # Stream data from Kaggle
    teams_df, players_df, games_df, box_scores_df = load_data()
    
    # Clean and process data
    teams_df, players_df, games_df, box_scores_df = clean_data(teams_df, players_df, games_df, box_scores_df)
    
    # Generate summaries
    team_summary = generate_team_summary(teams_df, games_df)
    player_summary = generate_player_summary(players_df, box_scores_df)
    rivalry_summary = generate_rivalry_summary(games_df)
    state_summary = generate_state_summary(team_summary)
    
    # Save to backend/data/
    output_dir = Path('backend/data')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    with open(output_dir / 'team_summary.json', 'w') as f:
        json.dump(team_summary, f, indent=2)
    
    with open(output_dir / 'player_summary.json', 'w') as f:
        json.dump(player_summary, f, indent=2)
    
    with open(output_dir / 'rivalry_summary.json', 'w') as f:
        json.dump(rivalry_summary, f, indent=2)
    
    with open(output_dir / 'state_summary.json', 'w') as f:
        json.dump(state_summary, f, indent=2)
    
    print(f"\nSummary files generated in {output_dir}/")
    print(f"- team_summary.json: {len(team_summary)} teams")
    print(f"- player_summary.json: {len(player_summary)} players")
    print(f"- rivalry_summary.json: {len(rivalry_summary)} rivalries")
    print(f"- state_summary.json: {len(state_summary)} states")

if __name__ == '__main__':
    main()

