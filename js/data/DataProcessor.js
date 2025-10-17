// Data processing and filtering logic
import { CONFIG } from '../config.js';

export class DataProcessor {
    constructor() {}
    
    processRoutesMainThread(routesData, airportCoords) {
        const airlineRoutes = new Map();
        const airports = new Map();
        
        routesData.forEach(route => {
            const airline = route.Airline;
            const source = route['Source airport'];
            const dest = route['Destination airport'];
            
            if (!airline || !source || !dest) return;
            if (!airportCoords.has(source) || !airportCoords.has(dest)) return;
            
            const srcCoords = airportCoords.get(source);
            const dstCoords = airportCoords.get(dest);
            
            if (!airlineRoutes.has(airline)) {
                airlineRoutes.set(airline, []);
            }
            
            airlineRoutes.get(airline).push({
                airline, source, dest,
                sourceCoords: srcCoords,
                destCoords: dstCoords
            });
            
            airports.set(source, srcCoords);
            airports.set(dest, dstCoords);
        });
        
        return {
            airlines: new Map([...airlineRoutes.entries()].sort((a, b) => b[1].length - a[1].length)),
            airports: airports
        };
    }
    
    calculateAirportDegrees(routes) {
        const degrees = new Map();
        routes.forEach(route => {
            degrees.set(route.source, (degrees.get(route.source) || 0) + 1);
            degrees.set(route.dest, (degrees.get(route.dest) || 0) + 1);
        });
        return degrees;
    }
    
    filterRoutesByZoom(routes, zoomLevel, transform, projection, width, height) {
        // Calculate max routes based on zoom
        let maxRoutes;
        if (zoomLevel < 1) {
            maxRoutes = CONFIG.MAX_ROUTES_BY_ZOOM.veryZoomedOut;
        } else if (zoomLevel < 2) {
            maxRoutes = CONFIG.MAX_ROUTES_BY_ZOOM.normal;
        } else if (zoomLevel < 4) {
            maxRoutes = CONFIG.MAX_ROUTES_BY_ZOOM.zoomedIn;
        } else {
            maxRoutes = CONFIG.MAX_ROUTES_BY_ZOOM.veryZoomedIn;
        }
        
        if (routes.length <= maxRoutes) {
            return routes;
        }
        
        // Viewport culling
        const [[x0, y0], [x1, y1]] = this.getViewportBounds(transform, width, height);
        const padding = CONFIG.VIEWPORT_PADDING.routes;
        
        const visibleRoutes = routes.filter(route => {
            const source = projection([route.sourceCoords.lon, route.sourceCoords.lat]);
            const dest = projection([route.destCoords.lon, route.destCoords.lat]);
            
            if (!source || !dest) return false;
            
            const sourceVisible = source[0] >= x0 - padding && source[0] <= x1 + padding &&
                                 source[1] >= y0 - padding && source[1] <= y1 + padding;
            const destVisible = dest[0] >= x0 - padding && dest[0] <= x1 + padding &&
                               dest[1] >= y0 - padding && dest[1] <= y1 + padding;
            
            return sourceVisible || destVisible;
        });
        
        if (visibleRoutes.length <= maxRoutes) {
            return visibleRoutes;
        }
        
        return this.sampleRoutes(visibleRoutes, maxRoutes);
    }
    
    filterAirportsByZoom(degrees, airports, zoomLevel, transform, projection, width, height) {
        // Filter by degree based on zoom
        let minDegree;
        if (zoomLevel < 1) {
            minDegree = CONFIG.MIN_DEGREE_BY_ZOOM.veryZoomedOut;
        } else if (zoomLevel < 2) {
            minDegree = CONFIG.MIN_DEGREE_BY_ZOOM.normal;
        } else if (zoomLevel < 4) {
            minDegree = CONFIG.MIN_DEGREE_BY_ZOOM.zoomedIn;
        } else {
            minDegree = CONFIG.MIN_DEGREE_BY_ZOOM.veryZoomedIn;
        }
        
        // Filter by viewport
        const [[x0, y0], [x1, y1]] = this.getViewportBounds(transform, width, height);
        const padding = CONFIG.VIEWPORT_PADDING.airports;
        
        const filtered = new Map();
        degrees.forEach((degree, code) => {
            if (degree >= minDegree) {
                const airport = airports.get(code);
                if (airport) {
                    const pos = projection([airport.lon, airport.lat]);
                    if (pos && 
                        pos[0] >= x0 - padding && pos[0] <= x1 + padding &&
                        pos[1] >= y0 - padding && pos[1] <= y1 + padding) {
                        filtered.set(code, degree);
                    }
                }
            }
        });
        
        return filtered;
    }
    
    getViewportBounds(transform, width, height) {
        const topLeft = transform.invert([0, 0]);
        const bottomRight = transform.invert([width, height]);
        return [[topLeft[0], topLeft[1]], [bottomRight[0], bottomRight[1]]];
    }
    
    sampleRoutes(routes, count) {
        const shuffled = routes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

