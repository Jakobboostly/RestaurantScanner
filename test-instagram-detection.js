import { EnhancedSocialMediaDetector } from './server/services/enhancedSocialMediaDetector.js';

async function testInstagramDetection() {
  console.log('🔍 Testing Instagram detection for SLABpizza...');
  
  const detector = new EnhancedSocialMediaDetector();
  
  try {
    const result = await detector.detectAllSocialMedia(
      'https://slabpizza.com',
      'SLABpizza',
      'Provo, UT',
      null,
      'ChIJuz82rS-AUocR-3xvY0VfApk'
    );
    
    console.log('📊 Social media detection result:', result);
    
    if (result.instagram) {
      console.log('✅ Instagram detected:', result.instagram);
    } else {
      console.log('❌ Instagram not detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testInstagramDetection();