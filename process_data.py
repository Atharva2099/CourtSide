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

# Mapping from CSV team names to abbreviations
CHAMPIONSHIP_TEAM_NAME_MAP = {
    'Lakers': 'LAL',
    'Celtics': 'BOS',
    'Rockets': 'HOU',
    'Sixers': 'PHI',
    'Pistons': 'DET',
    'Blazers': 'POR',
    'Bulls': 'CHI',
    'Suns': 'PHX',
    'Knicks': 'NYK',
    'Magic': 'ORL',
    'Spurs': 'SAS',
    'Heat': 'MIA',
    'Mavericks': 'DAL',
    'Cavaliers': 'CLE',
    'Thunder': 'OKC',
    'Warriors': 'GSW',
    'Sonics': 'OKC',  # Seattle SuperSonics → Oklahoma City Thunder
    'Jazz': 'UTA',
    'Pacers': 'IND',
    'Nets': 'BRK',
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
    """Load CSV files from Kaggle datasets"""
    print("Loading data from Kaggle...")
    dataset1 = 'wyattowalsh/basketball'
    dataset2 = 'rodneycarroll78/nba-stats-1980-2024'
    
    # Load original dataset files
    print("  Loading team.csv from wyattowalsh/basketball...")
    teams_df = kagglehub.dataset_load(
        KaggleDatasetAdapter.PANDAS,
        dataset1,
        path="csv/team.csv"
    )
    print(f"  Loaded {len(teams_df)} teams")
    
    print("  Loading player.csv from wyattowalsh/basketball...")
    players_df = kagglehub.dataset_load(
        KaggleDatasetAdapter.PANDAS,
        dataset1,
        path="csv/player.csv"
    )
    print(f"  Loaded {len(players_df)} players")
    
    print("  Loading game.csv from wyattowalsh/basketball...")
    games_df = kagglehub.dataset_load(
        KaggleDatasetAdapter.PANDAS,
        dataset1,
        path="csv/game.csv"
    )
    print(f"  Loaded {len(games_df)} games")
    
    # Download the new dataset first
    print("  Downloading rodneycarroll78/nba-stats-1980-2024...")
    player_totals_df = pd.DataFrame()
    team_stats_per_game_df = pd.DataFrame()
    team_summaries_df = pd.DataFrame()
    
    try:
        dataset_path = kagglehub.dataset_download(dataset2)
        print(f"  Dataset downloaded to: {dataset_path}")
        
        # Load player stats from the downloaded dataset
        print("  Loading player_totals.csv...")
        player_totals_path = Path(dataset_path) / "player_totals.csv"
        if player_totals_path.exists():
            player_totals_df = pd.read_csv(player_totals_path)
            print(f"  Loaded {len(player_totals_df)} player season records")
        else:
            print(f"  player_totals.csv not found in {dataset_path}")
            # Try alternative names
            for alt_name in ["Player Totals.csv", "player_totals.CSV"]:
                alt_path = Path(dataset_path) / alt_name
                if alt_path.exists():
                    player_totals_df = pd.read_csv(alt_path)
                    print(f"  Loaded {len(player_totals_df)} player season records from {alt_name}")
                    break
        
        # Load team stats per game
        print("  Loading team_stats_per_game.csv...")
        team_stats_path = Path(dataset_path) / "team_stats_per_game.csv"
        if team_stats_path.exists():
            team_stats_per_game_df = pd.read_csv(team_stats_path)
            print(f"  Loaded {len(team_stats_per_game_df)} team season records")
        else:
            print(f"  team_stats_per_game.csv not found, trying alternative names...")
            for alt_name in ["Team Stats Per Game.csv", "team_stats_per_game.CSV"]:
                alt_path = Path(dataset_path) / alt_name
                if alt_path.exists():
                    team_stats_per_game_df = pd.read_csv(alt_path)
                    print(f"  Loaded {len(team_stats_per_game_df)} team season records from {alt_name}")
                    break
        
        # Load team summaries (advanced stats)
        print("  Loading team_summaries.csv...")
        team_summaries_path = Path(dataset_path) / "team_summaries.csv"
        if team_summaries_path.exists():
            team_summaries_df = pd.read_csv(team_summaries_path)
            print(f"  Loaded {len(team_summaries_df)} team summary records")
        else:
            print(f"  team_summaries.csv not found, trying alternative names...")
            for alt_name in ["Team Summaries.csv", "team_summaries.CSV"]:
                alt_path = Path(dataset_path) / alt_name
                if alt_path.exists():
                    team_summaries_df = pd.read_csv(alt_path)
                    print(f"  Loaded {len(team_summaries_df)} team summary records from {alt_name}")
                    break
        
        # Load advanced player stats
        print("  Loading advanced.csv...")
        advanced_df = pd.DataFrame()
        advanced_path = Path(dataset_path) / "advanced.csv"
        if advanced_path.exists():
            advanced_df = pd.read_csv(advanced_path)
            print(f"  Loaded {len(advanced_df)} advanced stat records")
        else:
            for alt_name in ["Advanced.csv", "advanced.CSV"]:
                alt_path = Path(dataset_path) / alt_name
                if alt_path.exists():
                    advanced_df = pd.read_csv(alt_path)
                    print(f"  Loaded {len(advanced_df)} advanced stat records from {alt_name}")
                    break
        
        # Load all-star selections
        print("  Loading all_star_selections.csv...")
        all_star_df = pd.DataFrame()
        all_star_path = Path(dataset_path) / "all_star_selections.csv"
        if all_star_path.exists():
            all_star_df = pd.read_csv(all_star_path)
            print(f"  Loaded {len(all_star_df)} all-star selections")
        else:
            for alt_name in ["All Star Selections.csv", "all_star_selections.CSV"]:
                alt_path = Path(dataset_path) / alt_name
                if alt_path.exists():
                    all_star_df = pd.read_csv(alt_path)
                    print(f"  Loaded {len(all_star_df)} all-star selections from {alt_name}")
                    break
        
        # Load awards (MVP, All-NBA, etc.)
        print("  Loading awards_voting_results.csv...")
        awards_df = pd.DataFrame()
        awards_path = Path(dataset_path) / "awards_voting_results.csv"
        if awards_path.exists():
            awards_df = pd.read_csv(awards_path)
            print(f"  Loaded {len(awards_df)} award voting records")
        else:
            for alt_name in ["Awards Voting Results.csv", "awards_voting_results.CSV"]:
                alt_path = Path(dataset_path) / alt_name
                if alt_path.exists():
                    awards_df = pd.read_csv(alt_path)
                    print(f"  Loaded {len(awards_df)} award voting records from {alt_name}")
                    break
        
        # List available files for debugging
        if player_totals_df.empty or team_stats_per_game_df.empty:
            print(f"  Available files in dataset:")
            for file in Path(dataset_path).glob("*.csv"):
                print(f"    - {file.name}")
                
    except Exception as e:
        print(f"  Error downloading/loading dataset: {e}")
        print(f"  Will continue with placeholder stats")
        advanced_df = pd.DataFrame()
        all_star_df = pd.DataFrame()
        awards_df = pd.DataFrame()
    
    # Use player_totals as box_scores for player stats calculation
    box_scores_df = player_totals_df if not player_totals_df.empty else games_df.copy()
    
    return teams_df, players_df, games_df, box_scores_df, team_stats_per_game_df, team_summaries_df, advanced_df, all_star_df, awards_df

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

def load_championship_data():
    """Load championship data from CSV file"""
    print("Loading championship data...")
    championships = {}
    championship_years = {}
    
    csv_path = Path('champs_and_runner_ups_series_averages.csv')
    if not csv_path.exists():
        print(f"  Warning: {csv_path} not found, championships will be 0")
        return championships, championship_years
    
    try:
        champs_df = pd.read_csv(csv_path)
        
        # Process championship data
        for _, row in champs_df.iterrows():
            if row.get('Status') == 'Champion':
                team_name = str(row.get('Team', '')).strip()
                year = int(row.get('Year', 0))
                
                # Map team name to abbreviation
                abbrev = CHAMPIONSHIP_TEAM_NAME_MAP.get(team_name)
                if abbrev:
                    if abbrev not in championships:
                        championships[abbrev] = 0
                        championship_years[abbrev] = []
                    championships[abbrev] += 1
                    championship_years[abbrev].append(year)
        
        print(f"  Loaded championship data for {len(championships)} teams")
        for abbrev, count in sorted(championships.items(), key=lambda x: x[1], reverse=True):
            years = sorted(championship_years[abbrev])
            print(f"    {abbrev}: {count} championships ({', '.join(map(str, years))})")
        
    except Exception as e:
        print(f"  Error loading championship data: {e}")
        print(f"  Championships will be 0")
    
    return championships, championship_years

def generate_team_summary(teams_df, games_df, team_stats_per_game_df=None, team_summaries_df=None, championships=None, championship_years=None):
    """Generate team_summary.json"""
    print("Generating team summary...")
    
    # Load championship data if not provided
    if championships is None or championship_years is None:
        championships, championship_years = load_championship_data()
    
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
            'championships': championships.get(abbrev, 0),
            'championship_years': sorted(championship_years.get(abbrev, [])),
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
        
        team_data = {
            'team_id': stats['team_id'],
            'name': stats['name'],
            'city': coords.get('city', stats['city']),
            'state': coords.get('state', stats['state']),
            'abbreviation': abbrev,
            'total_wins': stats['total_wins'],
            'total_losses': stats['total_losses'],
            'win_pct': round(win_pct, 3),
            'championships': stats['championships'],
            'championship_years': stats.get('championship_years', []),
            'lat': coords.get('lat', 0),
            'lng': coords.get('lng', 0),
        }
        
        # Add per-game stats if available
        if team_stats_per_game_df is not None and not team_stats_per_game_df.empty:
            team_seasons = team_stats_per_game_df[team_stats_per_game_df['abbreviation'].str.upper() == abbrev.upper()]
            if not team_seasons.empty:
                # Calculate career averages
                team_data['ppg'] = round(team_seasons['pts_per_game'].mean() if 'pts_per_game' in team_seasons.columns else 0, 2)
                team_data['rpg'] = round(team_seasons['trb_per_game'].mean() if 'trb_per_game' in team_seasons.columns else 0, 2)
                team_data['apg'] = round(team_seasons['ast_per_game'].mean() if 'ast_per_game' in team_seasons.columns else 0, 2)
                team_data['spg'] = round(team_seasons['stl_per_game'].mean() if 'stl_per_game' in team_seasons.columns else 0, 2)
                team_data['bpg'] = round(team_seasons['blk_per_game'].mean() if 'blk_per_game' in team_seasons.columns else 0, 2)
                team_data['fg_pct'] = round(team_seasons['fg_percent'].mean() if 'fg_percent' in team_seasons.columns else 0, 4)
                team_data['3p_pct'] = round(team_seasons['x3p_percent'].mean() if 'x3p_percent' in team_seasons.columns else 0, 4)
                team_data['ft_pct'] = round(team_seasons['ft_percent'].mean() if 'ft_percent' in team_seasons.columns else 0, 4)
        
        # Add advanced stats if available
        if team_summaries_df is not None and not team_summaries_df.empty:
            team_summaries = team_summaries_df[team_summaries_df['abbreviation'].str.upper() == abbrev.upper()]
            if not team_summaries.empty:
                team_data['offensive_rating'] = round(team_summaries['o_rtg'].mean() if 'o_rtg' in team_summaries.columns else 0, 2)
                team_data['defensive_rating'] = round(team_summaries['d_rtg'].mean() if 'd_rtg' in team_summaries.columns else 0, 2)
                team_data['net_rating'] = round(team_summaries['n_rtg'].mean() if 'n_rtg' in team_summaries.columns else 0, 2)
                team_data['pace'] = round(team_summaries['pace'].mean() if 'pace' in team_summaries.columns else 0, 2)
                team_data['ts_pct'] = round(team_summaries['ts_percent'].mean() if 'ts_percent' in team_summaries.columns else 0, 4)
                team_data['efg_pct'] = round(team_summaries['e_fg_percent'].mean() if 'e_fg_percent' in team_summaries.columns else 0, 4)
        
        team_summary.append(team_data)
    
    return team_summary

def generate_player_summary(players_df, box_scores_df, advanced_df=None, all_star_df=None, awards_df=None):
    """Generate player_summary.json"""
    print("Generating player summary...")
    
    player_stats = {}
    
    # Initialize all players
    for _, player in players_df.iterrows():
        player_id = player.get('player_id') or player.get('id')
        player_name = player.get('name') or player.get('full_name', '')
        
        if not player_id:
            continue
        
        player_stats[player_id] = {
            'player_id': player_id,
            'name': player_name,
            'teams': set(),  # Use set to avoid duplicates
            'total_points': 0,
            'total_rebounds': 0,
            'total_assists': 0,
            'total_steals': 0,
            'total_blocks': 0,
            'total_games': 0,
            'total_fg_made': 0,
            'total_fg_attempted': 0,
            'total_3p_made': 0,
            'total_3p_attempted': 0,
            'total_ft_made': 0,
            'total_ft_attempted': 0,
        }
    
    # Calculate stats from player_totals if available
    if not box_scores_df.empty and len(box_scores_df) > 0:
        # Check what columns are available
        print(f"  Player totals columns: {list(box_scores_df.columns)}")
        
        # The player_totals table should have: player_id, pts, trb, ast, g, tm
        player_id_col = 'player_id'
        pts_col = 'pts'
        reb_col = 'trb'  # Total rebounds
        ast_col = 'ast'
        games_col = 'g'
        team_col = 'tm'  # Team abbreviation
        
        # Check if columns exist
        if player_id_col in box_scores_df.columns:
            print(f"  Calculating stats from player_totals using columns: player_id={player_id_col}, pts={pts_col}, reb={reb_col}, ast={ast_col}, games={games_col}, team={team_col}")
            
            # Create a mapping from player_totals player_id/name to our player_stats
            # First try by player_id, then by name
            player_name_col = 'player' if 'player' in box_scores_df.columns else None
            
            # Group by player_id and aggregate
            for stats_player_id, group in box_scores_df.groupby(player_id_col):
                if pd.isna(stats_player_id):
                    continue
                
                # Try to find matching player in our player_stats
                target_player_id = None
                
                # First try direct player_id match
                if stats_player_id in player_stats:
                    target_player_id = stats_player_id
                # If not found, try matching by name
                elif player_name_col and player_name_col in group.columns:
                    player_name = group[player_name_col].iloc[0] if len(group) > 0 else None
                    if player_name:
                        # Find player by name
                        for pid, pdata in player_stats.items():
                            if pdata['name'].lower() == str(player_name).lower():
                                target_player_id = pid
                                break
                
                if target_player_id is None:
                    # Create new entry for player not in original dataset
                    if player_name_col and player_name_col in group.columns:
                        player_name = group[player_name_col].iloc[0]
                        target_player_id = stats_player_id
                        player_stats[target_player_id] = {
                            'player_id': target_player_id,
                            'name': player_name,
                            'teams': set(),
                            'total_points': 0,
                            'total_rebounds': 0,
                            'total_assists': 0,
                            'total_steals': 0,
                            'total_blocks': 0,
                            'total_games': 0,
                            'total_fg_made': 0,
                            'total_fg_attempted': 0,
                            'total_3p_made': 0,
                            'total_3p_attempted': 0,
                            'total_ft_made': 0,
                            'total_ft_attempted': 0,
                        }
                    else:
                        continue
                
                # Sum totals across all seasons
                total_games = group[games_col].sum() if games_col in group.columns else len(group)
                total_points = group[pts_col].sum() if pts_col in group.columns else 0
                total_rebounds = group[reb_col].sum() if reb_col in group.columns else 0
                total_assists = group[ast_col].sum() if ast_col in group.columns else 0
                total_steals = group['stl'].sum() if 'stl' in group.columns else 0
                total_blocks = group['blk'].sum() if 'blk' in group.columns else 0
                total_fg_made = group['fg'].sum() if 'fg' in group.columns else 0
                total_fg_attempted = group['fga'].sum() if 'fga' in group.columns else 0
                total_3p_made = group['x3p'].sum() if 'x3p' in group.columns else 0
                total_3p_attempted = group['x3pa'].sum() if 'x3pa' in group.columns else 0
                total_ft_made = group['ft'].sum() if 'ft' in group.columns else 0
                total_ft_attempted = group['fta'].sum() if 'fta' in group.columns else 0
                
                player_stats[target_player_id]['total_games'] += int(total_games)
                player_stats[target_player_id]['total_points'] += float(total_points)
                player_stats[target_player_id]['total_rebounds'] += float(total_rebounds)
                player_stats[target_player_id]['total_assists'] += float(total_assists)
                player_stats[target_player_id]['total_steals'] += float(total_steals)
                player_stats[target_player_id]['total_blocks'] += float(total_blocks)
                player_stats[target_player_id]['total_fg_made'] += float(total_fg_made)
                player_stats[target_player_id]['total_fg_attempted'] += float(total_fg_attempted)
                player_stats[target_player_id]['total_3p_made'] += float(total_3p_made)
                player_stats[target_player_id]['total_3p_attempted'] += float(total_3p_attempted)
                player_stats[target_player_id]['total_ft_made'] += float(total_ft_made)
                player_stats[target_player_id]['total_ft_attempted'] += float(total_ft_attempted)
                
                # Collect unique teams
                if team_col in group.columns:
                    for team in group[team_col].dropna().unique():
                        team_abbrev = str(team).upper().strip()
                        # Map old abbreviations to new ones
                        team_abbrev = TEAM_ABBREV_MAP.get(team_abbrev, team_abbrev)
                        if team_abbrev:
                            player_stats[target_player_id]['teams'].add(team_abbrev)
        else:
            print("  No player_id column found in player_totals, using placeholder stats")
    
    # Process advanced stats
    if advanced_df is not None and not advanced_df.empty and 'player_id' in advanced_df.columns:
        print("  Processing advanced stats...")
        for player_id, group in advanced_df.groupby('player_id'):
            if pd.isna(player_id):
                continue
            if player_id in player_stats:
                # Calculate career averages for advanced stats
                player_stats[player_id]['total_per'] = group['per'].sum() if 'per' in group.columns else 0
                player_stats[player_id]['total_bpm'] = group['bpm'].sum() if 'bpm' in group.columns else 0
                player_stats[player_id]['total_vorp'] = group['vorp'].sum() if 'vorp' in group.columns else 0
                player_stats[player_id]['total_ws'] = group['ws'].sum() if 'ws' in group.columns else 0
                player_stats[player_id]['total_usg_pct'] = group['usg_percent'].sum() if 'usg_percent' in group.columns else 0
                player_stats[player_id]['total_ts_pct'] = group['ts_percent'].sum() if 'ts_percent' in group.columns else 0
                player_stats[player_id]['total_efg_pct'] = group['e_fg_percent'].sum() if 'e_fg_percent' in group.columns else 0
                player_stats[player_id]['advanced_seasons'] = len(group)
    
    # Process all-star selections
    all_star_counts = {}
    if all_star_df is not None and not all_star_df.empty:
        print("  Processing all-star selections...")
        if 'player' in all_star_df.columns:
            for _, row in all_star_df.iterrows():
                player_name = str(row['player']).strip()
                if player_name:
                    all_star_counts[player_name] = all_star_counts.get(player_name, 0) + 1
    
    # Process awards (MVP, All-NBA)
    mvp_counts = {}
    all_nba_counts = {}
    if awards_df is not None and not awards_df.empty:
        print("  Processing awards...")
        if 'player' in awards_df.columns and 'award' in awards_df.columns:
            for _, row in awards_df.iterrows():
                player_name = str(row['player']).strip()
                award = str(row['award']).strip().upper() if pd.notna(row['award']) else ''
                if player_name:
                    if 'MVP' in award:
                        mvp_counts[player_name] = mvp_counts.get(player_name, 0) + 1
                    if 'ALL-NBA' in award or 'ALL NBA' in award:
                        all_nba_counts[player_name] = all_nba_counts.get(player_name, 0) + 1
    
    # Convert to final format
    player_summary = []
    for player_id, stats in player_stats.items():
        total_games = stats['total_games']
        career_ppg = stats['total_points'] / total_games if total_games > 0 else 0
        career_rpg = stats['total_rebounds'] / total_games if total_games > 0 else 0
        career_apg = stats['total_assists'] / total_games if total_games > 0 else 0
        career_spg = stats['total_steals'] / total_games if total_games > 0 else 0
        career_bpg = stats['total_blocks'] / total_games if total_games > 0 else 0
        
        # Calculate shooting percentages
        fg_pct = stats['total_fg_made'] / stats['total_fg_attempted'] if stats['total_fg_attempted'] > 0 else 0
        three_pct = stats['total_3p_made'] / stats['total_3p_attempted'] if stats['total_3p_attempted'] > 0 else 0
        ft_pct = stats['total_ft_made'] / stats['total_ft_attempted'] if stats['total_ft_attempted'] > 0 else 0
        
        # Advanced stats averages
        advanced_seasons = stats.get('advanced_seasons', 0)
        career_per = stats.get('total_per', 0) / advanced_seasons if advanced_seasons > 0 else 0
        career_bpm = stats.get('total_bpm', 0) / advanced_seasons if advanced_seasons > 0 else 0
        career_vorp = stats.get('total_vorp', 0)  # VORP is cumulative
        career_ws = stats.get('total_ws', 0)  # Win shares are cumulative
        career_usg_pct = stats.get('total_usg_pct', 0) / advanced_seasons if advanced_seasons > 0 else 0
        career_ts_pct = stats.get('total_ts_pct', 0) / advanced_seasons if advanced_seasons > 0 else 0
        career_efg_pct = stats.get('total_efg_pct', 0) / advanced_seasons if advanced_seasons > 0 else 0
        
        # Awards
        player_name = stats['name']
        all_star_appearances = all_star_counts.get(player_name, 0)
        mvp_count = mvp_counts.get(player_name, 0)
        all_nba_count = all_nba_counts.get(player_name, 0)
        
        player_summary.append({
            'player_id': player_id,
            'name': stats['name'],
            'teams': sorted(list(stats['teams'])),  # Convert set to sorted list
            'career_ppg': round(career_ppg, 1),
            'career_rpg': round(career_rpg, 1),
            'career_apg': round(career_apg, 1),
            'career_spg': round(career_spg, 1),
            'career_bpg': round(career_bpg, 1),
            'career_fg_pct': round(fg_pct, 4),
            'career_3p_pct': round(three_pct, 4),
            'career_ft_pct': round(ft_pct, 4),
            'career_ts_pct': round(career_ts_pct, 4),
            'career_efg_pct': round(career_efg_pct, 4),
            'career_per': round(career_per, 1),
            'career_bpm': round(career_bpm, 1),
            'career_vorp': round(career_vorp, 1),
            'career_ws': round(career_ws, 1),
            'career_usg_pct': round(career_usg_pct, 4),
            'all_star_appearances': all_star_appearances,
            'mvp_count': mvp_count,
            'all_nba_count': all_nba_count,
            'total_games': total_games,
        })
    
    print(f"  Generated stats for {len(player_summary)} players")
    print(f"  Players with stats: {sum(1 for p in player_summary if p['total_games'] > 0)}")
    
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
    teams_df, players_df, games_df, box_scores_df, team_stats_per_game_df, team_summaries_df, advanced_df, all_star_df, awards_df = load_data()
    
    # Clean and process data
    teams_df, players_df, games_df, box_scores_df = clean_data(teams_df, players_df, games_df, box_scores_df)
    
    # Load championship data
    championships, championship_years = load_championship_data()
    
    # Generate summaries
    team_summary = generate_team_summary(teams_df, games_df, team_stats_per_game_df, team_summaries_df, championships, championship_years)
    player_summary = generate_player_summary(players_df, box_scores_df, advanced_df, all_star_df, awards_df)
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

