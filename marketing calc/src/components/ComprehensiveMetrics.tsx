import React, { useState } from 'react';

interface MetricCard {
  category: string;
  metrics: {
    label: string;
    value: string;
    benchmark?: string;
    color?: string;
  }[];
}

const ComprehensiveMetrics: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('SEO & Local Search');

  const metricsData: MetricCard[] = [
    {
      category: 'SEO & Local Search',
      metrics: [
        { label: 'Local Pack #1 CTR', value: '33%', benchmark: 'Industry avg', color: '#4ECDC4' },
        { label: 'Local Pack #2 CTR', value: '22%', benchmark: 'Industry avg', color: '#4ECDC4' },
        { label: 'Local Pack #3 CTR', value: '13%', benchmark: 'Industry avg', color: '#4ECDC4' },
        { label: 'Organic #1 CTR', value: '18%', benchmark: 'Industry avg', color: '#95E1D3' },
        { label: 'Organic #2 CTR', value: '7%', benchmark: 'Industry avg', color: '#95E1D3' },
        { label: 'Organic #3 CTR', value: '3%', benchmark: 'Industry avg', color: '#95E1D3' },
        { label: 'Organic #4 CTR', value: '2%', benchmark: 'Industry avg', color: '#95E1D3' },
        { label: 'Organic #5 CTR', value: '1.5%', benchmark: 'Industry avg', color: '#95E1D3' },
        { label: 'Organic #6-7 CTR', value: '<1%', benchmark: 'Industry avg', color: '#95E1D3' },
        { label: 'Website Conversion', value: '5%', benchmark: 'Visitors to customers', color: '#4ECDC4' },
        { label: 'Local Pack Traffic', value: '70%', benchmark: 'Of total search', color: '#4ECDC4' },
        { label: 'Organic Traffic', value: '30%', benchmark: 'Of total search', color: '#95E1D3' }
      ]
    },
    {
      category: 'Paid Advertising',
      metrics: [
        { label: 'Google Ads CPC', value: '$2.00-2.20', benchmark: 'Restaurant avg', color: '#FF6B6B' },
        { label: 'FB/IG CPM', value: '$7.90', benchmark: 'Restaurant avg', color: '#FF6B6B' },
        { label: 'Search Conversion', value: '3-4%', benchmark: 'Google Ads', color: '#FF6B6B' },
        { label: 'Display Conversion', value: '0.5-0.8%', benchmark: 'Display ads', color: '#FF6B6B' },
        { label: 'Geofencing Lift', value: '2-4×', benchmark: 'Store traffic', color: '#FF6B6B' },
        { label: 'Afternoon Clicks', value: '+21%', benchmark: 'vs morning', color: '#FFD93D' },
        { label: 'Late Night Clicks', value: '-9.7%', benchmark: 'vs average', color: '#FFD93D' },
        { label: 'Desktop Conversion', value: '1.7×', benchmark: 'vs mobile', color: '#FF6B6B' }
      ]
    },
    {
      category: 'Direct Mail',
      metrics: [
        { label: 'Local Response Rate', value: '2.96%', benchmark: 'Restaurant avg', color: '#B4B4B4' },
        { label: 'New Mover Response', value: '+23-46%', benchmark: 'vs general', color: '#B4B4B4' },
        { label: 'Saturation Response', value: '<1%', benchmark: 'Untargeted', color: '#B4B4B4' },
        { label: 'Postcard Cost', value: '$0.20-0.30', benchmark: 'Per piece', color: '#B4B4B4' },
        { label: 'Letter Cost', value: '$0.29+', benchmark: 'Per piece', color: '#B4B4B4' },
        { label: 'Optimal Frequency', value: '21 days', benchmark: 'Between mailings', color: '#B4B4B4' },
        { label: 'Response Peak', value: '3rd mailing', benchmark: 'Best results', color: '#B4B4B4' }
      ]
    },
    {
      category: 'Third-Party Delivery',
      metrics: [
        { label: 'Commission Rate', value: '15-30%', benchmark: 'Per order', color: '#FF6B6B' },
        { label: 'New Customer Discovery', value: '65%', benchmark: 'DoorDash users', color: '#FF6B6B' },
        { label: 'Avg Orders/Month', value: '4.6', benchmark: 'Per user', color: '#FF6B6B' },
        { label: 'Gen Z Orders/Month', value: '5.1×', benchmark: 'vs average', color: '#FFD93D' },
        { label: 'Holiday Volume', value: '+25%', benchmark: 'Peak days', color: '#FFD93D' },
        { label: 'Surge Pricing', value: '1.1-2×', benchmark: 'Busy hours', color: '#FF6B6B' }
      ]
    },
    {
      category: 'Seasonal & Timing',
      metrics: [
        { label: 'Mother\'s Day Revenue', value: '+51%', benchmark: 'vs typical Sunday', color: '#FFD93D' },
        { label: 'Mother\'s Day Traffic', value: '+14%', benchmark: 'Transactions', color: '#FFD93D' },
        { label: 'Mother\'s Day Ticket', value: '+32%', benchmark: 'Average size', color: '#FFD93D' },
        { label: 'December Peak', value: 'Highest', benchmark: 'Annual sales', color: '#6BCF7F' },
        { label: 'January Slump', value: '-12%', benchmark: 'vs December', color: '#FF6B6B' },
        { label: 'Holiday Dining Out', value: '68%', benchmark: 'Consumers plan', color: '#FFD93D' },
        { label: 'Weekend vs Weekday', value: 'Much higher', benchmark: 'Fri-Sat peak', color: '#6BCF7F' },
        { label: 'SMS Best Time', value: 'Evening 45%', benchmark: 'Afternoon 25%', color: '#6BCF7F' }
      ]
    },
    {
      category: 'Social Media',
      metrics: [
        { label: 'Instagram Engagement', value: '3.1%', benchmark: 'Restaurant avg', color: '#C7CEEA' },
        { label: 'Facebook Engagement', value: '1.3%', benchmark: 'Restaurant avg', color: '#C7CEEA' },
        { label: 'Follower Conversion', value: '89%', benchmark: 'Buy from followed', color: '#C7CEEA' },
        { label: 'Optimal Posts/Week', value: '6-7', benchmark: 'Best engagement', color: '#C7CEEA' },
        { label: 'Story to Profile', value: '5-10%', benchmark: 'Click through', color: '#C7CEEA' },
        { label: 'UGC Engagement', value: '+28%', benchmark: 'vs brand content', color: '#C7CEEA' },
        { label: 'Influencer ROI', value: '$6.50', benchmark: 'Per $1 spent', color: '#C7CEEA' }
      ]
    }
  ];

  const categories = ['all', ...metricsData.map(card => card.category)];
  
  const filteredData = selectedCategory === 'all' 
    ? metricsData 
    : metricsData.filter(card => card.category === selectedCategory);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>The Numbers That Matter</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {filteredData.map((card) => (
          <div 
            key={card.category}
            style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <h3 style={{ 
              marginBottom: '15px', 
              fontSize: '18px',
              color: '#333',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '10px'
            }}>
              {card.category}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {card.metrics.map((metric, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${metric.color || '#4ECDC4'}`
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {metric.label}
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold',
                    color: metric.color || '#333'
                  }}>
                    {metric.value}
                  </div>
                  {metric.benchmark && (
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {metric.benchmark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px',
        border: '1px solid #4ECDC4'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c7a7b' }}>Key Insights</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#2c7a7b', fontSize: '14px' }}>
          <li>Position #1 in Local Pack drives 33% CTR - 2.5× more than position #3</li>
          <li>Third-party delivery takes 15-30% commission but drives 65% new customer discovery</li>
          <li>Mother's Day generates 51% more revenue than typical Sundays</li>
          <li>SMS has 98% open rate with 19.5% click-through rate</li>
          <li>Desktop converts 1.7× better than mobile for paid ads</li>
          <li>Influencer marketing returns $6.50 per $1 spent</li>
        </ul>
      </div>
    </div>
  );
};

export default ComprehensiveMetrics;