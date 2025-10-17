// Zoom and level-of-detail management
import { CONFIG } from '../config.js';

export class ZoomManager {
    constructor(svg, onZoomChange, onZoomEnd) {
        this.svg = svg;
        this.onZoomChange = onZoomChange;
        this.onZoomEnd = onZoomEnd;
        this.currentZoom = 1;
        this.currentTransform = d3.zoomIdentity;
        this.zoomTimer = null;
        this.isActivelyZooming = false;
        
        this.zoomBehavior = d3.zoom()
            .scaleExtent(CONFIG.ZOOM_EXTENT)
            .on('zoom', (event) => this.handleZoom(event))
            .on('end', (event) => this.handleZoomEnd(event));
    }
    
    init() {
        this.svg.call(this.zoomBehavior);
    }
    
    handleZoom(event) {
        this.currentZoom = event.transform.k;
        this.currentTransform = event.transform;
        this.isActivelyZooming = true;
        
        // Apply transforms immediately for smooth interaction
        if (this.onZoomChange) {
            this.onZoomChange(event.transform, this.currentZoom, this.isActivelyZooming);
        }
        
        // Debounce expensive recalculations
        clearTimeout(this.zoomTimer);
        this.zoomTimer = setTimeout(() => {
            this.isActivelyZooming = false;
            if (this.onZoomEnd) {
                this.onZoomEnd(event.transform, this.currentZoom);
            }
        }, CONFIG.ANIMATION.zoomDebounce);
    }
    
    handleZoomEnd(event) {
        // Also trigger on zoom end for immediate feedback when user stops
        clearTimeout(this.zoomTimer);
        this.isActivelyZooming = false;
        if (this.onZoomEnd) {
            this.onZoomEnd(event.transform, event.transform.k);
        }
    }
    
    getZoomLevel() {
        return this.currentZoom;
    }
    
    getTransform() {
        return this.currentTransform;
    }
}

