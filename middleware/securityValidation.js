/**
 * Global Security Validation Middleware
 * Scans all incoming requests (body, query, params) for malicious or invalid inputs.
 */

// Comprehensive regex to match emojis and most symbols (excluding basic punctuation/math)
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/u;

// Function to recursively scan object fields
function scanObject(obj, isUrlQuery = false) {
    if (!obj || typeof obj !== 'object') return null;

    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        const value = obj[key];

        if (typeof value === 'object') {
            const error = scanObject(value, isUrlQuery);
            if (error) return error;
        } else if (typeof value === 'string') {
            const lowerKey = key.toLowerCase();

            // 1. Handle URLs and Links
            const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/ig;
            if (urlRegex.test(value)) {
                if (lowerKey === 'name' || lowerKey === 'username' || lowerKey === 'displayname') {
                    // Strip the URL from the name instead of blocking
                    obj[key] = value.replace(urlRegex, '').trim();
                } else {
                    // Block the URL in all other fields
                    return `URLs and links are strictly prohibited on this platform. (Field: ${key})`;
                }
            }

            const checkedValue = obj[key];

            // 2. Block HTML tags, image injections, and scripts
            const htmlTagRegex = /<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/gi;
            if (htmlTagRegex.test(checkedValue)) {
                return `HTML tags, images, and file injections are strictly prohibited.`;
            }

            // 3. Block Emojis anywhere
            if (emojiRegex.test(checkedValue)) {
                return `Emojis are strictly prohibited on this platform. (Field: ${key})`;
            }

            // 4. Block SQL injection keywords in specific inputs (basic heuristic)
            const sqlInjections = /(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+.*SET)/i;
            if (sqlInjections.test(checkedValue)) {
                return `Suspicious SQL syntax detected. Request blocked for security.`;
            }

            // 5. Phone number validation (No alphabets)
            if (lowerKey.includes('phone') || lowerKey.includes('contact') || lowerKey.includes('mobile')) {
                if (/[a-zA-Z]/.test(checkedValue)) {
                    return `Alphabet characters are not allowed in phone/contact numbers.`;
                }
            }
        }
    }
    return null;
}

const securityValidation = (req, res, next) => {
    // We scan body, query, and params
    const sources = [
        { data: req.body, name: 'body' },
        { data: req.query, name: 'query' },
        { data: req.params, name: 'params' }
    ];

    for (const source of sources) {
        const errorMsg = scanObject(source.data, source.name === 'query');
        if (errorMsg) {
            console.warn(`[SECURITY] Blocked request from ${req.ip} due to invalid input in ${source.name}: ${errorMsg}`);
            
            // If it's an AJAX request (expects JSON)
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(400).json({ success: false, message: errorMsg });
            }
            
            // Otherwise render an error or send text
            // We use flash if session is available
            if (req.flash && req.session) {
                req.flash('error', errorMsg);
                return req.session.save(() => {
                    const backUrl = req.get('Referrer') || '/';
                    res.redirect(backUrl);
                });
            }
            
            return res.status(400).send(`400 Bad Request: ${errorMsg}`);
        }
    }

    next();
};

module.exports = securityValidation;
