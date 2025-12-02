import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from 'bcryptjs';
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

    const { currentPassword, newPassword, confirmPassword } = await req.json();
    
    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Response.json({ 
        success: false, 
        error: 'All password fields are required' 
      }, { status: 400 });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return Response.json({ 
        success: false, 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return Response.json({ 
        success: false, 
        error: 'New password and confirm password do not match' 
      }, { status: 400 });
    }

    // Get user with password field
    const userData = await User.findById(user.userId);
    if (!userData) {
      return Response.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isCurrentPasswordValid) {
      return Response.json({ 
        success: false, 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, userData.password);
    if (isSamePassword) {
      return Response.json({ 
        success: false, 
        error: 'New password must be different from current password' 
      }, { status: 400 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(
      user.userId,
      { 
        password: hashedNewPassword,
        lastLoginAt: new Date()
      }
    );

    return Response.json({ 
      success: true, 
      message: 'Password updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Password update error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
