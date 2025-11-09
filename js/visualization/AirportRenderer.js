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
    
    render(degrees, airports, zoomLevel, tooltipCallbacks, selectedAirports = new Set(), clickCallback = null, isZoomRender = false) {
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
        
        const exitTransition = circles.exit();
        if (isZoomRender) {
            exitTransition.remove();
        } else {
            exitTransition
                .transition()
                .duration(CONFIG.ANIMATION.nodeExit)
                .attr('r', 0)
                .style('opacity', 0)
                .remove();
        }
        
        const enter = circles.enter()
            .append('circle')
            .attr('class', 'airport-node')
            .attr('cx', d => this.projection([d.lon, d.lat])[0])
            .attr('cy', d => this.projection([d.lon, d.lat])[1])
            .attr('r', 0)
            .attr('fill', d => this.colorUtils.getNodeColor(d.degree))
            .style('opacity', 0);
        
        if (tooltipCallbacks) {
            enter.on('mouseover', tooltipCallbacks.show)
                .on('mouseout', tooltipCallbacks.hide)
                .on('mousemove', tooltipCallbacks.move);
        }
        
        if (clickCallback) {
            enter.on('click', function(event, d) {
                event.stopPropagation();
                clickCallback(d.code);
            });
        }
        
        if (isZoomRender) {
            enter
                .attr('r', d => this.getRadius(d.degree))
                .style('opacity', 0.85);
        } else {
            const duration = Math.max(300, CONFIG.ANIMATION.nodeEnter - (zoomLevel * 30));
            enter.transition()
                .duration(duration)
                .attr('r', d => this.getRadius(d.degree))
                .style('opacity', 0.85);
        }
        
        const allCircles = enter.merge(circles);
        
        if (clickCallback) {
            allCircles.on('click', function(event, d) {
                event.stopPropagation();
                clickCallback(d.code);
            });
        }
        
        // Pre-calculate selection checks once per airport (optimization)
        const getOpacity = (d) => {
            if (selectedAirports.size === 0) return 0.85;
            return selectedAirports.has(d.code) ? 1 : 0.4;
        };
        
        const getStrokeWidth = (d) => selectedAirports.has(d.code) ? 3 : 1;
        const getStroke = (d) => selectedAirports.has(d.code) ? '#50e3c2' : 'var(--node-stroke)';
        
        const updateSelection = allCircles
            .classed('selected-airport', d => selectedAirports.has(d.code));
        
        if (isZoomRender) {
            updateSelection
                .attr('r', d => this.getRadius(d.degree))
                .attr('fill', d => this.colorUtils.getNodeColor(d.degree))
                .attr('stroke-width', getStrokeWidth)
                .attr('stroke', getStroke)
                .style('opacity', getOpacity);
        } else {
            updateSelection
                .transition()
                .duration(300)
                .attr('r', d => this.getRadius(d.degree))
                .attr('fill', d => this.colorUtils.getNodeColor(d.degree))
                .attr('stroke-width', getStrokeWidth)
                .attr('stroke', getStroke)
                .style('opacity', getOpacity);
        }
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
    
    setVisibility(visible) {
        const circles = this.airportsGroup.selectAll('circle');
        
        if (visible) {
            this.airportsGroup.style('display', 'block');
            circles.transition()
                .duration(300)
                .style('opacity', function() {
                    const currentOpacity = d3.select(this).attr('data-target-opacity');
                    return currentOpacity || 0.85;
                });
        } else {
            circles.each(function() {
                const current = d3.select(this).style('opacity');
                d3.select(this).attr('data-target-opacity', current);
            });
            
            const group = this.airportsGroup;
            circles.transition()
                .duration(300)
                .style('opacity', 0)
                .on('end', function(d, i, nodes) {
                    if (i === nodes.length - 1) {
                        group.style('display', 'none');
                    }
                });
        }
    }
}

