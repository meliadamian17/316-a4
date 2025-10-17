# Deployment Guide for GitHub Pages

## Quick Setup

### 1. Create GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Airline Route Explorer"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/316-a4.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **main branch** and **/ (root)** folder
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Your site will be live at: `https://YOUR-USERNAME.github.io/316-a4/`

### 3. Update URLs in README

Replace `YOUR-USERNAME` with your actual GitHub username in:
- `README.md` (Live Demo section)
- `WRITEUP.md` (Live URL)

## File Structure for GitHub Pages

Your repository should look like this:

```
316-a4/
├── index.html          # Main entry point (GitHub Pages serves this automatically)
├── js/
│   └── main.js        # Application code
├── data/
│   └── routes.csv     # Dataset
├── README.md
├── WRITEUP.md
├── DEPLOYMENT.md      # This file
└── .gitignore
```

**Important**: Keep `index.html` in the root directory. GitHub Pages will automatically serve it as the homepage.

## Alternative: Using /docs Folder

If you prefer to keep development files separate:

1. Create a `docs/` folder
2. Move `index.html`, `js/`, and `data/` into `docs/`
3. In GitHub Settings → Pages, select `/docs` instead of `/ (root)`

## Testing Locally Before Deployment

```bash
# Start local server
python -m http.server 8000

# Or with Node.js
npx http-server -p 8000

# Visit http://localhost:8000
```

## Troubleshooting

### Issue: 404 Error on GitHub Pages

**Solution**: 
- Ensure `index.html` is in the root (or `/docs` if configured)
- Check that GitHub Pages is enabled in Settings
- Wait a few minutes after pushing changes

### Issue: Routes not loading

**Solution**:
- Check browser console for CORS errors
- Verify `data/routes.csv` path is relative: `'data/routes.csv'` (not `'../data/routes.csv'`)
- Ensure the file is committed to Git

### Issue: Map not rendering

**Solution**:
- Check that CDN links for D3, Tailwind, and TopoJSON are accessible
- Verify your browser supports ES6+ JavaScript
- Test in Chrome/Firefox (Safari may have minor rendering differences)

### Issue: Performance issues

**Solution**:
- Don't select all airlines at once (limit to 10-20 for optimal performance)
- Clear snapshots when not needed
- Consider filtering the dataset to top N airlines if hosting a subset

## Updating After Deployment

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push

# GitHub Pages will automatically rebuild (1-2 minutes)
```

## Custom Domain (Optional)

To use a custom domain like `my-viz.com`:

1. Create a `CNAME` file in the root with your domain:
   ```
   my-viz.com
   ```

2. Configure DNS records with your domain provider:
   - Add CNAME record pointing to `YOUR-USERNAME.github.io`

3. In GitHub Settings → Pages, enter your custom domain

## Performance Optimization for Production

For best performance on GitHub Pages:

1. **Reduce dataset size** (optional):
   ```python
   # Keep only top 100 airlines
   import pandas as pd
   df = pd.read_csv('data/routes.csv')
   top_airlines = df['Airline'].value_counts().head(100).index
   df_filtered = df[df['Airline'].isin(top_airlines)]
   df_filtered.to_csv('data/routes.csv', index=False)
   ```

2. **Enable browser caching**: GitHub Pages automatically caches static assets

3. **Compress images** (if you add any): Use TinyPNG or similar

## Submission Checklist

- [ ] Repository is public (or accessible to TAs)
- [ ] GitHub Pages is enabled
- [ ] Live URL is accessible
- [ ] `index.html` loads without errors
- [ ] All interactions work (airline selection, animations, snapshots)
- [ ] README includes correct live demo URL
- [ ] WRITEUP.md is included with design rationale
- [ ] Data source is cited in the visualization

---

**Need help?** Check GitHub Pages documentation: https://docs.github.com/en/pages

