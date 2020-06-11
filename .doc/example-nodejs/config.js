require('dotenv').config();

module.exports = () => {
    return {
        status: process.env.STATUS,
        devMail: process.env.DEV_EMAIL,
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        loggerMP: "email-log@gotham.com",
        fromMP: "Bruce Wayne <bruce@gotham.com>",
    };
};