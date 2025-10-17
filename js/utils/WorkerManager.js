// Web Worker management for background processing
export class WorkerManager {
    constructor() {
        this.worker = null;
        this.callbacks = new Map();
        this.initWorker();
    }
    
    initWorker() {
        try {
            const workerCode = `
                self.onmessage = function(e) {
                    const { type, data } = e.data;
                    
                    if (type === 'PROCESS_ROUTES') {
                        processRoutes(data.routes, data.airportCoords);
                    }
                };

                function processRoutes(routesData, airportCoords) {
                    const airportCoordsMap = new Map(Object.entries(airportCoords));
                    const airlineRoutes = new Map();
                    const airports = new Map();
                    let processedCount = 0;
                    let skippedCount = 0;
                    
                    const totalRoutes = routesData.length;
                    let lastProgressUpdate = 0;
                    
                    routesData.forEach((route, index) => {
                        const airline = route.Airline;
                        const source = route['Source airport'];
                        const dest = route['Destination airport'];
                        
                        if (index - lastProgressUpdate > 5000) {
                            self.postMessage({
                                type: 'PROGRESS',
                                progress: index / totalRoutes,
                                message: \`Processing routes: \${index}/\${totalRoutes}\`
                            });
                            lastProgressUpdate = index;
                        }
                        
                        if (!airline || !source || !dest) {
                            skippedCount++;
                            return;
                        }
                        
                        if (!airportCoordsMap.has(source) || !airportCoordsMap.has(dest)) {
                            skippedCount++;
                            return;
                        }
                        
                        const srcCoords = airportCoordsMap.get(source);
                        const dstCoords = airportCoordsMap.get(dest);
                        
                        const distance = calculateDistance(
                            srcCoords.lat, srcCoords.lon,
                            dstCoords.lat, dstCoords.lon
                        );
                        
                        if (distance < 10) {
                            skippedCount++;
                            return;
                        }
                        
                        if (!airlineRoutes.has(airline)) {
                            airlineRoutes.set(airline, []);
                        }
                        
                        airlineRoutes.get(airline).push({
                            airline,
                            source,
                            dest,
                            sourceCoords: srcCoords,
                            destCoords: dstCoords,
                            distance: distance
                        });
                        
                        airports.set(source, srcCoords);
                        airports.set(dest, dstCoords);
                        
                        processedCount++;
                    });
                    
                    const sortedAirlines = [...airlineRoutes.entries()]
                        .sort((a, b) => b[1].length - a[1].length);
                    
                    const result = {
                        airlines: sortedAirlines.map(([airline, routes]) => ({
                            name: airline,
                            routes: routes,
                            routeCount: routes.length
                        })),
                        airports: Array.from(airports.entries()).map(([code, coords]) => ({
                            code,
                            ...coords
                        })),
                        stats: {
                            processed: processedCount,
                            skipped: skippedCount,
                            totalAirlines: sortedAirlines.length,
                            totalAirports: airports.size
                        }
                    };
                    
                    self.postMessage({
                        type: 'ROUTES_PROCESSED',
                        data: result
                    });
                }

                function calculateDistance(lat1, lon1, lat2, lon2) {
                    const R = 6371;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                              Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return R * c;
                }
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            this.worker = new Worker(workerUrl);
            this.worker.onmessage = (e) => this.handleMessage(e);
            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
                this.worker = null;
            };
        } catch (error) {
            console.warn('Web Worker not available:', error);
            this.worker = null;
        }
    }
    
    handleMessage(e) {
        const { type } = e.data;
        const callback = this.callbacks.get(type);
        if (callback) {
            callback(e.data);
        }
    }
    
    on(type, callback) {
        this.callbacks.set(type, callback);
    }
    
    postMessage(message) {
        if (this.worker) {
            this.worker.postMessage(message);
        }
    }
    
    isAvailable() {
        return this.worker !== null;
    }
}

