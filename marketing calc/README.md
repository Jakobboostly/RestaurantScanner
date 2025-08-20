# Restaurant Marketing Analytics Tool

An interactive web application that helps restaurant owners visualize marketing performance and calculate ROI across different channels using industry benchmarks.

## 🚀 Features

### Interactive ROI Calculator
- **SEO Position Impact**: Calculate revenue gains from improving Local Pack rankings
- **SMS Marketing ROI**: Project returns based on list size and campaign frequency  
- **Loyalty Program Analysis**: Estimate revenue increase from customer retention programs

### Data Visualizations
- **Local Pack CTR Chart**: Visual representation of click-through rates by search position
- **Channel Comparison**: Side-by-side performance metrics for SMS vs Email marketing
- **Seasonal Traffic Patterns**: Day-of-week multipliers and holiday impact analysis

### Industry Benchmarks
Based on comprehensive restaurant industry data including:
- Local Pack CTR: 33% (Position #1), 22% (Position #2), 13% (Position #3)
- SMS Performance: 98% open rates, 19.5% click rates
- Email Performance: 28.4% open rates, 4.2% click rates
- Seasonal factors and holiday traffic boosts

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Visualization**: D3.js v7
- **Build Tool**: Vite
- **Styling**: CSS-in-JS (inline styles)

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser

## 🎯 Use Cases

### For Restaurant Owners
- **Budget Planning**: Understand which marketing channels offer the best ROI
- **Performance Benchmarking**: Compare your metrics against industry standards
- **Strategic Planning**: Visualize the impact of marketing investments

### For Marketing Agencies
- **Client Presentations**: Interactive dashboards to demonstrate potential value
- **Strategy Development**: Data-driven recommendations based on industry benchmarks
- **ROI Projections**: Concrete numbers for marketing campaign proposals

### For Consultants
- **Market Analysis**: Comprehensive view of restaurant marketing landscape
- **Performance Audits**: Compare client performance to industry benchmarks
- **Growth Planning**: Identify highest-impact marketing opportunities

## 📊 Data Sources

All benchmark data is sourced from:
- Restaurant industry performance studies
- Local search and SEO research
- Email and SMS marketing benchmarks
- Seasonal traffic analysis reports

## 🔧 Development

### Project Structure
```
src/
├── components/           # React components
│   ├── SEOPositionChart.tsx
│   ├── ChannelComparisonChart.tsx
│   ├── ROICalculator.tsx
│   └── SeasonalChart.tsx
├── data/                # Data models and calculations
│   └── restaurantStats.ts
├── App.tsx              # Main application
└── main.tsx            # Entry point
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎨 Customization

The application is designed to be easily customizable:

1. **Update Benchmarks**: Modify `src/data/restaurantStats.ts` with new industry data
2. **Add Charts**: Create new D3.js components following existing patterns
3. **Styling**: Update inline styles or add CSS modules for custom branding
4. **Calculations**: Extend ROI calculators with additional marketing channels

## 📈 Future Roadmap

- [ ] **Additional Channels**: Paid advertising, social media, direct mail
- [ ] **Data Export**: PDF reports and CSV downloads
- [ ] **Advanced Analytics**: Customer lifetime value, acquisition costs
- [ ] **Competitive Analysis**: Market share and competitor benchmarking
- [ ] **API Integration**: Real-time data from marketing platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For questions or support, please open an issue in the GitHub repository.