// Route path rendering
import { CONFIG } from '../config.js';

export class RouteRenderer {
    constructor(svg, projection, colorUtils) {
        this.svg = svg;
        this.projection = projection;
        this.colorUtils = colorUtils;
        this.routesGroup = null;
        this.currentZoom = 1;
    }
    
    init() {
        this.routesGroup = this.svg.append('g').attr('class', 'routes-layer');
    }
    
    render(routes, zoomLevel, selectedAirports = new Set(), isZoomRender = false) {
        this.currentZoom = zoomLevel;
        const displayRoutes = routes;
        
        const baseOpacity = this.calculateOpacity(displayRoutes.length);
        const zoomBonus = Math.min(0.15, zoomLevel * 0.03);
        const finalOpacity = baseOpacity + zoomBonus;
        
        const hasSelection = selectedAirports.size > 0;
        
        const opacityValues = {
            base: finalOpacity,
            connected: Math.min(finalOpacity * 2, 0.8),
            between: Math.min(finalOpacity * 3, 1.0),
            unconnected: finalOpacity * 0.15
        };
        
        const strokeWidthValues = {
            base: 1,
            connected: 1.5,
            between: 2.5
        };
        
        const getRouteOpacity = (d) => {
            if (!hasSelection) return opacityValues.base;
            
            const sourceSelected = selectedAirports.has(d.source);
            const destSelected = selectedAirports.has(d.dest);
            
            if (sourceSelected && destSelected) return opacityValues.between;
            if (sourceSelected || destSelected) return opacityValues.connected;
            return opacityValues.unconnected;
        };
        
        const getRouteStrokeWidth = (d) => {
            if (!hasSelection) return strokeWidthValues.base;
            
            const sourceSelected = selectedAirports.has(d.source);
            const destSelected = selectedAirports.has(d.dest);
            
            if (sourceSelected && destSelected) return strokeWidthValues.between;
            if (sourceSelected || destSelected) return strokeWidthValues.connected;
            return strokeWidthValues.base;
        };
        
        const paths = this.routesGroup
            .selectAll('path.route-path')
            .data(displayRoutes, d => `${d.airline}-${d.source}-${d.dest}`);
        
        const exitTransition = paths.exit();
        if (isZoomRender) {
            exitTransition.remove();
        } else {
            exitTransition
                .transition()
                .duration(CONFIG.ANIMATION.routeExit)
                .style('opacity', 0)
                .remove();
        }
        
        const enter = paths.enter()
            .append('path')
            .attr('class', 'route-path')
            .attr('d', d => this.createArcPath(d))
            .attr('stroke', d => this.colorUtils.getAirlineColor(d.airline))
            .attr('stroke-width', d => getRouteStrokeWidth(d))
            .style('opacity', 0);
        
        // Animate in
        if (isZoomRender) {
            // Skip animations during zoom - instantly show routes
            enter.style('opacity', d => getRouteOpacity(d));
        } else {
            const duration = Math.max(300, CONFIG.ANIMATION.routeEnter - (zoomLevel * 50));
            const maxDelay = zoomLevel > 2 ? 100 : 300;
            
            enter.transition()
                .delay((d, i) => Math.min(i * 0.5, maxDelay))
                .duration(duration)
                .style('opacity', d => getRouteOpacity(d));
        }
        
        // Update - apply highlighting based on selected airports
        const updateSelection = paths
            .attr('stroke', d => this.colorUtils.getAirlineColor(d.airline))
            .attr('stroke-width', d => getRouteStrokeWidth(d));
        
        if (isZoomRender) {
            // Instant updates during zoom
            updateSelection.style('opacity', d => getRouteOpacity(d));
        } else {
            updateSelection
                .transition()
                .duration(300)
                .style('opacity', d => getRouteOpacity(d));
        }
    }
    
    calculateOpacity(routeCount) {
        if (routeCount > 2000) return 0.15;
        if (routeCount > 1000) return 0.2;
        if (routeCount > 500) return 0.25;
        if (routeCount > 200) return 0.3;
        return 0.35;
    }
    
    createArcPath(route) {
        let source = route._projectedSource;
        let dest = route._projectedDest;
        
        if (!source || !dest) {
            source = this.projection([route.sourceCoords.lon, route.sourceCoords.lat]);
            dest = this.projection([route.destCoords.lon, route.destCoords.lat]);
            
            route._projectedSource = source;
            route._projectedDest = dest;
        }
        
        if (!source || !dest) return '';
        
        const dx = dest[0] - source[0];
        const dy = dest[1] - source[1];
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        const midX = (source[0] + dest[0]) / 2;
        const midY = (source[1] + dest[1]) / 2 - dr * 0.08;
        
        return `M${source[0]},${source[1]} Q${midX},${midY} ${dest[0]},${dest[1]}`;
    }
    
    updateTransform(transform) {
        this.routesGroup.attr('transform', transform);
    }
    
    updateOpacityByZoom(zoomLevel, selectedAirports = new Set()) {
        // Skip if no routes are rendered
        const paths = this.routesGroup.selectAll('path');
        if (paths.empty()) return;
        
        const routeCount = paths.size();
        const baseOpacity = this.calculateOpacity(routeCount);
        const zoomBonus = Math.min(0.15, zoomLevel * 0.03);
        const finalOpacity = baseOpacity + zoomBonus;
        
        const hasSelection = selectedAirports.size > 0;
        
        const opacityValues = {
            base: finalOpacity,
            connected: Math.min(finalOpacity * 2, 0.8),
            between: Math.min(finalOpacity * 3, 1.0),
            unconnected: finalOpacity * 0.15
        };
        
        paths.style('opacity', d => {
            if (!hasSelection) return opacityValues.base;
            
            const sourceSelected = selectedAirports.has(d.source);
            const destSelected = selectedAirports.has(d.dest);
            
            if (sourceSelected && destSelected) return opacityValues.between;
            if (sourceSelected || destSelected) return opacityValues.connected;
            return opacityValues.unconnected;
        });
    }
}

