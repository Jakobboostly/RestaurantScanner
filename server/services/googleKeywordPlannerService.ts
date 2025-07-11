import { GoogleAdsApi } from 'google-ads-api';

export interface GoogleKeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  intent: string;
  relatedKeywords: string[];
}

export class GoogleKeywordPlannerService {
  private client: GoogleAdsApi;
  private customerId: string;

  constructor(customerId: string, developerToken: string, clientId: string, clientSecret: string, refreshToken: string) {
    this.customerId = customerId;
    
    this.client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });
  }

  async getKeywordResearch(
    keyword: string,
    location: string = 'United States'
  ): Promise<GoogleKeywordData[]> {
    try {
      console.log('Getting keyword research from Google Keyword Planner for:', keyword);
      
      // Get keyword ideas using Google Keyword Planner API
      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      });

      // Generate keyword ideas
      const keywordIdeas = await customer.keywordPlanIdeaService.generateKeywordIdeas({
        customer_id: this.customerId,
        language: { language_code: 'en' },
        geo_target_constants: [this.getLocationConstant(location)],
        include_adult_keywords: false,
        keyword_plan_network: 'GOOGLE_SEARCH',
        keyword_seed: {
          keywords: [keyword]
        }
      });

      // Get historical metrics for keywords
      const keywords = keywordIdeas.results?.slice(0, 10) || [];
      const keywordTexts = keywords.map(idea => idea.text || '');
      
      const historicalMetrics = await customer.keywordPlanIdeaService.generateKeywordHistoricalMetrics({
        customer_id: this.customerId,
        keywords: keywordTexts,
        language: { language_code: 'en' },
        geo_target_constants: [this.getLocationConstant(location)],
        keyword_plan_network: 'GOOGLE_SEARCH'
      });

      // Combine data into structured format
      const keywordData: GoogleKeywordData[] = keywords.map((idea, index) => {
        const metrics = historicalMetrics.results?.[index];
        const monthlySearchVolume = metrics?.monthly_search_volumes?.[0]?.monthly_searches || 0;
        const competition = this.mapCompetitionLevel(idea.keyword_idea_metrics?.competition);
        const cpc = idea.keyword_idea_metrics?.high_top_of_page_bid_micros ? 
          idea.keyword_idea_metrics.high_top_of_page_bid_micros / 1000000 : 0;

        return {
          keyword: idea.text || '',
          searchVolume: monthlySearchVolume,
          competition: competition,
          cpc: cpc,
          intent: this.classifySearchIntent(idea.text || ''),
          relatedKeywords: keywords.slice(0, 5).map(k => k.text || '').filter(Boolean)
        };
      });

      console.log('Google Keyword Planner API returned', keywordData.length, 'keywords');
      return keywordData;

    } catch (error) {
      console.error('Google Keyword Planner API failed:', error);
      
      // Return empty array to maintain data integrity - no mock data
      return [];
    }
  }

  private getLocationConstant(location: string): string {
    // Map location names to Google Ads location constants
    const locationMap: { [key: string]: string } = {
      'United States': '2840',
      'Canada': '2124',
      'United Kingdom': '2826',
      'Australia': '2036',
      'Germany': '2276',
      'France': '2250',
      'Spain': '2724',
      'Italy': '2380',
      'Netherlands': '2528',
      'Sweden': '2752',
      'Norway': '2578',
      'Denmark': '2208',
      'Finland': '2246',
      'Poland': '2616',
      'Czech Republic': '2203',
      'Slovakia': '2703',
      'Hungary': '2348',
      'Romania': '2642',
      'Bulgaria': '2100',
      'Greece': '2300',
      'Turkey': '2792',
      'Russia': '2643',
      'Ukraine': '2804',
      'Belarus': '2112',
      'Lithuania': '2440',
      'Latvia': '2428',
      'Estonia': '2233',
      'Slovenia': '2705',
      'Croatia': '2191',
      'Serbia': '2688',
      'Bosnia and Herzegovina': '2070',
      'Montenegro': '2499',
      'North Macedonia': '2807',
      'Albania': '2008',
      'Kosovo': '383',
      'Moldova': '2498',
      'Georgia': '2268',
      'Armenia': '2051',
      'Azerbaijan': '2031',
      'Kazakhstan': '2398',
      'Uzbekistan': '2860',
      'Turkmenistan': '2795',
      'Tajikistan': '2762',
      'Kyrgyzstan': '2417',
      'Mongolia': '2496',
      'China': '2156',
      'Japan': '2392',
      'South Korea': '2410',
      'North Korea': '2408',
      'Taiwan': '2158',
      'Hong Kong': '2344',
      'Macao': '2446',
      'India': '2356',
      'Pakistan': '2586',
      'Bangladesh': '2050',
      'Sri Lanka': '2144',
      'Nepal': '2524',
      'Bhutan': '2064',
      'Maldives': '2462',
      'Afghanistan': '2004',
      'Iran': '2364',
      'Iraq': '2368',
      'Syria': '2760',
      'Lebanon': '2422',
      'Jordan': '2400',
      'Israel': '2376',
      'Palestine': '2275',
      'Kuwait': '2414',
      'Saudi Arabia': '2682',
      'Bahrain': '2048',
      'Qatar': '2634',
      'United Arab Emirates': '2784',
      'Oman': '2512',
      'Yemen': '2887',
      'Egypt': '2818',
      'Libya': '2434',
      'Tunisia': '2788',
      'Algeria': '2012',
      'Morocco': '2504',
      'Sudan': '2729',
      'South Sudan': '2728',
      'Ethiopia': '2238',
      'Eritrea': '2232',
      'Djibouti': '2262',
      'Somalia': '2706',
      'Kenya': '2404',
      'Uganda': '2800',
      'Tanzania': '2834',
      'Rwanda': '2646',
      'Burundi': '2108',
      'Democratic Republic of the Congo': '2180',
      'Republic of the Congo': '2178',
      'Central African Republic': '2140',
      'Cameroon': '2120',
      'Chad': '2148',
      'Niger': '2562',
      'Nigeria': '2566',
      'Benin': '2204',
      'Togo': '2768',
      'Ghana': '2288',
      'Burkina Faso': '2854',
      'Mali': '2466',
      'Senegal': '2686',
      'Mauritania': '2478',
      'Gambia': '2270',
      'Guinea-Bissau': '2624',
      'Guinea': '2324',
      'Sierra Leone': '2694',
      'Liberia': '2430',
      'Côte d\'Ivoire': '2384',
      'Cape Verde': '2132',
      'São Tomé and Príncipe': '2678',
      'Equatorial Guinea': '2226',
      'Gabon': '2266',
      'Angola': '2024',
      'Namibia': '2516',
      'Botswana': '2072',
      'Zimbabwe': '2716',
      'Zambia': '2894',
      'Malawi': '2454',
      'Mozambique': '2508',
      'Madagascar': '2450',
      'Mauritius': '2480',
      'Seychelles': '2690',
      'Comoros': '2174',
      'Mayotte': '2175',
      'Réunion': '2638',
      'South Africa': '2710',
      'Lesotho': '2426',
      'Swaziland': '2748',
      'Saint Helena': '2654',
      'Ascension Island': '2346',
      'Tristan da Cunha': '2874',
      'Brazil': '2076',
      'Argentina': '2032',
      'Chile': '2152',
      'Peru': '2604',
      'Bolivia': '2068',
      'Paraguay': '2600',
      'Uruguay': '2858',
      'Colombia': '2170',
      'Venezuela': '2862',
      'Guyana': '2328',
      'Suriname': '2740',
      'French Guiana': '2254',
      'Ecuador': '2218',
      'Falkland Islands': '2238',
      'South Georgia and the South Sandwich Islands': '2239',
      'Mexico': '2484',
      'Guatemala': '2320',
      'Belize': '2084',
      'El Salvador': '2222',
      'Honduras': '2340',
      'Nicaragua': '2558',
      'Costa Rica': '2188',
      'Panama': '2591',
      'Cuba': '2192',
      'Jamaica': '2388',
      'Haiti': '2332',
      'Dominican Republic': '2214',
      'Bahamas': '2044',
      'Turks and Caicos Islands': '2796',
      'Cayman Islands': '2136',
      'British Virgin Islands': '2092',
      'U.S. Virgin Islands': '2850',
      'Anguilla': '2660',
      'Saint Martin': '2663',
      'Saint Barthélemy': '2652',
      'Saba': '2590',
      'Sint Eustatius': '2534',
      'Sint Maarten': '2534',
      'Saint Kitts and Nevis': '2659',
      'Antigua and Barbuda': '2028',
      'Montserrat': '2500',
      'Guadeloupe': '2312',
      'Dominica': '2212',
      'Martinique': '2474',
      'Saint Lucia': '2662',
      'Saint Vincent and the Grenadines': '2670',
      'Grenada': '2308',
      'Barbados': '2052',
      'Trinidad and Tobago': '2780',
      'Aruba': '2533',
      'Curaçao': '2531',
      'Bonaire': '2535',
      'Puerto Rico': '2630',
      'Bermuda': '2060',
      'Greenland': '2304',
      'Faroe Islands': '2234',
      'Iceland': '2352',
      'Ireland': '2372',
      'Malta': '2470',
      'Cyprus': '2196',
      'Luxembourg': '2442',
      'Monaco': '2492',
      'San Marino': '2674',
      'Vatican City': '2336',
      'Liechtenstein': '2438',
      'Andorra': '2020',
      'Gibraltar': '2292',
      'Jersey': '2832',
      'Guernsey': '2831',
      'Isle of Man': '2833',
      'Åland Islands': '2248',
      'Svalbard and Jan Mayen': '2578',
      'Bouvet Island': '2074',
      'Heard Island and McDonald Islands': '2334',
      'Norfolk Island': '2574',
      'Christmas Island': '2162',
      'Cocos Islands': '2166',
      'Tokelau': '2772',
      'Niue': '2570',
      'Cook Islands': '2184',
      'American Samoa': '2016',
      'Samoa': '2882',
      'Tonga': '2776',
      'Fiji': '2242',
      'Vanuatu': '2548',
      'New Caledonia': '2540',
      'Solomon Islands': '2090',
      'Papua New Guinea': '2598',
      'Palau': '2585',
      'Nauru': '2520',
      'Marshall Islands': '2584',
      'Micronesia': '2583',
      'Kiribati': '2296',
      'Tuvalu': '2798',
      'Wallis and Futuna': '2876',
      'French Polynesia': '2258',
      'Pitcairn Islands': '2612',
      'New Zealand': '2554',
      'Antarctica': '2010',
      'British Indian Ocean Territory': '2086',
      'French Southern and Antarctic Lands': '2260',
      'United States Minor Outlying Islands': '2854',
      'Baker Island': '2581',
      'Howland Island': '2581',
      'Jarvis Island': '2581',
      'Johnston Atoll': '2581',
      'Kingman Reef': '2581',
      'Midway Atoll': '2581',
      'Navassa Island': '2581',
      'Palmyra Atoll': '2581',
      'Wake Island': '2581',
    };

    return locationMap[location] || '2840'; // Default to United States
  }

  private mapCompetitionLevel(competition: any): number {
    // Map Google Ads competition levels to numeric values
    switch (competition) {
      case 'LOW': return 0.3;
      case 'MEDIUM': return 0.6;
      case 'HIGH': return 0.9;
      default: return 0.5;
    }
  }

  private classifySearchIntent(keyword: string): string {
    const keywordStr = String(keyword || '').toLowerCase();
    if (keywordStr.includes('buy') || keywordStr.includes('order') || keywordStr.includes('delivery')) {
      return 'transactional';
    }
    if (keywordStr.includes('how') || keywordStr.includes('what') || keywordStr.includes('why')) {
      return 'informational';
    }
    if (keywordStr.includes('best') || keywordStr.includes('review') || keywordStr.includes('vs')) {
      return 'investigational';
    }
    if (keywordStr.includes('near me') || keywordStr.includes('location')) {
      return 'local';
    }
    return 'navigational';
  }
}