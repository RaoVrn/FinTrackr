import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from request headers
function getUserFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { profileImage, removeImage } = await req.json();
    
    // Validate profile image URL if provided
    if (profileImage && !/^https?:\/\/.+/.test(profileImage)) {
      return Response.json({ 
        success: false, 
        error: 'Profile image must be a valid URL' 
      }, { status: 400 });
    }

    // Get current user data
    const userData = await User.findById(user.userId);
    if (!userData) {
      return Response.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    let updateData = {};

    if (removeImage) {
      // Remove profile image and revert to generated avatar
      updateData.profileImage = null;
      updateData.avatar = userData.generateAvatar();
    } else if (profileImage) {
      // Set new profile image
      updateData.profileImage = profileImage;
      updateData.avatar = profileImage;
    } else {
      return Response.json({ 
        success: false, 
        error: 'Either profileImage URL or removeImage flag is required' 
      }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      updateData,
      { 
        new: true, 
        runValidators: true,
        select: '-password'
      }
    );

    return Response.json({ 
      success: true, 
      user: updatedUser,
      message: removeImage ? 'Profile image removed successfully' : 'Profile image updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Avatar update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json({ 
        success: false, 
        error: validationErrors[0] || 'Validation error'
      }, { status: 400 });
    }

    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
