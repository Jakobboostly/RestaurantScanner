# Claude AI Context

## Project Overview
This is a React + TypeScript + D3.js application that visualizes restaurant marketing analytics and provides ROI calculators based on industry benchmarks.

## Key Components
- **SEOPositionChart**: Interactive bar chart showing Local Pack CTR by position
- **ChannelComparisonChart**: Side-by-side comparison of SMS vs Email marketing performance  
- **ROICalculator**: Interactive calculator with inputs for SEO, SMS, and loyalty program ROI
- **SeasonalChart**: Day-of-week traffic multipliers with holiday insights

## Data Source
All benchmark data comes from `restaurant-stats-markdown.md` which contains comprehensive restaurant industry statistics including:
- SEO/Local Pack CTR rates by position
- SMS marketing performance (98% open rates, 19.5% CTR)
- Email marketing benchmarks (28.4% open rate, 4.2% CTR)
- Seasonal and day-of-week multipliers
- Loyalty program performance metrics

## Tech Stack
- **React 18** with TypeScript
- **D3.js v7** for data visualization
- **Vite** for build tooling
- **CSS-in-JS** for styling (inline styles)

## Development Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## File Structure
```
src/
  components/          # React components with D3 visualizations
  data/               # Data models and benchmark calculations
  App.tsx             # Main application layout
  main.tsx            # React DOM entry point
```

## Key Features
1. **Interactive ROI Calculator** - Input restaurant metrics, see projected returns
2. **Position Impact Visualization** - Shows revenue impact of SEO ranking improvements  
3. **Channel Performance Comparison** - Compare SMS vs Email effectiveness
4. **Seasonal Planning Tool** - Understand traffic patterns for budget allocation

## Future Enhancements
- Add more marketing channels (paid ads, social media)
- Implement data export functionality
- Add customer segmentation analysis
- Include competitive benchmarking tools