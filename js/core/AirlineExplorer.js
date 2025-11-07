// Main application class - orchestrates all components
import { CONFIG } from '../config.js';
import { DataLoader } from '../data/DataLoader.js';
import { DataProcessor } from '../data/DataProcessor.js';
import { WorkerManager } from '../utils/WorkerManager.js';
import { ColorUtils } from '../utils/ColorUtils.js';
import { ZoomManager } from '../utils/ZoomManager.js';
import { MapRenderer } from '../visualization/MapRenderer.js';
import { RouteRenderer } from '../visualization/RouteRenderer.js';
import { AirportRenderer } from '../visualization/AirportRenderer.js';
import { SidebarManager } from '../ui/SidebarManager.js';
import { TooltipManager } from '../ui/TooltipManager.js';
import { StatsManager } from '../ui/StatsManager.js';
import { ExportManager } from '../utils/ExportManager.js';

export class AirlineRouteExplorer {
    constructor() {
        this.selectedAirlines = new Set();
        this.snapshot = null;
        this.airlines = new Map();
        this.airports = new Map();
        this.selectedAirports = new Set();  // For multi-airport selection
        
        // State
        this.isUpdating = false;
        this.debounceTimer = null;
        
        // Dimensions
        this.width = window.innerWidth - CONFIG.SIDEBAR_WIDTH;
        this.height = window.innerHeight - CONFIG.HEADER_HEIGHT;
        
        // D3 projection and path
        this.projection = d3.geoMercator()
            .scale(CONFIG.PROJECTION_SCALE)
            .translate([this.width / 2, this.height / 1.5]);
        
        this.path = d3.geoPath().projection(this.projection);
        
        // Initialize modules
        this.dataLoader = new DataLoader();
        this.dataProcessor = new DataProcessor();
        this.workerManager = new WorkerManager();
        this.colorUtils = new ColorUtils();
        this.statsManager = new StatsManager();
        this.exportManager = new ExportManager();
        
        this.init();
    }
    
    init() {
        this.initSVG();
        this.initManagers();
        this.setupWorkerCallbacks();
        this.setupWindowResize();
        this.setupKeyboardShortcuts();
        this.loadData();
    }
    
    initSVG() {
        this.svg = d3.select('#map-svg');
        
        // Click on background to clear airport selection
        this.svg.on('click', () => {
            if (this.selectedAirports.size > 0) {
                this.clearAirportSelection();
            }
        });
        
        // Initialize renderers
        this.mapRenderer = new MapRenderer(this.svg, this.projection, this.path);
        this.mapRenderer.init();
        
        this.snapshotGroup = this.svg.append('g').attr('class', 'snapshot-layer ghost-overlay');
        
        this.routeRenderer = new RouteRenderer(this.svg, this.projection, this.colorUtils);
        this.routeRenderer.init();
        
        this.airportRenderer = new AirportRenderer(this.svg, this.projection, this.colorUtils);
        this.airportRenderer.init();
    }
    
    initManagers() {
        // Tooltip
        this.tooltipManager = new TooltipManager(this.colorUtils);
        
        // Sidebar
        this.sidebarManager = new SidebarManager(
            this.dataLoader,
            (airline, selected) => this.queueAirlineToggle(airline, selected),
            () => this.clearAirportSelection() // Callback to clear airports when clearing all
        );
        this.sidebarManager.init();
        
        // Zoom
        this.zoomManager = new ZoomManager(
            this.svg,
            (transform, zoomLevel) => this.handleZoomChange(transform, zoomLevel),
            (transform, zoomLevel) => this.handleZoomEnd(transform, zoomLevel)
        );
        this.zoomManager.init();
        
        // Snapshot controls
        this.setupSnapshotControls();
        
        // Export controls
        this.setupExportControls();
    }
    
    setupWorkerCallbacks() {
        this.workerManager.on('PROGRESS', (data) => {
            this.statsManager.updateLoadingStatus(data.message, data.progress);
        });
        
        this.workerManager.on('ROUTES_PROCESSED', (data) => {
            this.onRoutesProcessed(data.data);
        });
    }
    
