// Theme Manager - Handles dark/light mode switching
export class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupToggleButton();
        this.updateButtonState();
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('airline-explorer-theme');
        } catch (error) {
            console.warn('Could not access localStorage:', error);
            return 'dark'; // Default to dark mode
        }
    }

    storeTheme(theme) {
        try {
            localStorage.setItem('airline-explorer-theme', theme);
        } catch (error) {
            console.warn('Could not store theme in localStorage:', error);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.storeTheme(theme);
        
        // Update body class for Tailwind compatibility
        document.body.className = theme === 'dark' ? 'bg-gray-50' : 'bg-white';
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.updateButtonState();
        
        // Dispatch custom event for other components that might need to react to theme changes
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: newTheme } 
        }));
        
        // Trigger map re-rendering for theme changes
        if (window.app && window.app.handleThemeChange) {
            window.app.handleThemeChange(newTheme);
        }
    }

    setupToggleButton() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    updateButtonState() {
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        const themeText = document.getElementById('theme-text');

        if (sunIcon && moonIcon && themeText) {
            if (this.currentTheme === 'dark') {
                // Dark mode: show sun icon (to switch to light)
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
                themeText.textContent = 'Light';
            } else {
                // Light mode: show moon icon (to switch to dark)
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
                themeText.textContent = 'Dark';
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    setTheme(theme) {
        if (theme === 'dark' || theme === 'light') {
            this.applyTheme(theme);
            this.updateButtonState();
        }
    }
}
