require('dotenv').config();
const sendEmail = require('./helpers/email');

async function test() {
    try {
        console.log('Testing Brevo Email using API Key:', process.env.BREVO_API_KEY ? 'Set' : 'Not Set');
        console.log('Sender Email:', process.env.EMAIL_USER);
        
        await sendEmail('vijaymudaliyar224@gmail.com', 'Test Subject', '<p>Test email</p>');
        console.log('Success! Email sent.');
    } catch (err) {
        console.error('Failed to send test email.');
    }
}

test();
