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

export class AirlineRouteExplorer {
    constructor() {
        this.selectedAirlines = new Set();
        this.snapshot = null;
        this.airlines = new Map();
        this.airports = new Map();
        
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
        
        this.init();
    }
    
    init() {
        this.initSVG();
        this.initManagers();
        this.setupWorkerCallbacks();
        this.setupWindowResize();
        this.loadData();
    }
    
    initSVG() {
        this.svg = d3.select('#map-svg');
        
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
            (airline, selected) => this.queueAirlineToggle(airline, selected)
        );
        this.sidebarManager.init();
        
        // Zoom
        this.zoomManager = new ZoomManager(
            this.svg,
            (transform, zoomLevel) => this.handleZoomChange(transform, zoomLevel)
        );
        this.zoomManager.init();
        
        // Snapshot controls
        this.setupSnapshotControls();
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
    
    setupWindowResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.handleResize(), 250);
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
        }
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.debouncedUpdate();
        }, CONFIG.ANIMATION.selectionDebounce);
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
        
        this.routeRenderer.render(filteredRoutes, zoomLevel);
        
        const tooltipCallbacks = {
            show: (event, d) => this.tooltipManager.show(event, d),
            hide: () => this.tooltipManager.hide(),
            move: (event) => this.tooltipManager.move(event)
        };
        
        this.airportRenderer.render(filteredAirports, this.airports, zoomLevel, tooltipCallbacks);
        this.statsManager.updateStats(this.selectedAirlines.size, selectedRoutes);
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
    
    handleZoomChange(transform, zoomLevel) {
        this.mapRenderer.updateTransform(transform);
        this.snapshotGroup.attr('transform', transform);
        this.routeRenderer.updateTransform(transform);
        this.airportRenderer.updateTransform(transform);
        
        this.routeRenderer.updateOpacityByZoom(zoomLevel);
        this.airportRenderer.updateRadiusByZoom(zoomLevel);
        
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
}