    setupSnapshotControls() {
        document.getElementById('save-snapshot-btn').addEventListener('click', () => {
            this.saveSnapshot();
        });
        
        document.getElementById('clear-snapshot-btn').addEventListener('click', () => {
            this.clearSnapshot();
        });
    }
    
    setupExportControls() {
        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.exportSelectedData('csv');
        });
        
        document.getElementById('export-json-btn').addEventListener('click', () => {
            this.exportSelectedData('json');
        });
    }
    
    
    setupWindowResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.handleResize(), 250);
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // ESC key to clear airport selection
            if (event.key === 'Escape' && this.selectedAirports.size > 0) {
                this.clearAirportSelection();
            }
        });
    }
    
    async loadData() {
        try {
            this.statsManager.updateLoadingStatus('Loading airline names...', 0.05);
            await this.dataLoader.loadAirlineNames();
            
            this.statsManager.updateLoadingStatus('Loading airport coordinates...', 0.1);
            const airportCoords = await this.dataLoader.loadAirportCoordinates();
            
            this.statsManager.updateLoadingStatus('Loading route data...', 0.3);
            const routesData = await this.dataLoader.loadRoutes();
            
            this.statsManager.updateLoadingStatus('Processing routes...', 0.5);
            
            if (this.workerManager.isAvailable()) {
                const coordsObj = {};
                airportCoords.forEach((value, key) => {
                    coordsObj[key] = value;
                });
                
                this.workerManager.postMessage({
                    type: 'PROCESS_ROUTES',
                    data: {
                        routes: routesData,
                        airportCoords: coordsObj
                    }
                });
            } else {
                const processed = this.dataProcessor.processRoutesMainThread(routesData, airportCoords);
                this.airlines = processed.airlines;
                this.airports = processed.airports;
                this.sidebarManager.renderAirlineList(this.airlines);
                this.statsManager.hideLoading();
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Please check the console for details.');
            document.getElementById('loading-overlay').style.display = 'none';
        }
    }
    
    onRoutesProcessed(data) {
        console.log('Routes processed:', data.stats);
        
        this.airlines = new Map();
        data.airlines.forEach(airline => {
            this.airlines.set(airline.name, airline.routes);
        });
        
        this.airports = new Map();
        data.airports.forEach(airport => {
            this.airports.set(airport.code, airport);
        });
        
        this.statsManager.updateLoadingStatus('Rendering interface...', 0.9);
        this.sidebarManager.renderAirlineList(this.airlines);
        this.statsManager.hideLoading();
    }
    
    queueAirlineToggle(airline, selected) {
        if (selected) {
            this.selectedAirlines.add(airline);
        } else {
            this.selectedAirlines.delete(airline);
            // Clear airports that are only connected by the deselected airline
            this.clearAirportsOnlyConnectedByAirline(airline);
        }
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.debouncedUpdate();
        }, CONFIG.ANIMATION.selectionDebounce);
    }
    
    handleAirportClick(airportCode) {
        // Toggle selection - if clicking same airport, deselect it
        if (this.selectedAirports.has(airportCode)) {
            this.selectedAirports.delete(airportCode);
        } else {
            this.selectedAirports.add(airportCode);
        }
        
        // Update visualization immediately
        if (this.selectedAirlines.size > 0) {
            this.updateVisualization();
        }
    }
    
    clearAirportSelection() {
        this.selectedAirports.clear();
        if (this.selectedAirlines.size > 0) {
            this.updateVisualization();
        }
    }
    
    clearAirportsOnlyConnectedByAirline(deselectedAirline) {
        if (this.selectedAirports.size === 0) return;
        
        // Get all routes from currently selected airlines
        const currentRoutes = this.getSelectedRoutes();
        
        // Find airports that are only connected by the deselected airline
        const airportsToRemove = new Set();
        
        this.selectedAirports.forEach(airportCode => {
            // Check if this airport is connected by any remaining selected airlines
            const isConnectedByOtherAirlines = currentRoutes.some(route => 
                (route.source === airportCode || route.dest === airportCode) && 
                route.airline !== deselectedAirline
            );
            
            // If not connected by other airlines, mark for removal
            if (!isConnectedByOtherAirlines) {
                airportsToRemove.add(airportCode);
            }
        });
        
        // Remove airports that are only connected by the deselected airline
        if (airportsToRemove.size > 0) {
            airportsToRemove.forEach(airportCode => {
                this.selectedAirports.delete(airportCode);
            });
            
            console.log(`Cleared ${airportsToRemove.size} airports that were only connected by ${deselectedAirline}`);
            
            // Show brief notification
            this.showAirportClearNotification(airportsToRemove.size, deselectedAirline);
        }
    }
    
    showAirportClearNotification(count, airline) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-pink);
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = `Cleared ${count} airport${count > 1 ? 's' : ''} (only connected by ${airline})`;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    debouncedUpdate() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        this.statsManager.showLoadingBar();
        
        requestAnimationFrame(() => {
            this.updateVisualization();
            this.isUpdating = false;
        });
    }
    
    updateVisualization() {
        const selectedRoutes = this.getSelectedRoutes();
        const airportDegrees = this.dataProcessor.calculateAirportDegrees(selectedRoutes);
        
        const zoomLevel = this.zoomManager.getZoomLevel();
        const transform = this.zoomManager.getTransform();
        
        const filteredRoutes = this.dataProcessor.filterRoutesByZoom(
            selectedRoutes, zoomLevel, transform, this.projection, this.width, this.height
        );
        
        const filteredAirports = this.dataProcessor.filterAirportsByZoom(
            airportDegrees, this.airports, zoomLevel, transform, this.projection, this.width, this.height
        );
        
        // Render routes with highlight information
        this.routeRenderer.render(filteredRoutes, zoomLevel, this.selectedAirports);
        
        const tooltipCallbacks = {
            show: (event, d) => this.tooltipManager.show(event, d),
            hide: () => this.tooltipManager.hide(),
            move: (event) => this.tooltipManager.move(event)
        };
        
        // Add click callback for airport selection
        const clickCallback = (airportCode) => this.handleAirportClick(airportCode);
        
        this.airportRenderer.render(filteredAirports, this.airports, zoomLevel, tooltipCallbacks, this.selectedAirports, clickCallback);
        this.statsManager.updateStats(this.selectedAirlines.size, selectedRoutes, this.selectedAirports, this.airports);
    }
    
    getSelectedRoutes() {
        const routes = [];
        this.selectedAirlines.forEach(airline => {
            if (this.airlines.has(airline)) {
                routes.push(...this.airlines.get(airline));
            }
        });
        return routes;
    }
    
    handleZoomChange(transform, zoomLevel, isActivelyZooming) {
        // Apply transforms immediately for smooth panning/zooming
        this.mapRenderer.updateTransform(transform);
        this.snapshotGroup.attr('transform', transform);
        this.routeRenderer.updateTransform(transform);
        this.airportRenderer.updateTransform(transform);
        
        // Skip expensive visual property updates during active zoom for better performance
        // They will be updated when zoom ends
        if (!isActivelyZooming) {
            this.routeRenderer.updateOpacityByZoom(zoomLevel, this.selectedAirports);
            this.airportRenderer.updateRadiusByZoom(zoomLevel);
        }
    }
    
    handleZoomEnd(transform, zoomLevel) {
        // Update visual properties now that zoom has ended
        this.routeRenderer.updateOpacityByZoom(zoomLevel, this.selectedAirports);
        this.airportRenderer.updateRadiusByZoom(zoomLevel);
        
        // Recalculate and re-render after zoom/pan ends (debounced)
        if (this.selectedAirlines.size > 0) {
            this.updateVisualization();
        }
    }
    
    saveSnapshot() {
        const routes = this.getSelectedRoutes();
        const degrees = this.dataProcessor.calculateAirportDegrees(routes);
        
        this.snapshot = { routes, degrees };
        this.renderSnapshot();
    }
    
    renderSnapshot() {
        if (!this.snapshot) return;
        
        this.snapshotGroup.selectAll('*').remove();
        
        // Ghost routes
        this.snapshotGroup.selectAll('path')
            .data(this.snapshot.routes.slice(0, 3000))
            .enter()
            .append('path')
            .attr('d', d => this.routeRenderer.createArcPath(d))
            .attr('stroke', '#666666')
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .style('opacity', 0.12);
        
        // Ghost airports
        const airports = Array.from(this.snapshot.degrees.entries()).map(([code, degree]) => ({
            code, degree, ...this.airports.get(code)
        }));
        
        this.snapshotGroup.selectAll('circle')
            .data(airports)
            .enter()
            .append('circle')
            .attr('cx', d => this.projection([d.lon, d.lat])[0])
            .attr('cy', d => this.projection([d.lon, d.lat])[1])
            .attr('r', d => this.airportRenderer.getRadius(d.degree))
            .attr('fill', '#666666')
            .style('opacity', 0.12);
    }
    
    clearSnapshot() {
        this.snapshot = null;
        this.snapshotGroup.selectAll('*')
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();
    }
    
    handleResize() {
        this.width = window.innerWidth - CONFIG.SIDEBAR_WIDTH;
        this.height = window.innerHeight - CONFIG.HEADER_HEIGHT;
        
        this.projection
            .scale(CONFIG.PROJECTION_SCALE)
            .translate([this.width / 2, this.height / 1.5]);
        
        this.mapRenderer.redraw();
        
        if (this.selectedAirlines.size > 0) {
            this.updateVisualization();
        }
        if (this.snapshot) {
            this.renderSnapshot();
        }
    }
    
    exportSelectedData(format) {
        if (this.selectedAirlines.size === 0) {
            this.exportManager.showNotification('Please select at least one airline to export', 'error');
            return;
        }
        
        const selectedRoutes = this.getSelectedRoutes();
        const airportDegrees = this.dataProcessor.calculateAirportDegrees(selectedRoutes);
        
        // Format routes data
        const routesData = selectedRoutes.map(route => ({
            airline: route.airline,
            source_airport: route.source,
            destination_airport: route.dest,
            source_latitude: route.sourceCoords.lat,
            source_longitude: route.sourceCoords.lon,
            destination_latitude: route.destCoords.lat,
            destination_longitude: route.destCoords.lon
        }));
        
        // Format airports data
        const airportsData = Array.from(airportDegrees.entries()).map(([code, degree]) => {
            const airport = this.airports.get(code);
            return {
                airport_code: code,
                latitude: airport ? airport.lat : null,
                longitude: airport ? airport.lon : null,
                connection_degree: degree,
                is_selected: this.selectedAirports.has(code)
            };
        });
        
        // Format airlines data
        const airlinesData = Array.from(this.selectedAirlines).map(airline => {
            const routes = this.airlines.get(airline) || [];
            return {
                airline_code: airline,
                airline_name: this.dataLoader.getAirlineName(airline),
                route_count: routes.length
            };
        });
        
        // Create export data structure
        const exportData = {
            metadata: {
                export_date: new Date().toISOString(),
                selected_airlines_count: this.selectedAirlines.size,
                selected_airports_count: this.selectedAirports.size,
                total_routes: selectedRoutes.length,
                total_airports: airportsData.length
            },
            airlines: airlinesData,
            airports: airportsData,
            routes: routesData
        };
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `airline_export_${timestamp}`;
        
        if (format === 'csv') {
            // Export routes as CSV (most common use case)
            this.exportManager.exportToCSV(routesData, `${filename}_routes`);
        } else if (format === 'json') {
            // Export all data as JSON
            this.exportManager.exportToJSON(exportData, filename);
        }
    }
}

