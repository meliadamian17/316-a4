// Airport node rendering
import { CONFIG } from '../config.js';

export class AirportRenderer {
    constructor(svg, projection, colorUtils) {
        this.svg = svg;
        this.projection = projection;
        this.colorUtils = colorUtils;
        this.airportsGroup = null;
        this.currentZoom = 1;
        
        this.radiusScale = d3.scaleSqrt()
            .domain(CONFIG.NODE_DEGREE_DOMAIN)
            .range(CONFIG.NODE_RADIUS_RANGE);
    }
    
    init() {
        this.airportsGroup = this.svg.append('g').attr('class', 'airports-layer');
    }
    
    render(degrees, airports, zoomLevel, tooltipCallbacks, selectedAirports = new Set(), clickCallback = null) {
        this.currentZoom = zoomLevel;
        
        const activeAirports = Array.from(degrees.entries()).map(([code, degree]) => ({
            code,
            degree,
            ...airports.get(code)
        })).filter(d => d.lat !== undefined && d.lon !== undefined);
        
        // Data join
        const circles = this.airportsGroup
            .selectAll('circle.airport-node')
            .data(activeAirports, d => d.code);
        
        // Exit
        circles.exit()
            .transition()
            .duration(CONFIG.ANIMATION.nodeExit)
            .attr('r', 0)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const enter = circles.enter()
            .append('circle')
            .attr('class', 'airport-node')
            .attr('cx', d => this.projection([d.lon, d.lat])[0])
            .attr('cy', d => this.projection([d.lon, d.lat])[1])
            .attr('r', 0)
            .attr('fill', d => this.colorUtils.getNodeColor(d.degree))
            .style('opacity', 0);
        
        // Tooltips
        if (tooltipCallbacks) {
            enter.on('mouseover', tooltipCallbacks.show)
                .on('mouseout', tooltipCallbacks.hide)
                .on('mousemove', tooltipCallbacks.move);
        }
        
        // Click handler for airport selection
        if (clickCallback) {
            enter.on('click', function(event, d) {
                event.stopPropagation();
                clickCallback(d.code);
            });
        }
        
        // Animate in
        const duration = Math.max(300, CONFIG.ANIMATION.nodeEnter - (zoomLevel * 30));
        enter.transition()
            .duration(duration)
            .attr('r', d => this.getRadius(d.degree))
            .style('opacity', 0.85);
        
        // Update - apply visual feedback for selected airport
        const allCircles = enter.merge(circles);
        
        // Update click handler for existing circles
        if (clickCallback) {
            allCircles.on('click', function(event, d) {
                event.stopPropagation();
                clickCallback(d.code);
            });
        }
        
        // Apply selection styling
        allCircles
            .classed('selected-airport', d => selectedAirports.has(d.code))
            .transition()
            .duration(300)
            .attr('r', d => this.getRadius(d.degree))
            .attr('fill', d => this.colorUtils.getNodeColor(d.degree))
            .attr('stroke-width', d => selectedAirports.has(d.code) ? 3 : 1)
            .attr('stroke', d => selectedAirports.has(d.code) ? '#50e3c2' : 'var(--node-stroke)')
            .style('opacity', d => {
                if (selectedAirports.size === 0) return 0.85;
                return selectedAirports.has(d.code) ? 1 : 0.4;
            });
    }
    
    getRadius(degree) {
        const baseRadius = this.radiusScale(degree);
        return baseRadius / Math.sqrt(this.currentZoom);
    }
    
    updateTransform(transform) {
        this.airportsGroup.attr('transform', transform);
    }
    
    updateRadiusByZoom(zoomLevel) {
        this.currentZoom = zoomLevel;
        
        // Skip if no circles are rendered
        const circles = this.airportsGroup.selectAll('circle');
        if (circles.empty()) return;
        
        // Update radius without transition for smooth interaction
        circles.attr('r', d => this.getRadius(d.degree));
    }
}

