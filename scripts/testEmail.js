require('dotenv').config();
const emailService = require('../services/emailService');

async function testEmail() {
  console.log('Testing email configuration...\n');
  
  console.log('Environment Variables:');
  console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✓ Set' : '✗ Not set');
  console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? '✓ Set (hidden)' : '✗ Not set');
  console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'WinBid (default)');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'noreply@winbid.com (default)');
  console.log('\n');
  
  // Get test email from command line argument or use a default
  const testEmail = process.argv[2] || process.env.GMAIL_USER;
  
  if (!testEmail) {
    console.error('Please provide a test email address:');
    console.log('Usage: node scripts/testEmail.js <your-email@example.com>');
    process.exit(1);
  }
  
  console.log(`Sending test email to: ${testEmail}\n`);
  
  try {
    // Test with OTP email
    const testOTP = '123456';
    console.log('Attempting to send test OTP email...');
    const result = await emailService.sendOTPEmail(testEmail, testOTP, 'Test User');
    
    if (result.success) {
      console.log('✓ Email sent successfully!');
      console.log('Check your inbox (and spam folder) for the test email.');
    } else {
      console.error('✗ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('✗ Error sending email:');
    console.error(error.message);
    
    // Common error messages
    if (error.message.includes('Invalid login')) {
      console.error('\n💡 Tip: Check that your Gmail app password is correct.');
      console.error('   Gmail app passwords are 16 characters (usually shown as 4 groups).');
      console.error('   If your password has spaces, try removing them.');
    } else if (error.message.includes('Less secure app access')) {
      console.error('\n💡 Tip: Make sure you\'re using an App Password, not your regular password.');
      console.error('   Enable 2-Step Verification and generate an App Password in your Google Account settings.');
    } else if (error.code === 'EAUTH') {
      console.error('\n💡 Tip: Authentication failed. Check your credentials.');
    }
  }
}

testEmail();

