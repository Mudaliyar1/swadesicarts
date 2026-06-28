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
        // Collect all error messages from Zod
        const errorMessages = err.errors.map(e => e.message).join(', ');
        
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

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
        email: z.string().email("Invalid email address").max(254, "Email too long"),
        phone: z.string().min(10, "Phone must be at least 10 characters").max(20, "Phone too long").regex(/^\+?[0-9]+$/, "Phone can only contain numbers"),
        password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
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
