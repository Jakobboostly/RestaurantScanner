import { EnhancedInstagramDetector } from './server/services/enhancedInstagramDetector.js';

async function testInstagramDetection() {
  console.log('🔍 Testing Instagram detection manually...');
  
  const detector = new EnhancedInstagramDetector();
  
  try {
    const result = await detector.detectInstagramPage(
      'https://www.ribshacksmokehouse.com',
      'Rib Shack Smoke House',
      '10841 Q St Suite 105, Omaha, NE 68137, USA',
      'Available',
      'ChIJU15_t_Hzk4cRuhEwLlUQcS8'
    );
    
    console.log('📊 Instagram detection result:', result);
    
    if (result) {
      console.log('✅ Instagram detected:', result.url);
      console.log('📊 Confidence:', result.confidence);
      console.log('📊 Source:', result.source);
    } else {
      console.log('❌ Instagram not detected');
    }
    
  } catch (error) {
    console.error('❌ Instagram detection failed:', error);
  }
}

testInstagramDetection();