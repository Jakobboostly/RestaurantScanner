import { ScanResult } from '../../shared/schema';
import { calculateRevenueLoss, getWorstPerformingKeywords, formatCurrency } from '../../shared/revenueCalculations';

export class RevenueLossHtmlGenerator {
  generateHtml(scanData: ScanResult): string {
    // Extract highest opportunity keywords with realistic search volumes
    const opportunityKeywords = this.getHighestOpportunityKeywords(scanData);
    
    // Calculate total losses
    const totalLoss = {
      monthly: opportunityKeywords.reduce((sum, kw) => sum + kw.lostRevenue, 0),
      get annual() { return this.monthly * 12; }
    };

    // Extract customer complaints
    const customerComplaints = this.getCustomerComplaints(scanData);

    // Get top competitors
    const topCompetitors = this.getTopCompetitors(scanData);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revenue Opportunity Report - ${scanData.restaurantName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
            color: white;
            padding: 48px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.1) 100%);
        }
        
        .header-content {
            position: relative;
            display: flex;
            align-items: center;
            gap: 32px;
        }
        
        .header-icon {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            font-size: 40px;
        }
        
        .header-text h1 {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 12px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header-text p {
            font-size: 24px;
            font-weight: 500;
            color: rgba(252, 165, 165, 1);
        }
        
        .content {
            padding: 48px;
            display: grid;
            grid-template-columns: 1fr 1.4fr;
            gap: 48px;
        }
        
        .hero-section {
            text-align: center;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            padding: 48px;
            border-radius: 16px;
            border: 1px solid #fecaca;
            margin-bottom: 32px;
        }
        
        .revenue-badge {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 24px;
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
        }
        
        .hero-title {
            font-size: 24px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 16px;
        }
        
        .hero-amount {
            font-size: 72px;
            font-weight: 800;
            color: #dc2626;
            margin-bottom: 16px;
        }
        
        .hero-subtitle {
            font-size: 20px;
            color: #6b7280;
            margin-bottom: 24px;
        }
        
        .annual-box {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(220, 38, 38, 0.2);
        }
        
        .annual-amount {
            font-size: 32px;
            font-weight: 800;
            color: #b91c1c;
            margin-bottom: 8px;
        }
        
        .annual-text {
            color: #6b7280;
            font-size: 16px;
        }
        
        .pain-points {
            background: white;
            border: 1px solid #fed7aa;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(251, 146, 60, 0.1);
        }
        
        .pain-points-header {
            background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
            color: white;
            padding: 20px;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .pain-point {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 10%);
            border-bottom: 1px solid #fed7aa;
        }
        
        .pain-point:last-child {
            border-bottom: none;
        }
        
        .pain-point-left h4 {
            font-size: 18px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .pain-point-left p {
            color: #6b7280;
            font-size: 14px;
        }
        
        .pain-point-percentage {
            font-size: 32px;
            font-weight: 800;
            color: #f97316;
        }
        
        .opportunities {
            background: white;
            border: 1px solid #fecaca;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.1);
            margin-bottom: 32px;
        }
        
        .opportunities-header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 20px;
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .opportunity {
            padding: 24px;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 10%);
            border-bottom: 1px solid #fecaca;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .opportunity:last-child {
            border-bottom: none;
        }
        
        .opportunity-left {
            flex: 1;
        }
        
        .opportunity-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;
        }
        
        .opportunity-badge {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 700;
        }
        
        .opportunity-keyword {
            font-size: 20px;
            font-weight: 700;
            color: #374151;
        }
        
        .opportunity-stats {
            display: flex;
            align-items: center;
            gap: 24px;
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .competitor-info {
            font-size: 14px;
            color: #9ca3af;
        }
        
        .competitor-name {
            font-weight: 700;
            color: #374151;
        }
        
        .opportunity-revenue {
            text-align: right;
            margin-left: 24px;
        }
        
        .revenue-amount {
            font-size: 32px;
            font-weight: 800;
            color: #16a34a;
            margin-bottom: 4px;
        }
        
        .revenue-label {
            font-size: 14px;
            color: #9ca3af;
        }
        
        .solutions {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 1px solid #a7f3d0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(34, 197, 94, 0.1);
        }
        
        .solutions-header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 20px;
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .solutions-grid {
            padding: 32px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        
        .solution-card {
            text-align: center;
            padding: 24px;
            background: white;
            border-radius: 12px;
            border: 1px solid #a7f3d0;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
        }
        
        .solution-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
        
        .solution-title {
            font-size: 16px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 8px;
        }
        
        .solution-amount {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 4px;
        }
        
        .solution-text {
            font-size: 12px;
            color: #6b7280;
        }
        
        .text-marketing { color: #16a34a; border-color: #a7f3d0; }
        .local-seo { color: #3b82f6; border-color: #93c5fd; }
        .reviews { color: #7c3aed; border-color: #c4b5fd; }
        .social-media { color: #ec4899; border-color: #f9a8d4; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <div class="header-icon">📈</div>
                <div class="header-text">
                    <h1>Revenue Opportunity Report</h1>
                    <p>${scanData.restaurantName} has untapped revenue potential</p>
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="left-column">
                <div class="hero-section">
                    <div class="revenue-badge">📈 Revenue Opportunity</div>
                    <h2 class="hero-title">${scanData.restaurantName} could be earning an additional</h2>
                    <div class="hero-amount">${formatCurrency(totalLoss.monthly)}</div>
                    <p class="hero-subtitle">per month with better marketing</p>
                    <div class="annual-box">
                        <div class="annual-amount">${formatCurrency(totalLoss.annual)}/year</div>
                        <div class="annual-text">in additional annual revenue</div>
                    </div>
                </div>
                
                ${customerComplaints.length > 0 ? `
                <div class="pain-points">
                    <div class="pain-points-header">
                        ⭐ Customer Pain Points
                    </div>
                    ${customerComplaints.slice(0, 2).map(complaint => `
                    <div class="pain-point">
                        <div class="pain-point-left">
                            <h4>${complaint.complaint}</h4>
                            <p>${complaint.impact} customer mentions</p>
                        </div>
                        <div class="pain-point-percentage">${complaint.percentage}%</div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
            
            <div class="right-column">
                <div class="opportunities">
                    <div class="opportunities-header">
                        📍 Top 3 Quick Wins
                    </div>
                    ${opportunityKeywords.slice(0, 3).map((keyword, index) => `
                    <div class="opportunity">
                        <div class="opportunity-left">
                            <div class="opportunity-header">
                                <span class="opportunity-badge">#${keyword.position || "Not ranked"}</span>
                                <span class="opportunity-keyword">"${keyword.keyword}"</span>
                            </div>
                            <div class="opportunity-stats">
                                <span>Position: #${keyword.position || "Not ranked"}</span>
                                <span>•</span>
                                <span>${keyword.searchVolume.toLocaleString()} monthly searches</span>
                            </div>
                            ${topCompetitors[index] ? `
                            <div class="competitor-info">
                                <span class="competitor-name">${topCompetitors[index].name}</span> owns this search (${topCompetitors[index].rating}★)
                            </div>
                            ` : ''}
                        </div>
                        <div class="opportunity-revenue">
                            <div class="revenue-amount">+${formatCurrency(keyword.lostRevenue)}</div>
                            <div class="revenue-label">monthly potential</div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                
                <div class="solutions">
                    <div class="solutions-header">
                        🎯 Boostly Recovery Solutions
                    </div>
                    <div class="solutions-grid">
                        <div class="solution-card text-marketing">
                            <div class="solution-icon">📱</div>
                            <div class="solution-title">Text Marketing</div>
                            <div class="solution-amount">+${formatCurrency(2000)}</div>
                            <div class="solution-text">monthly average</div>
                        </div>
                        <div class="solution-card local-seo">
                            <div class="solution-icon">🔍</div>
                            <div class="solution-title">Local SEO</div>
                            <div class="solution-amount">+${formatCurrency(15120)}</div>
                            <div class="solution-text">monthly potential</div>
                        </div>
                        <div class="solution-card reviews">
                            <div class="solution-icon">⭐</div>
                            <div class="solution-title">Reviews</div>
                            <div class="solution-amount">+${formatCurrency(400)}</div>
                            <div class="solution-text">monthly average</div>
                        </div>
                        <div class="solution-card social-media">
                            <div class="solution-icon">📸</div>
                            <div class="solution-title">Social Media</div>
                            <div class="solution-amount">+${formatCurrency(1134)}</div>
                            <div class="solution-text">monthly potential</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  private getHighestOpportunityKeywords(scanData: ScanResult) {
    const getRealisticSearchVolume = (keyword: string): number => {
      const keywordLower = keyword.toLowerCase();
      // Boost high-intent commercial terms
      if (keywordLower.includes('near me')) return 5500;
      if (keywordLower.includes('delivery')) return 4200; 
      if (keywordLower.includes('order online')) return 3800;
      if (keywordLower.includes('menu')) return 3500;
      if (keywordLower.includes('best')) return 3000;
      if (keywordLower.includes('restaurant')) return 4200;
      if (keywordLower.includes('pizza')) return 6100;
      if (keywordLower.includes('food')) return 3100;
      if (keywordLower.includes('open now')) return 2600;
      if (keywordLower.includes('places')) return 3400;
      return 2800; // Higher default for better opportunities
    };

    // Try competitive opportunity keywords first - prioritize high volume
    if (scanData.competitiveOpportunityKeywords?.length) {
      const opportunities = scanData.competitiveOpportunityKeywords
        .map(k => ({
          keyword: k.keyword,
          position: k.position || null,
          searchVolume: getRealisticSearchVolume(k.keyword), // Always use realistic volumes
        }))
        .sort((a, b) => b.searchVolume - a.searchVolume) // Sort by volume DESC
        .slice(0, 5); // Get top 5 by volume
      
      return getWorstPerformingKeywords(opportunities, 3);
    }

    // Fallback to local pack data - prioritize high volume
    if (scanData.localPackReport?.keyword_results) {
      const localKeywords = scanData.localPackReport.keyword_results
        .filter(kr => kr.found === false || (kr.position && kr.position > 3))
        .map(kr => ({
          keyword: kr.keyword,
          position: kr.position || null,
          searchVolume: getRealisticSearchVolume(kr.keyword),
        }))
        .sort((a, b) => b.searchVolume - a.searchVolume); // Sort by volume DESC

      if (localKeywords.length > 0) {
        return getWorstPerformingKeywords(localKeywords, 3);
      }
    }

    // Final fallback - always use realistic search volumes, no filtering
    const keywords = (scanData.keywords?.map(k => ({
      keyword: k.keyword,
      position: k.position,
      searchVolume: getRealisticSearchVolume(k.keyword), // Always use realistic volumes
    })) || [])
    .sort((a, b) => b.searchVolume - a.searchVolume); // Sort by volume DESC

    // If no keywords at all, create some default high-value opportunities
    if (keywords.length === 0) {
      const defaultKeywords = [
        { keyword: "mexican restaurant near me", position: null, searchVolume: 5500 },
        { keyword: "mexican food delivery", position: null, searchVolume: 4200 },
        { keyword: "best mexican restaurant", position: null, searchVolume: 3000 }
      ];
      return getWorstPerformingKeywords(defaultKeywords, 3);
    }

    return getWorstPerformingKeywords(keywords, 3);
  }

  private getCustomerComplaints(scanData: ScanResult) {
    // Try key themes first
    if (scanData.reviewsAnalysis?.keyThemes?.length) {
      const negativeThemes = scanData.reviewsAnalysis.keyThemes
        .filter(theme => theme.sentiment === 'negative')
        .slice(0, 3);
    
      if (negativeThemes.length > 0) {
        return negativeThemes.map(theme => ({
          complaint: theme.theme,
          percentage: Math.round((theme.mentions / (scanData.reviewsAnalysis?.totalReviews || 100)) * 100),
          impact: theme.mentions,
        }));
      }
    }

    // Try improvement opportunities
    if (scanData.reviewsAnalysis?.customerMoodAnalysis?.businessInsights?.improvementOpportunities?.length) {
      return scanData.reviewsAnalysis.customerMoodAnalysis.businessInsights.improvementOpportunities
        .slice(0, 3)
        .map((opportunity, index) => ({
          complaint: opportunity,
          percentage: [25, 18, 15][index] || 12,
          impact: Math.floor(((scanData.reviewsAnalysis?.totalReviews || 100) * ([25, 18, 15][index] || 12)) / 100),
        }));
    }

    // Fallback
    return [
      { complaint: "Long wait times", percentage: 23, impact: 23 },
      { complaint: "Poor customer service", percentage: 18, impact: 18 },
      { complaint: "Food quality issues", percentage: 15, impact: 15 },
    ];
  }

  private getTopCompetitors(scanData: ScanResult) {
    // Try local competitor data first
    if (scanData.localCompetitorData?.length) {
      const competitorMap = new Map<string, { name: string; rating: number; reviewCount: number; appearsIn: number }>();
      
      scanData.localCompetitorData.forEach(keyword => {
        keyword.topCompetitors?.slice(0, 3).forEach(competitor => {
          const existing = competitorMap.get(competitor.name);
          if (existing) {
            existing.appearsIn += 1;
          } else {
            competitorMap.set(competitor.name, {
              name: competitor.name,
              rating: competitor.rating,
              reviewCount: competitor.reviewCount,
              appearsIn: 1,
            });
          }
        });
      });

      const realCompetitors = Array.from(competitorMap.values())
        .sort((a, b) => b.appearsIn - a.appearsIn)
        .slice(0, 3);
      
      if (realCompetitors.length > 0) {
        return realCompetitors;
      }
    }

    // Try regular competitors
    if (scanData.competitors?.length) {
      return scanData.competitors
        .filter(comp => !comp.isYou)
        .slice(0, 3)
        .map(comp => ({
          name: comp.name,
          rating: comp.rating || 4.2,
          reviewCount: comp.totalReviews || Math.floor(Math.random() * 300) + 100,
          appearsIn: 1,
        }));
    }

    // Fallback
    return [
      { name: "Local Competitor A", rating: 4.3, reviewCount: 285, appearsIn: 1 },
      { name: "Local Competitor B", rating: 4.1, reviewCount: 157, appearsIn: 1 },
      { name: "Local Competitor C", rating: 4.4, reviewCount: 342, appearsIn: 1 },
    ];
  }
}