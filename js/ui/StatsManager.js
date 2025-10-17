// Statistics display management
export class StatsManager {
    updateStats(selectedAirlinesCount, routes, selectedAirports = new Set(), airportsMap = new Map()) {
        const airports = new Set();
        routes.forEach(r => {
            airports.add(r.source);
            airports.add(r.dest);
        });
        
        document.getElementById('stat-airlines').textContent = selectedAirlinesCount;
        document.getElementById('stat-routes').textContent = routes.length.toLocaleString();
        document.getElementById('stat-airports').textContent = airports.size;
        
        // Update selected airports display
        const selectedAirportEl = document.getElementById('selected-airport-info');
        if (selectedAirportEl) {
            if (selectedAirports.size > 0) {
                const selectedAirportsArray = Array.from(selectedAirports);
                const selectedAirportsData = selectedAirportsArray.map(code => airportsMap.get(code)).filter(Boolean);
                
                // Calculate connection stats between selected airports
                const connectionStats = this.calculateConnectionStats(routes, selectedAirports);
                
                let displayHTML = `
                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">Selected Airports (${selectedAirports.size}):</div>
                `;
                
                selectedAirportsData.forEach(airport => {
                    const connectedRoutes = routes.filter(r => 
                        r.source === airport.code || r.dest === airport.code
                    ).length;
                    displayHTML += `
                        <div style="font-weight: 600; color: var(--accent-cyan); margin-bottom: 2px;">${airport.name}</div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">${airport.code} · ${connectedRoutes} routes</div>
                    `;
                });
                
                if (selectedAirports.size > 1) {
                    displayHTML += `
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                            <div style="font-weight: 600; color: var(--accent-blue); margin-bottom: 4px;">Connections Between Selected:</div>
                            <div>Direct Routes: ${connectionStats.directRoutes}</div>
                            <div>Total Connections: ${connectionStats.totalConnections}</div>
                        </div>
                    `;
                }
                
                selectedAirportEl.innerHTML = displayHTML;
                selectedAirportEl.style.display = 'block';
            } else {
                selectedAirportEl.style.display = 'none';
            }
        }
    }
    
    calculateConnectionStats(routes, selectedAirports) {
        const selectedAirportsArray = Array.from(selectedAirports);
        let directRoutes = 0;
        let totalConnections = 0;
        
        // Count direct routes between selected airports
        routes.forEach(route => {
            const sourceSelected = selectedAirports.has(route.source);
            const destSelected = selectedAirports.has(route.dest);
            
            if (sourceSelected && destSelected) {
                directRoutes++;
            }
            
            if (sourceSelected || destSelected) {
                totalConnections++;
            }
        });
        
        return { directRoutes, totalConnections };
    }
    
    updateLoadingStatus(message, progress) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        
        const loadingBar = document.getElementById('loading-bar');
        if (loadingBar) {
            loadingBar.style.transform = `scaleX(${progress})`;
        }
    }
    
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading-overlay').style.display = 'none';
            document.getElementById('loading-bar').style.transform = 'scaleX(1)';
        }, 300);
    }
    
    showLoadingBar() {
        const loadingBar = document.getElementById('loading-bar');
        loadingBar.classList.add('active');
        
        setTimeout(() => {
            loadingBar.classList.remove('active');
            loadingBar.style.transform = 'scaleX(0)';
        }, 300);
    }
}

