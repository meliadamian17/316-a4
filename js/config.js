// Configuration and Constants
export const CONFIG = {
    // Visualization dimensions
    SIDEBAR_WIDTH: 320,
    HEADER_HEIGHT: 80,
    
    // Map projection
    PROJECTION_SCALE: 150,
    
    // Zoom settings
    ZOOM_EXTENT: [0.5, 12],
    
    // Performance limits
    MAX_ROUTES_BY_ZOOM: {
        veryZoomedOut: 500,   // < 1x
        normal: 1500,         // 1x - 2x
        zoomedIn: 3000,       // 2x - 4x
        veryZoomedIn: 5000    // > 4x
    },
    
    MIN_DEGREE_BY_ZOOM: {
        veryZoomedOut: 10,    // < 1x
        normal: 5,            // 1x - 2x
        zoomedIn: 2,          // 2x - 4x
        veryZoomedIn: 1       // > 4x
    },
    
    // Visual settings
    NODE_RADIUS_RANGE: [2, 12],
    NODE_DEGREE_DOMAIN: [1, 100],
    
    // Animation durations
    ANIMATION: {
        routeEnter: 600,
        routeExit: 300,
        nodeEnter: 500,
        nodeExit: 300,
        themeTransition: 300,
        zoomDebounce: 200,
        selectionDebounce: 100
    },
    
    // Vercel color palette
    COLORS: {
        accent: {
            blue: '#0070f3',
            cyan: '#50e3c2',
            purple: '#7928ca',
            pink: '#f81ce5',
            magenta: '#ff0080',
            sky: '#00d9ff',
            red: '#ff6b6b',
            teal: '#4ecdc4'
        },
        vercelPalette: [
            '#0070f3', '#50e3c2', '#f81ce5', '#7928ca',
            '#ff0080', '#00d9ff', '#ff6b6b', '#4ecdc4'
        ]
    },
    
    // Data sources
    DATA_SOURCES: {
        worldMap: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
        airports: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
        airlines: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
        routes: 'data/routes.csv'
    },
    
    // Viewport culling padding
    VIEWPORT_PADDING: {
        routes: 200,
        airports: 100
    }
};

