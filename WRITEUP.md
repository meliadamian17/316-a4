# Assignment 4 Writeup: Airline Route Explorer

**Team Members**: [Your names here]  
**Project Title**: Airline Route Explorer: Build-a-Network  
**Live URL**: `https://YOUR-USERNAME.github.io/316-a4/`

---

## Rationale for Design Decisions

### Data & Domain Analysis

After exploring the OpenFlights route dataset (67,000+ routes across 500+ airlines), we identified that the most compelling aspect is understanding **how different airlines shape global connectivity**. Rather than showing everything at once (which creates visual chaos), we decided to enable progressive network construction where users actively build their own view.

### Visual Encodings

**Airport Nodes:**
- **Size encoding (radius)**: We use `sqrt` scale for degree centrality because it creates a perceptually-linear relationship with area, preventing dominant hubs from overwhelming the display. Scale domain [1-100] connections → radius [2-20px].
- **Color encoding (heat map)**: Yellow-to-red sequential color scheme (via D3's `interpolateYlOrRd`) effectively communicates hub strength. We chose a warm palette to evoke the concept of "hot spots" in air travel.
- **Positioning**: Geographic coordinates via Mercator projection maintain spatial relationships users understand intuitively.

**Alternative considered**: We explored using betweenness centrality instead of degree, but found that degree centrality is more immediately interpretable for users ("this airport has X connections") and computationally faster for real-time updates.

**Route Edges:**
- **Curved paths**: We use quadratic Bézier curves rather than straight lines. This reduces visual overlap and creates a more organic, flowing aesthetic that mirrors actual flight paths.
- **Unique airline colors**: Each airline gets a consistent hue (generated via hash function) to enable visual tracking when comparing multiple airlines. Saturation and lightness are fixed for consistency.
- **Semi-transparent strokes (40% opacity)**: Addresses the "hairball" problem in dense networks while allowing users to perceive density through overlapping transparency.

**Alternative considered**: Using edge bundling (like D3's force-directed edge bundling) would reduce clutter further, but we found it obscured individual routes and made the "building" metaphor less clear.

### Interaction Techniques

**1. Progressive Network Building**
- **Rationale**: Starting with a blank map and letting users add airlines piece-by-piece creates a narrative arc. Users develop understanding incrementally rather than being overwhelmed by 67K routes simultaneously.
- **Implementation**: Checkbox-based selection with instant visual feedback. We considered drag-and-drop but found it less efficient for multiple selections.

**2. Animated Route Materialization**
- **Rationale**: 800ms stroke-dasharray animation serves multiple purposes:
  - Creates anticipation and engagement (following animation principles from Heer & Robertson)
  - Helps users track which routes belong to newly-added airlines
  - Provides time for the eye to adjust to layout changes
- **Alternative considered**: Instant rendering would be faster but loses the storytelling quality and makes it harder to perceive what changed.

**3. Snapshot Comparison with Ghost Overlay**
- **Rationale**: Enables before/after analysis (e.g., "How does adding United change network redundancy?"). Ghost overlay (20% opacity, grayscale) is less intrusive than side-by-side views and maintains spatial context.
- **Implementation**: We maintain two independent SVG groups with z-ordering, allowing current network to render in full color over the ghosted snapshot.

**4. Search & Quick Select**
- **Rationale**: With 500+ airlines, scrolling is cognitively demanding. Search reduces interaction cost, while "Top 10" button provides a sensible default starting point.
- **Alternative considered**: Dropdown menus, but checkboxes better support multiple selections and provide persistent visibility of selected state.

**5. Pan & Zoom (Semantic Zoom)**
- **Rationale**: Enables exploration at multiple scales—global patterns vs. regional details. Zoom extent [0.5x - 8x] balances between overview and detail without distorting text/nodes excessively.

### Animation Design Principles

Following Barbara Tversky's guidelines for effective animation:
- **Congruence**: Route drawing animation congruent with concept of "building" a network
- **Apprehension**: Smooth 800ms timing allows users to parse changes without overwhelming working memory
- **Cognitive load**: Color transitions (500ms) are faster than path animations to avoid compounding motion

We intentionally avoided animating the world map or using excessive flourishes, keeping focus on the data.

### Design Quality Decisions

**Layout**: Three-panel design (header, sidebar, map) follows convention for "control panel + canvas" interfaces (see Observable, Flourish). Fixed positioning prevents sidebar from scrolling out of view.

**Typography**: System fonts for fast loading; font-weight hierarchy (bold for titles, regular for labels) creates clear information architecture.

**Color palette**: 
- UI: Tailwind's neutral grays for professional appearance
- Actions: Blue (primary), Green (top airlines), Purple (snapshot), Gray (clear)—colors aligned with common semantic meanings
- Data: Color-blind-friendly sequential scheme for nodes; airline hues distributed across spectrum

**Whitespace**: Generous padding (16-24px) and border-radius (4-8px) prevent cramped feeling and improve scannability.

---

## Development Process Overview

### Team Division of Labor

*(Adjust based on your actual team)*

**Member 1**: Data processing pipeline, D3 network rendering, projection system (8 hours)  
**Member 2**: UI implementation, interaction handlers, search/filter logic (6 hours)  
**Member 3**: Animation system, snapshot feature, testing & polish (4 hours)

Total: ~18 person-hours

### Timeline

- **Week 1 (Oct 10-13)**: Data exploration, sketching interaction concepts, architecture planning
- **Week 2 (Oct 14-16)**: Core implementation, iteration on visual encodings
- **Oct 17**: MVP submission with basic network + animations working

### What Took the Most Time?

1. **Data wrangling (5 hours)**: Matching route data with airport coordinates was challenging. Many airport codes in routes.csv don't have corresponding lat/lon data. We used OpenFlights' airport database but still needed to handle missing values gracefully.

2. **Performance optimization (3 hours)**: Initial implementation rendered all 67K routes simultaneously, causing browser freeze. Solutions:
   - Filter routes to only render selected airlines (obvious in retrospect!)
   - Use `Map` data structures for O(1) lookups instead of array filtering
   - Debounce resize handler to prevent excessive re-renders

3. **Animation choreography (2.5 hours)**: Getting the timing right for smooth transitions required iteration. We tested 400ms, 600ms, 800ms, 1000ms durations and found 800ms hit the sweet spot between snappy and comprehensible.

4. **Geographic projection edge cases (2 hours)**: Trans-Pacific routes initially rendered incorrectly (crossing the entire map width). We switched from linear interpolation to D3's geodesic path interpolation, but ultimately used simple arcs since precision matters less at our zoom levels.

### Unexpected Challenges

**Browser compatibility**: Safari handled the stroke-dasharray animation differently than Chrome, requiring `will-change: transform` CSS optimization.

**Mobile considerations**: While not required, we found touch interactions needed 44px minimum tap targets for checkboxes on phones.

### Tools & Workflow

- **D3.js v7**: Latest version with improved TypeScript types (though we used vanilla JS)
- **GitHub**: Version control with feature branches
- **Chrome DevTools**: Performance profiling revealed rendering bottlenecks
- **Python HTTP server**: Simple local testing without CORS issues

---

## Key Insights from Exploratory Analysis

During data exploration, we discovered:

1. **Airline specialization**: Some airlines (e.g., regional carriers) have dense local networks but no international reach, while others (e.g., Emirates) create long-haul connections with few but critical hubs.

2. **Hub dominance**: ~5% of airports account for ~60% of connections (power law distribution), making visual encoding of centrality essential.

3. **Network redundancy**: Comparing American Airlines vs. United reveals how competing carriers provide redundant coverage on profitable routes—this directly motivated our snapshot comparison feature.

---

## Acknowledgments

- **Data**: OpenFlights contributors (https://openflights.org)
- **Base map**: Natural Earth via TopoJSON
- **Inspiration**: 
  - NameGrapher (incremental filtering interaction pattern)
  - Mike Bostock's airline routes example (geographic projection techniques)
  - VisualCinnamon's chord diagrams (handling visual density)

---

**Data Source Citation**:  
OpenFlights Airport, Airline and Route Databases  
https://openflights.org/data.html  
Licensed under Open Database License (ODbL)


