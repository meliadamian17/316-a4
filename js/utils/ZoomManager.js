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
        
        // RAF throttling for zoom events
        this.rafPending = false;
        this.lastZoomEvent = null;
        
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
        this.lastZoomEvent = event;
        
        // Throttle zoom updates using RAF for smooth updates
        if (!this.rafPending) {
            this.rafPending = true;
            requestAnimationFrame(() => {
                this.rafPending = false;
                
                if (this.onZoomChange && this.lastZoomEvent) {
                    this.onZoomChange(
                        this.lastZoomEvent.transform, 
                        this.lastZoomEvent.transform.k, 
                        this.isActivelyZooming
                    );
                }
            });
        }
        
        // Debounce expensive recalculations with longer delay
        clearTimeout(this.zoomTimer);
        this.zoomTimer = setTimeout(() => {
            this.isActivelyZooming = false;
            if (this.onZoomEnd) {
                this.onZoomEnd(event.transform, this.currentZoom);
            }
        }, CONFIG.ANIMATION.zoomDebounce);
    }
    
    handleZoomEnd(event) {
        // Only trigger if we're still actively zooming (prevent duplicate calls)
        if (this.isActivelyZooming) {
            clearTimeout(this.zoomTimer);
            this.isActivelyZooming = false;
            if (this.onZoomEnd) {
                this.onZoomEnd(event.transform, event.transform.k);
            }
        }
    }
    
    getZoomLevel() {
        return this.currentZoom;
    }
    
    getTransform() {
        return this.currentTransform;
    }
}

