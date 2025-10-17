// Data loading from external sources
import { CONFIG } from '../config.js';

export class DataLoader {
    constructor() {
        this.airlineNames = new Map();
        this.airportCoordinates = new Map();
    }
    
    async loadAirlineNames() {
        try {
            const response = await fetch(CONFIG.DATA_SOURCES.airlines);
            const text = await response.text();
            
            text.split('\n').forEach(line => {
                if (!line.trim()) return;
                const parts = line.split(',').map(p => p.replace(/"/g, ''));
                const [id, name, alias, iata, icao] = parts;
                
                if (iata && iata !== '\\N' && iata !== '-') {
                    this.airlineNames.set(iata, name || iata);
                }
                if (icao && icao !== '\\N' && icao !== '-') {
                    this.airlineNames.set(icao, name || icao);
                }
                if (id) {
                    this.airlineNames.set(id, name || id);
                }
            });
            
            console.log(`Loaded ${this.airlineNames.size} airline names`);
            return this.airlineNames;
        } catch (error) {
            console.warn('Could not load airline names:', error);
            return new Map();
        }
    }
    
    async loadAirportCoordinates() {
        try {
            const response = await fetch(CONFIG.DATA_SOURCES.airports);
            const text = await response.text();
            
            text.split('\n').forEach(line => {
                if (!line.trim()) return;
                const parts = line.split(',').map(p => p.replace(/"/g, ''));
                const [id, name, city, country, iata, icao, lat, lon] = parts;
                
                if (iata && lat && lon && iata.length === 3) {
                    this.airportCoordinates.set(iata, {
                        code: iata,
                        name: name,
                        city: city,
                        country: country,
                        lat: parseFloat(lat),
                        lon: parseFloat(lon)
                    });
                }
            });
            
            console.log(`Loaded ${this.airportCoordinates.size} airport coordinates`);
            return this.airportCoordinates;
        } catch (error) {
            console.error('Error loading airport coordinates:', error);
            throw error;
        }
    }
    
    async loadRoutes() {
        try {
            const routesText = await d3.text(CONFIG.DATA_SOURCES.routes);
            const routesData = d3.csvParse(routesText);
            console.log(`Loaded ${routesData.length} routes`);
            return routesData;
        } catch (error) {
            console.error('Error loading routes:', error);
            throw error;
        }
    }
    
    getAirlineName(code) {
        return this.airlineNames.get(code) || code;
    }
}

