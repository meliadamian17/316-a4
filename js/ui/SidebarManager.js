// Sidebar controls and airline list management
export class SidebarManager {
    constructor(dataLoader, onSelectionChange) {
        this.dataLoader = dataLoader;
        this.onSelectionChange = onSelectionChange;
        this.airlines = new Map();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    renderAirlineList(airlines) {
        this.airlines = airlines;
        const container = document.getElementById('airline-list');
        container.innerHTML = '';
        
        const airlineArray = Array.from(airlines.entries());
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
            `;
            
            const checkbox = div.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                this.onSelectionChange(airline, e.target.checked);
                div.classList.toggle('checked', e.target.checked);
            });
            
            fragment.appendChild(div);
        });
        
        container.appendChild(fragment);
    }
    
    setupEventListeners() {
        // Search
        document.getElementById('airline-search').addEventListener('input', (e) => {
            this.filterAirlines(e.target.value);
        });
        
        // Select/Clear All
        document.getElementById('select-all-btn').addEventListener('click', () => {
            this.selectAllAirlines(true);
        });
        
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.selectAllAirlines(false);
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
        
        const topAirlines = Array.from(this.airlines.keys()).slice(0, count);
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

