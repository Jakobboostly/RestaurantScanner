const { EnhancedFacebookDetector } = require('./server/services/enhancedFacebookDetector.ts');

async function testFacebookDetection() {
  const detector = new EnhancedFacebookDetector();
  
  // Test with the Facebook URL from the screenshot
  const manualUrl = 'https://www.facebook.com/profile.php?id=61574231506249';
  
  console.log('Testing Facebook URL detection with:', manualUrl);
  
  try {
    const result = await detector.detectFacebookPage(
      'https://example.com', // dummy website URL
      'Test Restaurant',
      '123 Main St',
      '555-1234',
      undefined, // no placeId for this test
      manualUrl // manual Facebook URL
    );
    
    console.log('Detection result:', result);
    
    if (result) {
      console.log('✅ Facebook page detected successfully!');
      console.log('URL:', result.url);
      console.log('Name:', result.name);
      console.log('Confidence:', result.confidence);
      console.log('Source:', result.source);
      console.log('Verified:', result.verified);
    } else {
      console.log('❌ Facebook page not detected');
    }
    
  } catch (error) {
    console.error('Error during detection:', error);
  }
}

testFacebookDetection();