const User = require('../../models/User');

// List all registered users
exports.list = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.render('admin/users/list', {
            title: 'Registered Users',
            users,
            currentPage: 'users',
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        req.flash('error', 'Failed to fetch registered users.');
        res.redirect('/admin/dashboard');
    }
};

// Toggle user active status (block/unblock)
exports.toggleStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/admin/users');
        }

        user.isActive = !user.isActive;
        await user.save();

        req.flash('success', `User account ${user.isActive ? 'unblocked' : 'blocked'} successfully.`);
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error toggling user status:', error);
        req.flash('error', 'Failed to change user status.');
        res.redirect('/admin/users');
    }
};

// Delete user permanently
exports.delete = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/admin/users');
        }

        req.flash('success', 'User deleted successfully.');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error deleting user:', error);
        req.flash('error', 'Failed to delete user.');
        res.redirect('/admin/users');
    }
};
