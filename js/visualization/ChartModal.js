// Modal component for displaying charts
export class ChartModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.onClose = null;
        this.init();
    }
    
    init() {
        // Create modal structure
        this.modal = document.createElement('div');
        this.modal.id = 'chart-modal';
        this.modal.className = 'chart-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        this.modal.innerHTML = `
            <div class="modal-content" style="
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                width: 90%;
                max-width: 900px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                transform: scale(0.95);
                transition: transform 0.3s ease;
            ">
                <!-- Header -->
                <div class="modal-header" style="
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <div>
                        <h2 id="modal-title" style="
                            margin: 0;
                            font-size: 20px;
                            font-weight: 600;
                            color: var(--text-primary);
                            letter-spacing: -0.02em;
                        ">Route Distribution</h2>
                        <p id="modal-subtitle" style="
                            margin: 4px 0 0 0;
                            font-size: 13px;
                            color: var(--text-secondary);
                        ">Loading data...</p>
                    </div>
                    <button id="modal-close-btn" style="
                        background: var(--bg-tertiary);
                        border: 1px solid var(--border-color);
                        border-radius: 6px;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                        color: var(--text-secondary);
                    ">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M2 2L14 14M14 2L2 14"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Chart Container -->
                <div class="modal-body" style="
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                    overflow-x: hidden;
                ">
                    <div id="chart-container" style="
                        width: 100%;
                        height: 100%;
                        min-height: 400px;
                    "></div>
                </div>
                
                <!-- Footer with controls -->
                <div class="modal-footer" style="
                    padding: 16px 24px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <div style="
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    ">
                        <button id="sort-by-count-btn" class="sort-btn active" style="
                            background: var(--accent-blue);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            padding: 6px 12px;
                            font-size: 12px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: opacity 0.2s;
                        ">Sort by Count</button>
                        <button id="sort-by-name-btn" class="sort-btn" style="
                            background: var(--bg-tertiary);
                            color: var(--text-primary);
                            border: 1px solid var(--border-color);
                            border-radius: 6px;
                            padding: 6px 12px;
                            font-size: 12px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">Sort by Name</button>
                    </div>
                    <div style="
                        font-size: 11px;
                        color: var(--text-tertiary);
                    ">Press ESC to close</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Close button
        this.modal.querySelector('#modal-close-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Hover effects for close button
        const closeBtn = this.modal.querySelector('#modal-close-btn');
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'var(--bg-hover)';
            closeBtn.style.borderColor = 'var(--border-hover)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'var(--bg-tertiary)';
            closeBtn.style.borderColor = 'var(--border-color)';
        });
    }
    
    open(title, subtitle) {
        this.isOpen = true;
        this.modal.querySelector('#modal-title').textContent = title;
        this.modal.querySelector('#modal-subtitle').textContent = subtitle;
        
        // Show modal
        this.modal.style.display = 'flex';
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.modal.style.opacity = '1';
            const content = this.modal.querySelector('.modal-content');
            content.style.transform = 'scale(1)';
        });
    }
    
    close() {
        this.isOpen = false;
        this.modal.style.opacity = '0';
        const content = this.modal.querySelector('.modal-content');
        content.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            // Clear chart container
            this.getChartContainer().innerHTML = '';
        }, 300);
        
        if (this.onClose) {
            this.onClose();
        }
    }
    
    getChartContainer() {
        return this.modal.querySelector('#chart-container');
    }
    
    getSortButtons() {
        return {
            countBtn: this.modal.querySelector('#sort-by-count-btn'),
            nameBtn: this.modal.querySelector('#sort-by-name-btn')
        };
    }
    
    setActiveSortButton(type) {
        const { countBtn, nameBtn } = this.getSortButtons();
        
        if (type === 'count') {
            countBtn.style.background = 'var(--accent-blue)';
            countBtn.style.color = 'white';
            countBtn.style.border = 'none';
            countBtn.classList.add('active');
            
            nameBtn.style.background = 'var(--bg-tertiary)';
            nameBtn.style.color = 'var(--text-primary)';
            nameBtn.style.border = '1px solid var(--border-color)';
            nameBtn.classList.remove('active');
        } else {
            nameBtn.style.background = 'var(--accent-blue)';
            nameBtn.style.color = 'white';
            nameBtn.style.border = 'none';
            nameBtn.classList.add('active');
            
            countBtn.style.background = 'var(--bg-tertiary)';
            countBtn.style.color = 'var(--text-primary)';
            countBtn.style.border = '1px solid var(--border-color)';
            countBtn.classList.remove('active');
        }
    }
}

