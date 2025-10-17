// Statistics display management
export class StatsManager {
    updateStats(selectedAirlinesCount, routes, selectedAirportCode = null, selectedAirportData = null) {
        const airports = new Set();
        routes.forEach(r => {
            airports.add(r.source);
            airports.add(r.dest);
        });
        
        document.getElementById('stat-airlines').textContent = selectedAirlinesCount;
        document.getElementById('stat-routes').textContent = routes.length.toLocaleString();
        document.getElementById('stat-airports').textContent = airports.size;
        
        // Update selected airport display
        const selectedAirportEl = document.getElementById('selected-airport-info');
        if (selectedAirportEl) {
            if (selectedAirportCode && selectedAirportData) {
                // Count routes connected to this airport
                const connectedRoutes = routes.filter(r => 
                    r.source === selectedAirportCode || r.dest === selectedAirportCode
                ).length;
                
                selectedAirportEl.innerHTML = `
                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">Selected Airport:</div>
                    <div style="font-weight: 600; color: var(--accent-cyan);">${selectedAirportData.name}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">${selectedAirportCode} · ${connectedRoutes} routes</div>
                `;
                selectedAirportEl.style.display = 'block';
            } else {
                selectedAirportEl.style.display = 'none';
            }
        }
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

