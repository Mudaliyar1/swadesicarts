const Visitor = require('../../models/Visitor');

// Save visitor data
exports.saveVisitor = async (req, res) => {
    try {
        const { name, email, mobile, preference } = req.body;

        // Validate inputs
        if (!name || !email || !mobile || !preference) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const visitor = new Visitor({
            name,
            email,
            mobile,
            preference,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        });

        await visitor.save();

        res.json({
            success: true,
            message: 'Thank you for sharing your preferences!',
            preference
        });
    } catch (error) {
        console.error('Error saving visitor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save information'
        });
    }
};

// Get all visitors (Admin)
exports.getAllVisitors = async (req, res) => {
    try {
        const visitors = await Visitor.find()
            .sort({ visitDate: -1 })
            .lean();

        res.render('admin/visitors/list', {
            title: 'Visitor Information - Admin',
            visitors,
            user: req.user,
            currentPage: 'visitors',
            adminName: req.session ? req.session.adminName : null
        });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        res.status(500).render('admin/500', {
            title: 'Error',
            error: error.message
        });
    }
};

// Delete visitor
exports.deleteVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndDelete(req.params.id);
        
        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Visitor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting visitor:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting visitor'
        });
    }
};
