// Sidebar controls and airline list management
export class SidebarManager {
    constructor(dataLoader, onSelectionChange, onClearAll, onChartClick) {
        this.dataLoader = dataLoader;
        this.onSelectionChange = onSelectionChange;
        this.onClearAll = onClearAll;
        this.onChartClick = onChartClick;
        this.airlines = new Map();
        this.currentSort = 'routes-desc';
    }
    
    init() {
        this.setupEventListeners();
    }
    
    renderAirlineList(airlines) {
        this.airlines = airlines;
        const container = document.getElementById('airline-list');
        container.innerHTML = '';
        
        const airlineArray = this.sortAirlines(Array.from(airlines.entries()));
        const fragment = document.createDocumentFragment();
        
        airlineArray.forEach(([airline, routes]) => {
            const airlineName = this.dataLoader.getAirlineName(airline);
            const displayName = airlineName !== airline ? airlineName : airline;
            const showCode = airlineName !== airline;
            
            const div = document.createElement('div');
            div.className = 'airline-checkbox flex items-center gap-2 p-2 rounded cursor-pointer';
            div.innerHTML = `
                <input 
                    type="checkbox" 
                    id="airline-${this.escapeId(airline)}" 
                    value="${this.escapeHtml(airline)}"
                    class="w-4 h-4 rounded focus:ring-2"
                    style="accent-color: var(--accent-blue);"
                />
                <label for="airline-${this.escapeId(airline)}" class="flex-1 cursor-pointer text-sm" style="color: var(--text-primary);">
                    <div class="font-medium">${this.escapeHtml(displayName)}</div>
                    <div class="text-xs" style="color: var(--text-secondary);">
                        ${showCode ? `<span class="font-mono">${this.escapeHtml(airline)}</span> · ` : ''}${routes.length.toLocaleString()} routes
                    </div>
                </label>
                <button 
                    class="chart-icon-btn"
                    data-airline="${this.escapeHtml(airline)}"
                    title="View route distribution chart"
                    style="
                        background: var(--bg-tertiary);
                        border: 1px solid var(--border-color);
                        border-radius: 4px;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                        flex-shrink: 0;
                    "
                >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color: var(--text-secondary);">
                        <rect x="2" y="10" width="3" height="4"/>
                        <rect x="6.5" y="6" width="3" height="8"/>
                        <rect x="11" y="2" width="3" height="12"/>
                    </svg>
                </button>
            `;
            
            const checkbox = div.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                this.onSelectionChange(airline, e.target.checked);
                div.classList.toggle('checked', e.target.checked);
            });
            
            // Chart icon button
            const chartBtn = div.querySelector('.chart-icon-btn');
            chartBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent checkbox toggle
                if (this.onChartClick) {
                    this.onChartClick(airline, displayName);
                }
            });
            
            // Hover effects for chart button
            chartBtn.addEventListener('mouseenter', () => {
                chartBtn.style.background = 'var(--accent-blue)';
                chartBtn.style.borderColor = 'var(--accent-blue)';
                chartBtn.querySelector('svg').style.color = 'white';
            });
            chartBtn.addEventListener('mouseleave', () => {
                chartBtn.style.background = 'var(--bg-tertiary)';
                chartBtn.style.borderColor = 'var(--border-color)';
                chartBtn.querySelector('svg').style.color = 'var(--text-secondary)';
            });
            
            fragment.appendChild(div);
        });
        
        container.appendChild(fragment);
    }
    
    sortAirlines(airlineArray) {
        switch (this.currentSort) {
            case 'routes-desc':
                return airlineArray.sort((a, b) => b[1].length - a[1].length);
            
            case 'routes-asc':
                return airlineArray.sort((a, b) => a[1].length - b[1].length);
            
            case 'name-asc':
                return airlineArray.sort((a, b) => {
                    const nameA = this.dataLoader.getAirlineName(a[0]).toLowerCase();
                    const nameB = this.dataLoader.getAirlineName(b[0]).toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            
            case 'name-desc':
                return airlineArray.sort((a, b) => {
                    const nameA = this.dataLoader.getAirlineName(a[0]).toLowerCase();
                    const nameB = this.dataLoader.getAirlineName(b[0]).toLowerCase();
                    return nameB.localeCompare(nameA);
                });
            
            default:
                return airlineArray;
        }
    }
    
    setupEventListeners() {
        // Search
        document.getElementById('airline-search').addEventListener('input', (e) => {
            this.filterAirlines(e.target.value);
        });
        
        // Sort
        document.getElementById('airline-sort').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderAirlineList(this.airlines);
        });
        
        // Select/Clear All
        document.getElementById('select-all-btn').addEventListener('click', () => {
            this.selectAllAirlines(true);
        });
        
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.selectAllAirlines(false);
            // Also clear selected airports when clearing all airlines
            if (this.onClearAll) {
                this.onClearAll();
            }
        });
        
        // Top Airlines
        document.getElementById('top-airlines-btn').addEventListener('click', () => {
            this.selectTopAirlines(10);
        });
    }
    
    filterAirlines(searchTerm) {
        const term = searchTerm.toLowerCase();
        const checkboxes = document.querySelectorAll('.airline-checkbox');
        
        checkboxes.forEach(div => {
            const label = div.querySelector('label').textContent.toLowerCase();
            div.style.display = label.includes(term) ? 'flex' : 'none';
        });
    }
    
    selectAllAirlines(select) {
        const checkboxes = document.querySelectorAll('#airline-list input[type="checkbox"]');
        const visibleCheckboxes = Array.from(checkboxes).filter(cb => 
            cb.parentElement.parentElement.style.display !== 'none'
        );
        
        if (select && visibleCheckboxes.length > 20) {
            if (!confirm(`Selecting ${visibleCheckboxes.length} airlines may impact performance. Continue?`)) {
                return;
            }
        }
        
        visibleCheckboxes.forEach(cb => {
            cb.checked = select;
            this.onSelectionChange(cb.value, select);
            cb.parentElement.parentElement.classList.toggle('checked', select);
        });
    }
    
    selectTopAirlines(count) {
        this.selectAllAirlines(false);
        
        // Sort by route count to get actual top airlines regardless of current sort order
        const topAirlines = Array.from(this.airlines.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, count)
            .map(entry => entry[0]);
        
        topAirlines.forEach(airline => {
            const checkbox = document.getElementById(`airline-${this.escapeId(airline)}`);
            if (checkbox) {
                checkbox.checked = true;
                this.onSelectionChange(airline, true);
                checkbox.parentElement.parentElement.classList.add('checked');
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeId(text) {
        return text.replace(/[^a-zA-Z0-9-_]/g, '_');
    }
}

