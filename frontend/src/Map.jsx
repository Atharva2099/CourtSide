import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getMapData } from './api';

export default function Map({ onTeamSelect, selectedTeams = [] }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const mapDataRef = useRef(null);

  const renderTeamsOnly = useCallback(() => {
    if (!svgRef.current || !mapDataRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    const teams = mapDataRef.current;
    const maxChampionships = d3.max(teams, d => d.championships || 0);
    const maxWinPct = d3.max(teams, d => d.win_pct || 0);
    const minWinPct = d3.min(teams, d => d.win_pct || 0);

    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale([1000]);

    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([minWinPct, maxWinPct]);

    const radiusScale = d3.scaleSqrt()
      .domain([0, maxChampionships])
      .range([3, 20]);

    // Create a defs element for filters
    const defs = svg.append('defs');
    
    const glowFilter = defs.append('filter')
      .attr('id', 'glow-fallback')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Team logo mapping
    const getTeamLogoUrl = (abbrev) => {
      const logoMap = {
        'ATL': 'https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg',
        'BOS': 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',
        'BRK': 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg',
        'CHA': 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg',
        'CHO': 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg',
        'CHI': 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg',
        'CLE': 'https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg',
        'DAL': 'https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg',
        'DEN': 'https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg',
        'DET': 'https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg',
        'GSW': 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
        'HOU': 'https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg',
        'IND': 'https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg',
        'LAC': 'https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg',
        'LAL': 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
        'MEM': 'https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg',
        'MIA': 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg',
        'MIL': 'https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg',
        'MIN': 'https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg',
        'NOP': 'https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg',
        'NYK': 'https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg',
        'OKC': 'https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg',
        'ORL': 'https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg',
        'PHI': 'https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg',
        'PHX': 'https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg',
        'POR': 'https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg',
        'SAC': 'https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg',
        'SAS': 'https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg',
        'TOR': 'https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg',
        'UTA': 'https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg',
        'WAS': 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg',
      };
      return logoMap[abbrev] || null;
    };

    const logoSize = (championships) => {
      return Math.max(30, Math.min(60, 30 + (championships || 0) * 3));
    };

    const logos = svg.append('g')
      .selectAll('image')
      .data(teams.filter(t => t.lat && t.lng))
      .enter()
      .append('image')
      .attr('href', d => getTeamLogoUrl(d.abbreviation) || '')
      .attr('x', d => {
        const size = logoSize(d.championships || 0);
        const x = projection([d.lng, d.lat])?.[0] || 0;
        return x - size / 2;
      })
      .attr('y', d => {
        const size = logoSize(d.championships || 0);
        const y = projection([d.lng, d.lat])?.[1] || 0;
        return y - size / 2;
      })
      .attr('width', d => logoSize(d.championships || 0))
      .attr('height', d => logoSize(d.championships || 0))
      .attr('opacity', d => {
        const abbrev = d.abbreviation;
        return selectedTeams.includes(abbrev) ? 0.9 : 0.6;
      })
      .attr('cursor', 'pointer')
      .style('filter', d => selectedTeams.includes(d.abbreviation) ? 'url(#glow-fallback)' : 'none')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.innerHTML = `
            <h3>${d.name}</h3>
            <p><strong>City:</strong> ${d.city}, ${d.state}</p>
            <p><strong>Championships:</strong> ${d.championships || 0}</p>
            <p><strong>Win %:</strong> ${((d.win_pct || 0) * 100).toFixed(1)}%</p>
            <p><strong>Record:</strong> ${d.total_wins}-${d.total_losses}</p>
          `;
        }
      })
      .on('mousemove', function(event) {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = (event.pageX + 10) + 'px';
          tooltipRef.current.style.top = (event.pageY - 10) + 'px';
        }
      })
      .on('mouseout', function(event, d) {
        const abbrev = d.abbreviation;
        d3.select(this).attr('opacity', selectedTeams.includes(abbrev) ? 0.9 : 0.6);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      })
      .on('click', function(event, d) {
        if (onTeamSelect) {
          onTeamSelect(d.abbreviation);
        }
      });
  }, [selectedTeams, onTeamSelect]);

  const renderMap = useCallback(() => {
    if (!svgRef.current || !mapDataRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.attr('width', width).attr('height', height);

    // Create projection (Albers USA)
    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale([1000]);

    const path = d3.geoPath().projection(projection);

    // Load US states TopoJSON from CDN
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(us => {
        // Draw states
        svg.append('g')
          .selectAll('path')
          .data(topojson.feature(us, us.objects.states).features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', '#f0f0f0')
          .attr('stroke', '#999')
          .attr('stroke-width', 0.5);

        // Draw team cities
        const teams = mapDataRef.current;
        const maxChampionships = d3.max(teams, d => d.championships || 0);
        const maxWinPct = d3.max(teams, d => d.win_pct || 0);
        const minWinPct = d3.min(teams, d => d.win_pct || 0);

        // Create a defs element for filters
        const defs = svg.append('defs');
        
        const glowFilter = defs.append('filter')
          .attr('id', 'glow')
          .attr('x', '-50%')
          .attr('y', '-50%')
          .attr('width', '200%')
          .attr('height', '200%');
        
        glowFilter.append('feGaussianBlur')
          .attr('stdDeviation', '3')
          .attr('result', 'coloredBlur');
        
        const feMerge = glowFilter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Team logo mapping
        const getTeamLogoUrl = (abbrev) => {
          const logoMap = {
            'ATL': 'https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg',
            'BOS': 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',
            'BRK': 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg',
            'CHA': 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg',
            'CHO': 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg',
            'CHI': 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg',
            'CLE': 'https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg',
            'DAL': 'https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg',
            'DEN': 'https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg',
            'DET': 'https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg',
            'GSW': 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
            'HOU': 'https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg',
            'IND': 'https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg',
            'LAC': 'https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg',
            'LAL': 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
            'MEM': 'https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg',
            'MIA': 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg',
            'MIL': 'https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg',
            'MIN': 'https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg',
            'NOP': 'https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg',
            'NYK': 'https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg',
            'OKC': 'https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg',
            'ORL': 'https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg',
            'PHI': 'https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg',
            'PHX': 'https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg',
            'POR': 'https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg',
            'SAC': 'https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg',
            'SAS': 'https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg',
            'TOR': 'https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg',
            'UTA': 'https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg',
            'WAS': 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg',
          };
          return logoMap[abbrev] || null;
        };

        const logoSize = (championships) => {
          return Math.max(30, Math.min(60, 30 + (championships || 0) * 3));
        };

        const logos = svg.append('g')
          .selectAll('image')
          .data(teams.filter(t => t.lat && t.lng))
          .enter()
          .append('image')
          .attr('href', d => getTeamLogoUrl(d.abbreviation) || '')
          .attr('x', d => {
            const size = logoSize(d.championships || 0);
            const x = projection([d.lng, d.lat])?.[0] || 0;
            return x - size / 2;
          })
          .attr('y', d => {
            const size = logoSize(d.championships || 0);
            const y = projection([d.lng, d.lat])?.[1] || 0;
            return y - size / 2;
          })
          .attr('width', d => logoSize(d.championships || 0))
          .attr('height', d => logoSize(d.championships || 0))
          .attr('opacity', d => {
            const abbrev = d.abbreviation;
            return selectedTeams.includes(abbrev) ? 0.9 : 0.6;
          })
          .attr('cursor', 'pointer')
          .style('filter', d => selectedTeams.includes(d.abbreviation) ? 'url(#glow)' : 'none')
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'block';
              tooltipRef.current.innerHTML = `
                <h3>${d.name}</h3>
                <p><strong>City:</strong> ${d.city}, ${d.state}</p>
                <p><strong>Championships:</strong> ${d.championships || 0}</p>
                <p><strong>Win %:</strong> ${((d.win_pct || 0) * 100).toFixed(1)}%</p>
                <p><strong>Record:</strong> ${d.total_wins}-${d.total_losses}</p>
              `;
            }
          })
          .on('mousemove', function(event) {
            if (tooltipRef.current) {
              tooltipRef.current.style.left = event.pageX + 'px';
              tooltipRef.current.style.top = event.pageY + 'px';
            }
          })
          .on('mouseout', function(event, d) {
            const abbrev = d.abbreviation;
            d3.select(this).attr('opacity', selectedTeams.includes(abbrev) ? 0.9 : 0.6);
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none';
            }
          })
          .on('click', function(event, d) {
            if (onTeamSelect) {
              onTeamSelect(d.abbreviation);
            }
          });
      })
      .catch(error => {
        console.error('Error loading US map:', error);
        // Fallback: just show circles without state boundaries
        renderTeamsOnly();
      });
  }, [selectedTeams, renderTeamsOnly]);

  useEffect(() => {
    // Load map data
    getMapData()
      .then(data => {
        mapDataRef.current = data;
        renderMap();
      })
      .catch(error => {
        console.error('Error loading map data:', error);
      });
  }, [renderMap]);

  useEffect(() => {
    if (mapDataRef.current) {
      renderMap();
    }
  }, [selectedTeams, renderMap]);

  return (
    <div className="map-container relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div
        ref={tooltipRef}
        className="map-tooltip"
        style={{ display: 'none' }}
      ></div>
    </div>
  );
}

