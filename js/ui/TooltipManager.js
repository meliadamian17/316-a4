// Tooltip display management
export class TooltipManager {
    constructor(colorUtils) {
        this.colorUtils = colorUtils;
        this.tooltip = d3.select('#tooltip');
    }
    
    show(event, d) {
        const statusColor = this.colorUtils.getHubStatusColor(d.degree);
        const hubStatus = this.colorUtils.getHubStatusLabel(d.degree);
        
        this.tooltip.html(`
            <div style="font-size: 13px;">
                <strong>${this.escapeHtml(d.name)}</strong> <span style="color: #888888;">(${d.code})</span><br/>
                <span style="color: #888888;">${this.escapeHtml(d.city)}, ${this.escapeHtml(d.country)}</span><br/>
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #2a2a2a;">
                    <strong style="color: ${statusColor};">${d.degree}</strong> <span style="color: #888888;">connections</span><br/>
                    <span style="color: ${statusColor}; font-size: 11px;">${hubStatus}</span>
                </div>
            </div>
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .style('opacity', 1);
    }
    
    move(event) {
        this.tooltip
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    hide() {
        this.tooltip.style('opacity', 0);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

