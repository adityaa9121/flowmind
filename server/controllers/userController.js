const User = require('../models/User');

const syncUser = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.user; // from auth middleware
    
    // Find user by firebase uid
    let user = await User.findOne({ firebaseUid: uid });
    
    if (user) {
      // Update last login
      user.lastLogin = Date.now();
      
      // Update other fields in case they changed on Firebase
      if (name) user.name = name;
      if (photoURL) user.profilePhoto = photoURL;
      
      await user.save();
      return res.status(200).json({ message: 'User synced successfully', user });
    } else {
      // Create new user
      user = new User({
        firebaseUid: uid,
        email: email,
        name: name || email.split('@')[0],
        profilePhoto: photoURL || '',
      });
      await user.save();
      return res.status(201).json({ message: 'User created successfully', user });
    }
  } catch (error) {
    console.error('User Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync user data' });
  }
};

module.exports = {
  syncUser
};
