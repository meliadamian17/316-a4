// Map rendering and geography
import { CONFIG } from '../config.js';

export class MapRenderer {
    constructor(svg, projection, path) {
        this.svg = svg;
        this.projection = projection;
        this.path = path;
        this.mapGroup = null;
    }
    
    init() {
        this.mapGroup = this.svg.append('g').attr('class', 'map-layer');
        this.loadWorldMap();
    }
    
    async loadWorldMap() {
        try {
            const data = await d3.json(CONFIG.DATA_SOURCES.worldMap);
            const countries = topojson.feature(data, data.objects.countries);
            
            this.mapGroup.selectAll('path')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('d', this.path)
                .attr('fill', '#2d2d2d')
                .attr('stroke', '#404040')
                .attr('stroke-width', 0.5);
        } catch (err) {
            console.error('Error loading map:', err);
        }
    }
    
    updateTransform(transform) {
        this.mapGroup.attr('transform', transform);
    }
    
    redraw() {
        this.mapGroup.selectAll('path').attr('d', this.path);
    }
}

