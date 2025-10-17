// Entry point for Airline Route Explorer
// Modular architecture following software engineering best practices

import { AirlineRouteExplorer } from './core/AirlineExplorer.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AirlineRouteExplorer();
});
