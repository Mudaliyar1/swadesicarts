const Story = require('../../models/Story');
const cloudinary = require('cloudinary').v2;

// List all stories
exports.list = async (req, res) => {
  try {
    const stories = await Story.find().sort({ displayOrder: 1, createdAt: -1 });
    res.render('admin/stories/list', { 
      title: 'Stories',
      stories,
      currentPage: 'stories'
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).send('Error loading stories');
  }
};

// Show create form
exports.showCreate = async (req, res) => {
  try {
    res.render('admin/stories/create', {
      title: 'Create Story',
      currentPage: 'stories'
    });
  } catch (error) {
    console.error('Error loading create form:', error);
    res.status(500).send('Error loading form');
  }
};

// Create story
exports.create = async (req, res) => {
  try {
    const { title, description, displayOrder } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!req.files || !req.files.media || req.files.media.length === 0) {
      return res.status(400).json({ error: 'At least one media file is required' });
    }

    // Upload all media files to Cloudinary
    const mediaArray = [];
    for (const mediaFile of req.files.media) {
      const isVideo = mediaFile.mimetype.startsWith('video');

      // Upload to Cloudinary from buffer
      const b64 = Buffer.from(mediaFile.buffer).toString('base64');
      const dataURI = `data:${mediaFile.mimetype};base64,${b64}`;
      
      const uploadOptions = {
        resource_type: 'auto',
        folder: 'swadesi-carts/stories',
        quality: 'auto'
      };

      const uploadResult = await cloudinary.uploader.upload(dataURI, uploadOptions);

      mediaArray.push({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        type: isVideo ? 'video' : 'image'
      });
    }

    const newStory = new Story({
      title: title.trim(),
      description: description ? description.trim() : '',
      displayOrder: parseInt(displayOrder) || 0,
      media: mediaArray,
      isActive: true
    });

    await newStory.save();
    res.json({ success: true, message: 'Story created successfully', story: newStory });

  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Error creating story' });
  }
};

// Show edit form
exports.showEdit = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).send('Story not found');
    }
    res.render('admin/stories/edit', { 
      title: 'Edit Story',
      story,
      currentPage: 'stories'
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).send('Error loading form');
  }
};

// Update story
exports.update = async (req, res) => {
  try {
    const { title, description, displayOrder, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    story.title = title.trim();
    story.description = description ? description.trim() : '';
    story.displayOrder = parseInt(displayOrder) || 0;
    story.isActive = isActive === 'on' || isActive === true;

    // If new media files are provided, add them to existing media
    if (req.files && req.files.media && req.files.media.length > 0) {
      for (const mediaFile of req.files.media) {
        const isVideo = mediaFile.mimetype.startsWith('video');

        // Upload to Cloudinary from buffer
        const b64 = Buffer.from(mediaFile.buffer).toString('base64');
        const dataURI = `data:${mediaFile.mimetype};base64,${b64}`;
        
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'auto',
          folder: 'swadesi-carts/stories',
          quality: 'auto'
        });

        story.media.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          type: isVideo ? 'video' : 'image'
        });
      }
    }

    await story.save();
    res.json({ success: true, message: 'Story updated successfully' });

  } catch (error) {
    console.error('Error updating story:', error);
    res.status(500).json({ error: 'Error updating story' });
  }
};

// Delete story
exports.delete = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Delete all media from Cloudinary
    for (const media of story.media) {
      if (media.publicId) {
        try {
          await cloudinary.uploader.destroy(media.publicId, { resource_type: 'auto' });
        } catch (err) {
          console.error('Error deleting media from Cloudinary:', err);
        }
      }
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Story deleted successfully' });

  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Error deleting story' });
  }
};

// Toggle active status
exports.toggleActive = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    story.isActive = !story.isActive;
    await story.save();
    
    res.json({ success: true, message: `Story ${story.isActive ? 'activated' : 'deactivated'}`, isActive: story.isActive });

  } catch (error) {
    console.error('Error toggling story status:', error);
    res.status(500).json({ error: 'Error toggling status' });
  }
};
