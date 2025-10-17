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
    
    render(routes, zoomLevel, selectedAirports = new Set()) {
        this.currentZoom = zoomLevel;
        const displayRoutes = routes;
        
        console.log(`Rendering ${displayRoutes.length} routes (zoom: ${zoomLevel.toFixed(2)}x)`);
        
        // Calculate adaptive opacity
        const baseOpacity = this.calculateOpacity(displayRoutes.length);
        const zoomBonus = Math.min(0.15, zoomLevel * 0.03);
        const finalOpacity = baseOpacity + zoomBonus;
        
        // Helper function to determine if route is connected to selected airports
        const isConnected = (d) => {
            if (selectedAirports.size === 0) return true;
            return selectedAirports.has(d.source) || selectedAirports.has(d.dest);
        };
        
        // Helper function to determine if route is between selected airports
        const isBetweenSelected = (d) => {
            if (selectedAirports.size < 2) return false;
            return selectedAirports.has(d.source) && selectedAirports.has(d.dest);
        };
        
        // Helper function to get opacity based on selection
        const getRouteOpacity = (d) => {
            if (selectedAirports.size === 0) return finalOpacity;
            if (isBetweenSelected(d)) return Math.min(finalOpacity * 3, 1.0); // Highest opacity for routes between selected
            return isConnected(d) ? Math.min(finalOpacity * 2, 0.8) : finalOpacity * 0.15;
        };
        
        // Helper function to get stroke width based on selection
        const getRouteStrokeWidth = (d) => {
            if (selectedAirports.size === 0) return 1;
            if (isBetweenSelected(d)) return 2.5; // Thicker lines for routes between selected
            return isConnected(d) ? 1.5 : 1;
        };
        
        // Data join
        const paths = this.routesGroup
            .selectAll('path.route-path')
            .data(displayRoutes, d => `${d.airline}-${d.source}-${d.dest}`);
        
        // Exit
        paths.exit()
            .transition()
            .duration(CONFIG.ANIMATION.routeExit)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const enter = paths.enter()
            .append('path')
            .attr('class', 'route-path')
            .attr('d', d => this.createArcPath(d))
            .attr('stroke', d => this.colorUtils.getAirlineColor(d.airline))
            .attr('stroke-width', d => getRouteStrokeWidth(d))
            .style('opacity', 0);
        
        // Animate in
        const duration = Math.max(300, CONFIG.ANIMATION.routeEnter - (zoomLevel * 50));
        const maxDelay = zoomLevel > 2 ? 100 : 300;
        
        enter.transition()
            .delay((d, i) => Math.min(i * 0.5, maxDelay))
            .duration(duration)
            .style('opacity', d => getRouteOpacity(d));
        
        // Update - apply highlighting based on selected airports
        paths.attr('stroke', d => this.colorUtils.getAirlineColor(d.airline))
            .attr('stroke-width', d => getRouteStrokeWidth(d))
            .transition()
            .duration(300)
            .style('opacity', d => getRouteOpacity(d));
    }
    
    calculateOpacity(routeCount) {
        if (routeCount > 2000) return 0.15;
        if (routeCount > 1000) return 0.2;
        if (routeCount > 500) return 0.25;
        if (routeCount > 200) return 0.3;
        return 0.35;
    }
    
    createArcPath(route) {
        const source = this.projection([route.sourceCoords.lon, route.sourceCoords.lat]);
        const dest = this.projection([route.destCoords.lon, route.destCoords.lat]);
        
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
    
    updateOpacityByZoom(zoomLevel) {
        const routeCount = this.routesGroup.selectAll('path').size();
        const baseOpacity = this.calculateOpacity(routeCount);
        const zoomBonus = Math.min(0.15, zoomLevel * 0.03);
        const routeOpacity = baseOpacity + zoomBonus;
        
        this.routesGroup.selectAll('path')
            .style('opacity', routeOpacity);
    }
}

