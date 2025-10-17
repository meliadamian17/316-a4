// Statistics display management
export class StatsManager {
    updateStats(selectedAirlinesCount, routes) {
        const airports = new Set();
        routes.forEach(r => {
            airports.add(r.source);
            airports.add(r.dest);
        });
        
        document.getElementById('stat-airlines').textContent = selectedAirlinesCount;
        document.getElementById('stat-routes').textContent = routes.length.toLocaleString();
        document.getElementById('stat-airports').textContent = airports.size;
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

