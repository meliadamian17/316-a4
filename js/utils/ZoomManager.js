// Zoom and level-of-detail management
import { CONFIG } from '../config.js';

export class ZoomManager {
    constructor(svg, onZoomChange) {
        this.svg = svg;
        this.onZoomChange = onZoomChange;
        this.currentZoom = 1;
        this.currentTransform = d3.zoomIdentity;
        this.zoomTimer = null;
        
        this.zoomBehavior = d3.zoom()
            .scaleExtent(CONFIG.ZOOM_EXTENT)
            .on('zoom', (event) => this.handleZoom(event));
    }
    
    init() {
        this.svg.call(this.zoomBehavior);
    }
    
    handleZoom(event) {
        this.currentZoom = event.transform.k;
        this.currentTransform = event.transform;
        
        // Debounce re-rendering
        clearTimeout(this.zoomTimer);
        this.zoomTimer = setTimeout(() => {
            if (this.onZoomChange) {
                this.onZoomChange(event.transform, this.currentZoom);
            }
        }, CONFIG.ANIMATION.zoomDebounce);
    }
    
    getZoomLevel() {
        return this.currentZoom;
    }
    
    getTransform() {
        return this.currentTransform;
    }
}

