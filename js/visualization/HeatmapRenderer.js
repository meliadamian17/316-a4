// Geographic Coverage Heatmap Matrix Renderer
import { CONFIG } from '../config.js';

export class HeatmapRenderer {
    constructor(colorUtils) {
        this.colorUtils = colorUtils;
        this.svg = null;
        this.data = null;
        this.viewMode = 'absolute'; // 'absolute' or 'percentage'
        this.margin = { top: 80, right: 120, bottom: 60, left: 120 };
        this.cells = null;
        this.labels = null;
        this.routes = null;
    }
    
    // Region abbreviations mapping
    getRegionAbbreviations() {
        return {
            'North America': 'NAM',
            'Central America': 'CAM',
            'South America': 'SAM',
            'Europe': 'EUR',
            'Middle East': 'MEA',
            'Africa': 'AFR',
            'Asia': 'ASIA',
            'East Asia': 'EAS',
            'Southeast Asia': 'SEA',
            'Oceania': 'OCE',
            'Other': 'OTH'
        };
    }
    
    // Define world regions based on geographic coordinates
    getRegion(lat, lon) {
        // North America
        if (lat >= 15 && lat <= 72 && lon >= -170 && lon <= -52) {
            return 'North America';
        }
        // Central America & Caribbean
        if (lat >= 5 && lat <= 32 && lon >= -120 && lon <= -60) {
            return 'Central America';
        }
        // South America
        if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) {
            return 'South America';
        }
        // Europe
        if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 40) {
            return 'Europe';
        }
        // Middle East
        if (lat >= 12 && lat <= 42 && lon >= 26 && lon <= 63) {
            return 'Middle East';
        }
        // Africa
        if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) {
            return 'Africa';
        }
        // Asia (excluding Middle East)
        if (lat >= -10 && lat <= 55 && lon >= 60 && lon <= 150) {
            return 'Asia';
        }
        // East Asia & Pacific
        if (lat >= 20 && lat <= 50 && lon >= 100 && lon <= 145) {
            return 'East Asia';
        }
        // Southeast Asia
        if (lat >= -11 && lat <= 28 && lon >= 95 && lon <= 141) {
            return 'Southeast Asia';
        }
        // Oceania
        if (lat >= -48 && lat <= -10 && lon >= 110 && lon <= 180) {
            return 'Oceania';
        }
        // Catch-all for remaining areas
        return 'Other';
    }
    
    // Aggregate routes into regional matrix
    aggregateRegionalData(routes) {
        const matrix = new Map();
        const regions = new Set();
        let totalRoutes = 0;
        
        routes.forEach(route => {
            const sourceRegion = this.getRegion(
                route.sourceCoords.lat, 
                route.sourceCoords.lon
            );
            const destRegion = this.getRegion(
                route.destCoords.lat, 
                route.destCoords.lon
            );
            
            regions.add(sourceRegion);
            regions.add(destRegion);
            
            const key = `${sourceRegion}|${destRegion}`;
            matrix.set(key, (matrix.get(key) || 0) + 1);
            totalRoutes++;
        });
        
        // Sort regions alphabetically for consistent ordering
        const sortedRegions = Array.from(regions).sort();
        
        // Get abbreviations
        const abbreviations = this.getRegionAbbreviations();
        
        // Create matrix data structure
        const matrixData = [];
        sortedRegions.forEach(source => {
            sortedRegions.forEach(dest => {
                const key = `${source}|${dest}`;
                const count = matrix.get(key) || 0;
                const percentage = totalRoutes > 0 ? (count / totalRoutes) * 100 : 0;
                
                matrixData.push({
                    source,
                    dest,
                    count,
                    percentage
                });
            });
        });
        
        return {
            matrixData,
            regions: sortedRegions,
            totalRoutes,
            maxCount: Math.max(...matrixData.map(d => d.count))
        };
    }
    
    render(container, routes, viewMode = 'absolute') {
        // Clear previous chart
        container.innerHTML = '';
        
        this.viewMode = viewMode;
        this.routes = routes;
        
        if (!routes || routes.length === 0) {
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">No routes to display</div>';
            return;
        }
        
        // Aggregate data
        const { matrixData, regions, totalRoutes, maxCount } = this.aggregateRegionalData(routes);
        const abbreviations = this.getRegionAbbreviations();
        this.data = { matrixData, regions, totalRoutes, maxCount, abbreviations };
        
        // Calculate dimensions
        const containerWidth = container.offsetWidth;
        
        const maxCellSize = 80;
        const minCellSize = 50;
        const cellSize = Math.max(minCellSize, Math.min(maxCellSize, 600 / regions.length));
        
        const matrixSize = regions.length * cellSize;
        const legendWidth = 180;
        const legendGap = 40;
        
        const svgWidth = this.margin.left + matrixSize + legendGap + legendWidth + this.margin.right;
        const containerHeight = Math.max(matrixSize + this.margin.top + this.margin.bottom, 500);
        
        // Create wrapper div centered with flexbox
        const wrapper = d3.select(container)
            .append('div')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'flex-start')
            .style('width', '100%')
            .style('height', '100%');
        
        // Create SVG inside wrapper with calculated width
        this.svg = wrapper
            .append('svg')
            .attr('width', svgWidth)
            .attr('height', containerHeight)
            .style('background', 'transparent');
        
        const g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Add background container around the matrix
        const matrixWidth = regions.length * cellSize;
        const matrixHeight = regions.length * cellSize;
        
        g.append('rect')
            .attr('class', 'matrix-background')
            .attr('x', -15)
            .attr('y', -15)
            .attr('width', matrixWidth + 30)
            .attr('height', matrixHeight + 30)
            .attr('rx', 8)
            .style('fill', 'var(--bg-secondary)')
            .style('stroke', 'var(--border-color)')
            .style('stroke-width', 1);
        
        const xScale = d3.scaleBand()
            .domain(regions)
            .range([0, matrixSize])
            .padding(0.05);
        
        const yScale = d3.scaleBand()
            .domain(regions)
            .range([0, matrixSize])
            .padding(0.05);
        
        // Color scale - using single color (blue) with varying intensity
        const maxValue = viewMode === 'percentage' 
            ? Math.max(...matrixData.map(d => d.percentage))
            : maxCount;
        
        // Create a single-color scale from very light blue to full blue
        const colorScale = d3.scaleSequential()
            .domain([0, maxValue])
            .interpolator(t => {
                if (t === 0) return 'var(--bg-tertiary)';
                // Interpolate from light blue to full blue
                const baseColor = d3.rgb(CONFIG.COLORS.accent.blue);
                const lightBlue = d3.rgb(220, 235, 255); // Very light blue
                return d3.interpolateRgb(lightBlue, baseColor)(t);
            });
        
        // Create tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'heatmap-tooltip')
            .style('position', 'absolute')
            .style('background', 'var(--tooltip-bg)')
            .style('color', 'var(--tooltip-text)')
            .style('padding', '12px 16px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10001)
            .style('box-shadow', '0 4px 12px var(--shadow)')
            .style('backdrop-filter', 'blur(10px)')
            .style('border', '1px solid var(--border-color)');
        
        // Draw cells
        this.cells = g.selectAll('.heatmap-cell')
            .data(matrixData)
            .enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => xScale(d.dest))
            .attr('y', d => yScale(d.source))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('rx', 4)
            .style('fill', 'var(--bg-tertiary)')
            .style('cursor', 'pointer')
            .style('opacity', 0);
        
        // Animate cells
        this.cells.transition()
            .duration(500)
            .delay((d, i) => i * 5)
            .style('fill', d => {
                const value = viewMode === 'percentage' ? d.percentage : d.count;
                return value > 0 ? colorScale(value) : 'var(--bg-tertiary)';
            })
            .style('opacity', 1);
        
        // Add cell labels for significant values
        this.labels = g.selectAll('.cell-label')
            .data(matrixData.filter(d => d.count > 0))
            .enter()
            .append('text')
            .attr('class', 'cell-label')
            .attr('x', d => xScale(d.dest) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.source) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('fill', d => {
                const value = viewMode === 'percentage' ? d.percentage : d.count;
                // Use white text for dark backgrounds, dark grey for light backgrounds
                if (value > maxValue * 0.4) {
                    return 'white';
                } else {
                    // Use dark background color for better contrast on light tiles
                    return '#2e2e2e';
                }
            })
            .style('font-size', '11px')
            .style('font-weight', '700')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('text-shadow', d => {
                const value = viewMode === 'percentage' ? d.percentage : d.count;
                // Add subtle shadow for better readability
                if (value > maxValue * 0.4) {
                    return '0 1px 2px rgba(0, 0, 0, 0.3)';
                } else {
                    return 'none';
                }
            })
            .text(d => {
                if (viewMode === 'percentage') {
                    return d.percentage.toFixed(1) + '%';
                } else {
                    return d.count.toLocaleString();
                }
            });
        
        // Animate labels
        this.labels.transition()
            .duration(500)
            .delay(600)
            .style('opacity', d => {
                const value = viewMode === 'percentage' ? d.percentage : d.count;
                return value > 0 ? 1 : 0;
            });
        
        // Add X axis (destinations)
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,-25)`)
            .selectAll('text')
            .data(regions)
            .enter()
            .append('text')
            .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text(d => abbreviations[d] || d);
        
        // Add Y axis (sources)
        g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(-20,0)`)
            .selectAll('text')
            .data(regions)
            .enter()
            .append('text')
            .attr('x', 0)
            .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text(d => abbreviations[d] || d);
        
        // Add axis labels
        g.append('text')
            .attr('x', matrixSize / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('Destination Region');
        
        g.append('text')
            .attr('x', -matrixSize / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .attr('transform', `rotate(-90, -45, ${matrixSize / 2})`)
            .style('fill', 'var(--text-primary)')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('← Source Region');
        
        // Add interactivity
        this.cells.on('mouseenter', function(event, d) {
            if (d.count === 0) return;
            
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 0.8)
                .attr('rx', 6)
                .style('stroke', 'var(--accent-cyan)')
                .style('stroke-width', 2);
            
            const isDiagonal = d.source === d.dest;
            
            tooltip
                .style('opacity', 1)
                .html(`
                    <div style="font-weight: 600; margin-bottom: 6px; color: var(--accent-cyan);">
                        ${d.source} → ${d.dest}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                        ${isDiagonal ? '<div style="color: var(--accent-purple);">⊙ Intra-regional routes</div>' : ''}
                        <div>Routes: <span style="color: var(--text-primary); font-weight: 600;">${d.count.toLocaleString()}</span></div>
                        <div>Percentage: <span style="color: var(--text-primary); font-weight: 600;">${d.percentage.toFixed(2)}%</span></div>
                        <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--border-color);">
                            Of ${totalRoutes.toLocaleString()} total routes
                        </div>
                    </div>
                `);
        })
        .on('mousemove', function(event) {
            tooltip
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mouseleave', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 1)
                .attr('rx', 4)
                .style('stroke', 'none');
            
            tooltip.style('opacity', 0);
        });
        
        // Add legends (intensity and region abbreviations)
        this.addIntensityLegend(g, colorScale, maxValue, matrixSize, legendWidth, legendGap);
        this.addRegionLegend(g, regions, abbreviations, matrixSize, legendWidth, legendGap);
    }
    
    addIntensityLegend(g, colorScale, maxValue, matrixSize, legendWidth, legendGap) {
        const legendHeight = 20;
        
        // Position legend to the right of the matrix
        const legendX = matrixSize + legendGap;
        const legendY = 20;
        
        // Legend group
        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${legendX},${legendY})`);
        
        // Create gradient with single color (blue) varying intensity
        const defs = this.svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'heatmap-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '0%');
        
        // Create gradient from light blue to full blue
        const baseColor = d3.rgb(CONFIG.COLORS.accent.blue);
        const lightBlue = d3.rgb(220, 235, 255);
        
        const stops = [0, 0.25, 0.5, 0.75, 1];
        stops.forEach((offset) => {
            gradient.append('stop')
                .attr('offset', `${offset * 100}%`)
                .attr('stop-color', d3.interpolateRgb(lightBlue, baseColor)(offset));
        });
        
        // Legend rectangle
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#heatmap-gradient)')
            .style('stroke', 'var(--border-color)')
            .style('stroke-width', 1)
            .attr('rx', 4);
        
        // Legend labels
        legend.append('text')
            .attr('x', 0)
            .attr('y', legendHeight + 15)
            .attr('text-anchor', 'start')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '11px')
            .text('0');
        
        legend.append('text')
            .attr('x', legendWidth)
            .attr('y', legendHeight + 15)
            .attr('text-anchor', 'end')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '11px')
            .text(this.viewMode === 'percentage' 
                ? `${maxValue.toFixed(1)}%` 
                : maxValue.toLocaleString());
        
        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('Route Intensity');
    }
    
    addRegionLegend(g, regions, abbreviations, matrixSize, legendWidth, legendGap) {
        // Position legend to the right of the matrix, below the intensity legend
        const legendX = matrixSize + legendGap;
        const legendY = 100;
        const lineHeight = 20;
        
        // Legend group
        const regionLegend = g.append('g')
            .attr('class', 'region-legend')
            .attr('transform', `translate(${legendX},${legendY})`);
        
        // Title
        regionLegend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('fill', 'var(--text-primary)')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('Region Codes');
        
        // Add each region abbreviation
        regions.forEach((region, i) => {
            const abbr = abbreviations[region] || region;
            const yPos = (i + 1) * lineHeight + 5;
            
            // Abbreviation (bold)
            regionLegend.append('text')
                .attr('x', 0)
                .attr('y', yPos)
                .style('fill', 'var(--text-primary)')
                .style('font-size', '11px')
                .style('font-weight', '700')
                .text(abbr);
            
            // Separator and full name
            regionLegend.append('text')
                .attr('x', 40)
                .attr('y', yPos)
                .style('fill', 'var(--text-secondary)')
                .style('font-size', '11px')
                .text(`— ${region}`);
        });
    }
    
    updateViewMode(newViewMode) {
        if (!this.data || !this.cells || !this.labels) return;
        
        const { matrixData, maxCount } = this.data;
        this.viewMode = newViewMode;
        
        // Calculate new max value for color scale
        const maxValue = newViewMode === 'percentage' 
            ? Math.max(...matrixData.map(d => d.percentage))
            : maxCount;
        
        // Create new color scale
        const colorScale = d3.scaleSequential()
            .domain([0, maxValue])
            .interpolator(t => {
                if (t === 0) return 'var(--bg-tertiary)';
                const baseColor = d3.rgb(CONFIG.COLORS.accent.blue);
                const lightBlue = d3.rgb(220, 235, 255);
                return d3.interpolateRgb(lightBlue, baseColor)(t);
            });
        
        // Update cell colors
        this.cells.transition()
            .duration(300)
            .style('fill', d => {
                const value = newViewMode === 'percentage' ? d.percentage : d.count;
                return value > 0 ? colorScale(value) : 'var(--bg-tertiary)';
            });
        
        // Fade out labels
        this.labels.transition()
            .duration(200)
            .style('opacity', 0)
            .on('end', () => {
                // Update text content and colors
                this.labels
                    .text(d => {
                        if (newViewMode === 'percentage') {
                            return d.percentage.toFixed(1) + '%';
                        } else {
                            return d.count.toLocaleString();
                        }
                    })
                    .style('fill', d => {
                        const value = newViewMode === 'percentage' ? d.percentage : d.count;
                        if (value > maxValue * 0.4) {
                            return 'white';
                        } else {
                            return '#2e2e2e';
                        }
                    })
                    .style('text-shadow', d => {
                        const value = newViewMode === 'percentage' ? d.percentage : d.count;
                        if (value > maxValue * 0.4) {
                            return '0 1px 2px rgba(0, 0, 0, 0.3)';
                        } else {
                            return 'none';
                        }
                    });
                
                // Fade in with new text
                this.labels.transition()
                    .duration(200)
                    .style('opacity', 1);
            });
    }
    
    update(container, viewMode) {
        if (!this.data) return;
        
        // Re-render with new view mode
        const routes = []; // This will be passed from the chart modal
        this.render(container, routes, viewMode);
    }
    
    destroy() {
        // Remove tooltip if it exists
        d3.selectAll('.heatmap-tooltip').remove();
    }
}

