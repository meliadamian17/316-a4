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
    
    render(routes, zoomLevel) {
        this.currentZoom = zoomLevel;
        const displayRoutes = routes;
        
        console.log(`Rendering ${displayRoutes.length} routes (zoom: ${zoomLevel.toFixed(2)}x)`);
        
        // Calculate adaptive opacity
        const baseOpacity = this.calculateOpacity(displayRoutes.length);
        const zoomBonus = Math.min(0.15, zoomLevel * 0.03);
        const finalOpacity = baseOpacity + zoomBonus;
        
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
            .style('opacity', 0);
        
        // Animate in
        const duration = Math.max(300, CONFIG.ANIMATION.routeEnter - (zoomLevel * 50));
        const maxDelay = zoomLevel > 2 ? 100 : 300;
        
        enter.transition()
            .delay((d, i) => Math.min(i * 0.5, maxDelay))
            .duration(duration)
            .style('opacity', finalOpacity);
        
        // Update
        paths.attr('stroke', d => this.colorUtils.getAirlineColor(d.airline))
            .transition()
            .duration(300)
            .style('opacity', finalOpacity);
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

