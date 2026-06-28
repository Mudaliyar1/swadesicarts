const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        let errorMessages = '';
        if (err.errors && Array.isArray(err.errors)) {
            errorMessages = err.errors.map(e => e.message).join(', ');
        } else if (err.issues && Array.isArray(err.issues)) {
            errorMessages = err.issues.map(e => e.message).join(', ');
        } else {
            errorMessages = err.message || 'Validation failed';
        }
        
        console.warn(`[VALIDATION FAILED] ${req.ip}: ${errorMessages}`);
        
        // Use existing flash message system if available
        if (req.flash && req.session) {
            req.flash('error', `Validation Error: ${errorMessages}`);
            return req.session.save(() => {
                res.redirect('back');
            });
        }
        
        return res.status(400).json({ success: false, message: errorMessages });
    }
};

// --- Schemas ---

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/u;
const linkRegex = /https?:\/\/[^\s]+|www\.[^\s]+/i;

const registerSchema = z.object({
    body: z.object({
        name: z.string()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name too long")
            .refine(val => !emojiRegex.test(val), "Emojis are not allowed in the name field")
            .refine(val => !linkRegex.test(val), "Links or URLs are not allowed in the name field"),
        email: z.string()
            .email("Invalid email address")
            .max(254, "Email too long")
            .refine(val => !emojiRegex.test(val), "Emojis are not allowed in the email field")
            .refine(val => !linkRegex.test(val), "Links or URLs are not allowed in the email field"),
        phone: z.string()
            .min(10, "Phone must be at least 10 characters")
            .max(250, "Phone too long")
            .refine(val => !emojiRegex.test(val), "Emojis are not allowed in the phone field")
            .refine(val => !linkRegex.test(val), "Links or URLs are not allowed in the phone field"),
        password: z.string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password too long")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[@.#]/, "Password must contain at least one special character (@, ., #)")
            .refine(val => !emojiRegex.test(val), "Emojis are not allowed in the password field")
            .refine(val => !linkRegex.test(val), "Links or URLs are not allowed in the password field"),
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address").max(254),
        password: z.string().min(1).max(128, "Password too long")
    })
});

const inquirySchema = z.object({
    body: z.object({
        name: z.string().max(100),
        email: z.string().email().max(254),
        phone: z.string().max(20),
        message: z.string().max(1000, "Message is too long (max 1000 chars)")
    }).passthrough() // Allow other specific fields for different products
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    inquirySchema
};
