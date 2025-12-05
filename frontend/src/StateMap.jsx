import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getStates } from './api';

export default function StateMap({ onStateSelect, selectedState = null, statesData = [] }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const mapDataRef = useRef(null);


  const renderMap = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    svg.attr('width', width).attr('height', height);

    // Create projection (Albers USA)
    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale([1000]);

    const path = d3.geoPath().projection(projection);

    // Create a map from state names to stats
    const stateStatsMap = {};
    if (statesData && statesData.length > 0) {
      statesData.forEach(state => {
        stateStatsMap[state.state_name] = state;
      });
    }

    // Load US states TopoJSON from CDN
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(us => {
        const states = topojson.feature(us, us.objects.states);
        
        // Draw states
        const statePaths = svg.append('g')
          .selectAll('path')
          .data(states.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', d => {
            const stateName = d.properties.name;
            const stats = stateStatsMap[stateName];
            if (selectedState === stateName) {
              return '#1D428A'; // NBA Blue for selected
            }
            if (stats) {
              // Color based on number of teams or wins
              const teamCount = stats.total_teams || 0;
              if (teamCount > 0) {
                return '#E8E8E3'; // Light gray for states with teams
              }
            }
            return '#F5F5F5'; // Very light gray for states without teams
          })
          .attr('stroke', d => {
            const stateName = d.properties.name;
            return selectedState === stateName ? '#C8102E' : '#999';
          })
          .attr('stroke-width', d => {
            const stateName = d.properties.name;
            return selectedState === stateName ? 2 : 0.5;
          })
          .attr('cursor', 'pointer')
          .style('transition', 'all 0.2s')
          .on('mouseover', function(event, d) {
            const stateName = d.properties.name;
            const stats = stateStatsMap[stateName];
            
            d3.select(this)
              .attr('fill', stats ? '#1D428A' : '#D0D0D0')
              .attr('stroke-width', 2)
              .attr('stroke', '#C8102E');
            
            if (tooltipRef.current && stats) {
              // Get state bounding box to position tooltip outside it
              const bounds = path.bounds(d);
              const centroid = path.centroid(d);
              
              // Convert SVG coordinates to screen coordinates
              const svgRect = svgRef.current.getBoundingClientRect();
              const [centroidX, centroidY] = centroid;
              const [minX, minY] = bounds[0];
              const [maxX, maxY] = bounds[1];
              
              const stateWidth = maxX - minX;
              const stateHeight = maxY - minY;
              
              // Position tooltip to the right of the state by default
              // If that would go off screen, try left, then top, then bottom
              let screenX = svgRect.left + maxX + 20; // 20px padding outside state
              let screenY = svgRect.top + centroidY;
              
              const winPct = stats.aggregate_wins + stats.aggregate_losses > 0
                ? ((stats.aggregate_wins / (stats.aggregate_wins + stats.aggregate_losses)) * 100).toFixed(1)
                : 0;
              // Get team logos for background
              const teams = stats.teams || [];
              const getTeamLogoUrl = (team) => {
                const teamId = team.team_id;
                if (teamId) {
                  return `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`;
                }
                return null;
              };
              
              const logosBackground = teams.length > 0 
                ? teams.map((team, idx) => {
                    const logoUrl = getTeamLogoUrl(team);
                    if (!logoUrl) return '';
                    return `<img src="${logoUrl}" style="position: absolute; opacity: 0.2; width: 80px; height: 80px; object-fit: contain; z-index: 0; top: ${20 + Math.floor(idx / 2) * 100}px; left: ${(idx % 2) * 100 + 20}px;" onerror="this.style.display='none';" />`;
                  }).filter(Boolean).join('')
                : '';
              
              const teamsList = teams.length > 0
                ? teams.map((team, idx) => {
                    const logoUrl = getTeamLogoUrl(team);
                    const teamName = team.name || team.abbreviation || 'Unknown';
                    const championships = team.championships || 0;
                    return `
                      <div style="display: flex; align-items: center; justify-content: space-between; margin: 4px 0; position: relative; z-index: 1;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          ${logoUrl ? `<img src="${logoUrl}" style="width: 16px; height: 16px;" onerror="this.style.display='none';" />` : ''}
                          <span style="color: white; font-size: 11px; font-family: 'Inter', sans-serif;">${teamName}</span>
                        </div>
                        <span style="color: white; font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif;">${championships} 🏆</span>
                      </div>
                    `;
                  }).join('')
                : '';
              
              // Position tooltip outside state bounding box
              const tooltip = tooltipRef.current;
              tooltip.style.display = 'block';
              
              // Set initial position (will be adjusted after content renders)
              tooltip.style.left = screenX + 'px';
              tooltip.style.top = screenY + 'px';
              tooltip.style.transform = 'translateY(-50%)'; // Center vertically on state
              
              tooltip.innerHTML = `
                <div style="position: relative; min-width: 250px; padding: 20px;">
                  ${logosBackground}
                  <div style="position: relative; z-index: 1;">
                    <h3 style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 12px; font-family: 'Bebas Neue', 'Oswald', sans-serif; letter-spacing: 1px;">
                      ${stateName}
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-family: 'Inter', sans-serif; font-size: 12px;">
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #9CA3AF;">Teams:</span>
                        <span style="color: white; font-weight: 600;">${stats.total_teams || 0}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #9CA3AF;">Wins:</span>
                        <span style="color: white; font-weight: 600;">${stats.aggregate_wins || 0}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #9CA3AF;">Losses:</span>
                        <span style="color: white; font-weight: 600;">${stats.aggregate_losses || 0}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #9CA3AF;">Win %:</span>
                        <span style="color: white; font-weight: 600;">${winPct}%</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #9CA3AF;">Championships:</span>
                        <span style="color: white; font-weight: 600;">${stats.aggregate_championships || 0}</span>
                      </div>
                    </div>
                    ${teams.length > 0 ? `
                      <div style="border-top: 1px solid rgba(156, 163, 175, 0.3); padding-top: 12px; margin-top: 12px;">
                        <div style="color: #9CA3AF; font-size: 10px; font-weight: 600; margin-bottom: 8px; font-family: 'Inter', sans-serif;">Teams in State:</div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                          ${teamsList}
                        </div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
              
              // Adjust position after content is rendered to keep it outside state and on screen
              setTimeout(() => {
                const rect = tooltip.getBoundingClientRect();
                const tooltipWidth = rect.width;
                const tooltipHeight = rect.height;
                
                let adjustedX = screenX;
                let adjustedY = screenY;
                let transform = 'translateY(-50%)';
                
                // Check if tooltip would go off right edge - if so, position to the left of state
                if (screenX + tooltipWidth > window.innerWidth) {
                  adjustedX = svgRect.left + minX - tooltipWidth - 20; // Position to left with padding
                  // If still off screen on left, center it
                  if (adjustedX < 0) {
                    adjustedX = Math.max(10, (window.innerWidth - tooltipWidth) / 2);
                  }
                }
                
                // Check if tooltip would go off left edge
                if (adjustedX < 0) {
                  adjustedX = svgRect.left + maxX + 20; // Try right side again
                  if (adjustedX + tooltipWidth > window.innerWidth) {
                    adjustedX = 10; // Fallback to left edge
                  }
                }
                
                // Check if tooltip would go off bottom edge - position above state
                if (screenY + tooltipHeight / 2 > window.innerHeight) {
                  adjustedY = svgRect.top + minY - tooltipHeight - 20; // Position above with padding
                  transform = 'none';
                  // If still off screen, position at top
                  if (adjustedY < 0) {
                    adjustedY = 10;
                  }
                }
                
                // Check if tooltip would go off top edge - position below state
                if (adjustedY < 0) {
                  adjustedY = svgRect.top + maxY + 20; // Position below with padding
                  transform = 'none';
                  if (adjustedY + tooltipHeight > window.innerHeight) {
                    adjustedY = window.innerHeight - tooltipHeight - 10;
                  }
                }
                
                tooltip.style.left = adjustedX + 'px';
                tooltip.style.top = adjustedY + 'px';
                tooltip.style.transform = transform;
              }, 0);
            }
          })
          .on('mouseout', function(event, d) {
            const stateName = d.properties.name;
            const stats = stateStatsMap[stateName];
            
            d3.select(this)
              .attr('fill', () => {
                if (selectedState === stateName) {
                  return '#1D428A';
                }
                if (stats) {
                  const teamCount = stats.total_teams || 0;
                  return teamCount > 0 ? '#E8E8E3' : '#F5F5F5';
                }
                return '#F5F5F5';
              })
              .attr('stroke-width', selectedState === stateName ? 2 : 0.5)
              .attr('stroke', selectedState === stateName ? '#C8102E' : '#999');
            
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none';
            }
          })
          .on('click', function(event, d) {
            const stateName = d.properties.name;
            if (onStateSelect && stateStatsMap[stateName]) {
              onStateSelect(stateName);
            }
          });

      })
      .catch(error => {
        console.error('Error loading US map:', error);
      });
  }, [selectedState, statesData, onStateSelect]);

  useEffect(() => {
    // Load states data
    getStates()
      .then(data => {
        mapDataRef.current = data;
        renderMap();
      })
      .catch(error => {
        console.error('Error loading states data:', error);
      });
  }, [renderMap]);

  useEffect(() => {
    if (mapDataRef.current) {
      renderMap();
    }
  }, [selectedState, statesData, renderMap]);

  return (
    <div className="map-container relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div
        ref={tooltipRef}
        className="map-tooltip"
        style={{
          display: 'none',
          position: 'fixed',
          background: 'rgba(15, 20, 25, 0.95)',
          color: 'white',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          minWidth: '250px',
          maxWidth: '320px',
          overflow: 'hidden'
        }}
      ></div>
    </div>
  );
}

