const rateLimit = require('express-rate-limit');

// Common key generator that is safe from undefined req.ip
const getIpKey = (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
};

// 1. Global Rate Limiter (Applied to all routes to prevent simple DDoS)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per `window`
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getIpKey,
    validate: { default: false }
});

// 2. Strict Login Rate Limiter (Brute force protection)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 failed logins per IP
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getIpKey,
    validate: { default: false }
});

// 3. OTP & Forgot Password Limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 OTP/Password reset requests per hour
    message: 'Too many password reset/OTP requests from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getIpKey,
    validate: { default: false }
});

// 4. Inquiry & Contact Form Limiter (Spam protection)
const spamLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Max 20 inquiries per hour
    message: 'You are sending too many inquiries, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getIpKey,
    validate: { default: false }
});

module.exports = {
    globalLimiter,
    loginLimiter,
    authLimiter,
    spamLimiter
};
