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
    
    render(degrees, airports, zoomLevel, tooltipCallbacks) {
        this.currentZoom = zoomLevel;
        
        const activeAirports = Array.from(degrees.entries()).map(([code, degree]) => ({
            code,
            degree,
            ...airports.get(code)
        })).filter(d => d.lat !== undefined && d.lon !== undefined);
        
        console.log(`Rendering ${activeAirports.length} airports (zoom: ${zoomLevel.toFixed(2)}x)`);
        
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
        
        // Animate in
        const duration = Math.max(300, CONFIG.ANIMATION.nodeEnter - (zoomLevel * 30));
        enter.transition()
            .duration(duration)
            .attr('r', d => this.getRadius(d.degree))
            .style('opacity', 0.85);
        
        // Update
        circles.transition()
            .duration(300)
            .attr('r', d => this.getRadius(d.degree))
            .attr('fill', d => this.colorUtils.getNodeColor(d.degree));
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
        this.airportsGroup.selectAll('circle')
            .attr('r', d => this.getRadius(d.degree));
    }
}

