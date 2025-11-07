// D3.js Bar Chart Renderer for airline statistics
import { CONFIG } from '../config.js';

export class BarChartRenderer {
    constructor(colorUtils) {
        this.colorUtils = colorUtils;
        this.svg = null;
        this.data = null;
        this.currentSort = 'count'; // 'count' or 'name'
        this.margin = { top: 20, right: 30, bottom: 40, left: 150 };
    }
    
    render(container, data, sortType = 'count') {
        // Clear previous chart
        container.innerHTML = '';
        
        this.data = data;
        this.currentSort = sortType;
        
        // Sort data
        const sortedData = this.sortData([...data], sortType);
        
        // Take top 20 destinations
        const topData = sortedData.slice(0, 20);
        
        // Calculate dimensions
        const containerWidth = container.offsetWidth;
        const containerHeight = Math.max(topData.length * 35 + this.margin.top + this.margin.bottom, 400);
        const width = containerWidth - this.margin.left - this.margin.right;
        const height = containerHeight - this.margin.top - this.margin.bottom;
        
        // Create SVG
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .style('background', 'transparent');
        
        const g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(topData, d => d.count)])
            .range([0, width])
            .nice();
        
        const yScale = d3.scaleBand()
            .domain(topData.map(d => d.airport))
            .range([0, height])
            .padding(0.2);
        
        // Create color scale
        const colorScale = d3.scaleSequential()
            .domain([0, topData.length - 1])
            .interpolator(d3.interpolateRgbBasis([
                CONFIG.COLORS.accent.blue,
                CONFIG.COLORS.accent.cyan,
                CONFIG.COLORS.accent.purple
            ]));
        
        // Add axes
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d => d.toLocaleString());
        
        const yAxis = d3.axisLeft(yScale);
        
        // X-axis
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .selectAll('text')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '11px');
        
        g.selectAll('.x-axis path, .x-axis line')
            .style('stroke', 'var(--border-color)');
        
        // Y-axis
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '12px')
            .style('font-weight', '500');
        
        g.selectAll('.y-axis path, .y-axis line')
            .style('stroke', 'var(--border-color)');
        
        // Add axis labels
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height + 35)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px')
            .text('Number of Routes');
        
        // Create tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'bar-chart-tooltip')
            .style('position', 'absolute')
            .style('background', 'var(--tooltip-bg)')
            .style('color', 'var(--tooltip-text)')
            .style('padding', '10px 14px')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 10001)
            .style('box-shadow', '0 4px 6px var(--shadow)')
            .style('backdrop-filter', 'blur(10px)');
        
        // Create bars
        const bars = g.selectAll('.bar')
            .data(topData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.airport))
            .attr('width', 0) // Start at 0 for animation
            .attr('height', yScale.bandwidth())
            .attr('fill', (d, i) => colorScale(i))
            .attr('rx', 4)
            .style('cursor', 'pointer')
            .style('opacity', 0.85);
        
        // Animate bars
        bars.transition()
            .duration(600)
            .delay((d, i) => i * 30)
            .attr('width', d => xScale(d.count))
            .style('opacity', 1);
        
        // Add value labels
        const labels = g.selectAll('.label')
            .data(topData)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', 5) // Start at 5 for animation
            .attr('y', d => yScale(d.airport) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('opacity', 0)
            .text(d => d.count.toLocaleString());
        
        // Animate labels
        labels.transition()
            .duration(600)
            .delay((d, i) => i * 30 + 300)
            .attr('x', d => xScale(d.count) + 8)
            .style('opacity', 1);
        
        // Add interactivity
        bars.on('mouseenter', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 1)
                .attr('rx', 6);
            
            tooltip
                .style('opacity', 1)
                .html(`
                    <div style="font-weight: 600; margin-bottom: 4px;">${d.airportName || d.airport}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        <div>Code: <span style="font-family: monospace; color: var(--accent-cyan);">${d.airport}</span></div>
                        <div>Routes: <span style="color: var(--accent-blue); font-weight: 600;">${d.count.toLocaleString()}</span></div>
                    </div>
                `);
        })
        .on('mousemove', function(event) {
            tooltip
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mouseleave', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 0.85)
                .attr('rx', 4);
            
            tooltip.style('opacity', 0);
        });
        
        // Add gridlines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(5)
                .tickSize(-height)
                .tickFormat('')
            )
            .selectAll('line')
            .style('stroke', 'var(--border-color)')
            .style('stroke-opacity', 0.3)
            .style('stroke-dasharray', '2,2');
        
        g.select('.grid path').style('stroke', 'none');
    }
    
    sortData(data, sortType) {
        if (sortType === 'count') {
            return data.sort((a, b) => b.count - a.count);
        } else {
            return data.sort((a, b) => a.airport.localeCompare(b.airport));
        }
    }
    
    update(container, sortType) {
        if (!this.data) return;
        this.render(container, this.data, sortType);
    }
    
    destroy() {
        // Remove tooltip if it exists
        d3.selectAll('.bar-chart-tooltip').remove();
    }
}

