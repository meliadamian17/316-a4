// Color utilities and scales
import { CONFIG } from '../config.js';

export class ColorUtils {
    constructor() {
        // Vercel-style color scale for airport nodes
        this.nodeColorScale = d3.scaleLinear()
            .domain([1, 25, 50])
            .range([CONFIG.COLORS.accent.blue, CONFIG.COLORS.accent.cyan, CONFIG.COLORS.accent.pink]);
    }
    
    getNodeColor(degree) {
        return this.nodeColorScale(Math.min(degree, 50));
    }
    
    getAirlineColor(airlineCode) {
        // Hash airline code to get consistent color
        let hash = 0;
        for (let i = 0; i < airlineCode.length; i++) {
            hash = airlineCode.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return CONFIG.COLORS.vercelPalette[Math.abs(hash) % CONFIG.COLORS.vercelPalette.length];
    }
    
    getHubStatusColor(degree) {
        if (degree > 50) return CONFIG.COLORS.accent.pink;
        if (degree > 20) return CONFIG.COLORS.accent.purple;
        if (degree < 5) return '#888888';
        return CONFIG.COLORS.accent.cyan;
    }
    
    getHubStatusLabel(degree) {
        if (degree > 50) return 'Major International Hub';
        if (degree > 20) return 'Significant Hub';
        if (degree < 5) return 'Small Airport';
        return 'Regional Hub';
    }
}

