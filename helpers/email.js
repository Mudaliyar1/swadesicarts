const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        
        // Configure API key authorization
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        // Make sure the sender email is verified in your Brevo account
        sendSmtpEmail.sender = { 
            name: "Swadesi Carts", 
            email: "noreply@swadesicarts.in" 
        };
        
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;

        console.log('Attempting to send email via Brevo SDK...');
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully via Brevo SDK. Returned data: ' + JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error sending email via Brevo SDK:');
        if (error.response && error.response.text) {
            console.error(error.response.text);
        } else {
            console.error(error);
        }
        throw error;
    }
};

module.exports = sendEmail;
