// Export functionality for CSV and JSON formats
export class ExportManager {
    constructor() {}

    /**
     * Export data as CSV file
     * @param {Array} data - Array of objects to export
     * @param {String} filename - Name of the file (without extension)
     */
    exportToCSV(data, filename = 'export') {
        if (!data || data.length === 0) {
            this.showNotification('No data to export', 'error');
            return;
        }

        try {
            // Get headers from first object
            const headers = Object.keys(data[0]);
            
            // Create CSV content
            const csvRows = [];
            
            // Add header row
            csvRows.push(headers.join(','));
            
            // Add data rows
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // Handle values that contain commas, quotes, or newlines
                    if (value == null) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csvRows.push(values.join(','));
            });
            
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            this.downloadFile(blob, `${filename}.csv`, 'text/csv');
            
            this.showNotification(`Exported ${data.length} records to ${filename}.csv`, 'success');
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.showNotification('Error exporting to CSV', 'error');
        }
    }

    /**
     * Export data as JSON file
     * @param {Array|Object} data - Data to export (array or object)
     * @param {String} filename - Name of the file (without extension)
     */
    exportToJSON(data, filename = 'export') {
        if (!data) {
            this.showNotification('No data to export', 'error');
            return;
        }

        try {
            const jsonContent = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            this.downloadFile(blob, `${filename}.json`, 'application/json');
            
            const count = Array.isArray(data) ? data.length : 1;
            this.showNotification(`Exported data to ${filename}.json`, 'success');
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            this.showNotification('Error exporting to JSON', 'error');
        }
    }

    /**
     * Download a file using browser's download functionality
     * @param {Blob} blob - File blob to download
     * @param {String} filename - Name of the file
     * @param {String} mimeType - MIME type of the file
     */
    downloadFile(blob, filename, mimeType) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object after a delay
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Show a notification message
     * @param {String} message - Message to display
     * @param {String} type - Type of notification ('success' or 'error')
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'var(--accent-blue)' : 'var(--accent-pink)';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

