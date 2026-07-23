const Review = require('../models/Review');
const OrganicProduct = require('../models/OrganicProduct');
const SeasonalProduct = require('../models/SeasonalProduct');
const TechPackage = require('../models/TechPackage');
const User = require('../models/User');

exports.submitReview = async (req, res) => {
  let redirectUrl = '/';
  try {
    const { productId, productType, rating, comment } = req.body;
    
    // Resolve redirect URL first
    if (productId && productType) {
      if (productType === 'organic') {
        const product = await OrganicProduct.findById(productId);
        if (product) redirectUrl = `/organic-products/${product.slug}`;
      } else if (productType === 'seasonal') {
        const product = await SeasonalProduct.findById(productId);
        if (product) redirectUrl = `/seasonal-products/${product.slug}`;
      } else if (productType === 'tech') {
        const product = await TechPackage.findById(productId);
        if (product) redirectUrl = `/tech-packages/${product.slug}`;
      }
    }

    if (!productId || !productType || !rating || !comment) {
      req.flash('error', 'All fields are required.');
      return res.redirect(redirectUrl);
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      req.flash('error', 'Rating must be between 1 and 5 stars.');
      return res.redirect(redirectUrl);
    }

    // Comment length limit (1000 characters)
    if (comment.length > 1000) {
      req.flash('error', 'Your comment must not exceed 1000 characters.');
      return res.redirect(redirectUrl);
    }

    // Security Check: Block links, HTML tags, or script signatures
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const htmlRegex = /<[^>]*>/g;
    const codeRegex = /(javascript:|script|<[?%]|function\s*\(|console\.log|eval\(|require\()/gi;

    if (urlRegex.test(comment) || htmlRegex.test(comment) || codeRegex.test(comment)) {
      req.flash('error', 'Links, HTML tags, or programming code are not allowed in reviews.');
      return res.redirect(redirectUrl);
    }

    // Fetch user name
    let userName = req.session.userName;
    if (!userName) {
      const user = await User.findById(req.session.userId);
      userName = user ? user.name : 'Verified User';
    }

    // Create review
    await Review.create({
      productType,
      productId,
      userId: req.session.userId,
      userName: userName,
      rating: ratingVal,
      comment: comment.trim()
    });

    req.flash('success', 'Your review has been submitted successfully!');
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Submit review error:', error);
    req.flash('error', 'An error occurred while submitting your review.');
    res.redirect(redirectUrl);
  }
};

// Edit Review
exports.editReview = async (req, res) => {
  let redirectUrl = '/';
  try {
    const { reviewId, productId, productType, rating, comment } = req.body;
    
    if (!reviewId || !rating || !comment) {
      req.flash('error', 'All fields are required.');
      return res.redirect('back');
    }

    // Resolve redirect URL
    if (productId && productType) {
      if (productType === 'organic') {
        const product = await OrganicProduct.findById(productId);
        if (product) redirectUrl = `/organic-products/${product.slug}`;
      } else if (productType === 'seasonal') {
        const product = await SeasonalProduct.findById(productId);
        if (product) redirectUrl = `/seasonal-products/${product.slug}`;
      } else if (productType === 'tech') {
        const product = await TechPackage.findById(productId);
        if (product) redirectUrl = `/tech-packages/${product.slug}`;
      }
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      req.flash('error', 'Rating must be between 1 and 5 stars.');
      return res.redirect(redirectUrl);
    }

    // Comment length limit (1000 characters)
    if (comment.length > 1000) {
      req.flash('error', 'Your comment must not exceed 1000 characters.');
      return res.redirect(redirectUrl);
    }

    // Security Check: Block links, HTML tags, or script signatures
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const htmlRegex = /<[^>]*>/g;
    const codeRegex = /(javascript:|script|<[?%]|function\s*\(|console\.log|eval\(|require\()/gi;

    if (urlRegex.test(comment) || htmlRegex.test(comment) || codeRegex.test(comment)) {
      req.flash('error', 'Links, HTML tags, or programming code are not allowed in reviews.');
      return res.redirect(redirectUrl);
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Review not found.');
      return res.redirect(redirectUrl);
    }

    // Ensure user owns this review
    if (String(review.userId) !== String(req.session.userId)) {
      req.flash('error', 'You are not authorized to edit this review.');
      return res.redirect(redirectUrl);
    }

    // Update review
    review.rating = ratingVal;
    review.comment = comment.trim();
    await review.save();

    req.flash('success', 'Your review has been updated successfully.');
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Edit review error:', error);
    req.flash('error', 'An error occurred while updating the review.');
    res.redirect(redirectUrl);
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  let redirectUrl = '/';
  try {
    const { reviewId, productId, productType } = req.body;
    
    if (!reviewId) {
      req.flash('error', 'Review ID is required.');
      return res.redirect('back');
    }

    // Resolve redirect URL
    if (productId && productType) {
      if (productType === 'organic') {
        const product = await OrganicProduct.findById(productId);
        if (product) redirectUrl = `/organic-products/${product.slug}`;
      } else if (productType === 'seasonal') {
        const product = await SeasonalProduct.findById(productId);
        if (product) redirectUrl = `/seasonal-products/${product.slug}`;
      } else if (productType === 'tech') {
        const product = await TechPackage.findById(productId);
        if (product) redirectUrl = `/tech-packages/${product.slug}`;
      }
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Review not found.');
      return res.redirect(redirectUrl);
    }

    // Ensure user owns this review
    if (String(review.userId) !== String(req.session.userId)) {
      req.flash('error', 'You are not authorized to delete this review.');
      return res.redirect(redirectUrl);
    }

    // Delete review
    await Review.findByIdAndDelete(reviewId);

    req.flash('success', 'Your review has been deleted successfully.');
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'An error occurred while deleting the review.');
    res.redirect(redirectUrl);
  }
};
