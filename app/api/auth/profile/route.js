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

export async function GET(req) {
  try {
    await connectDB();
    
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await User.findById(user.userId).select('-password');
    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ 
      success: true, 
      user: userData,
      completionPercentage: userData.completionPercentage
    }, { status: 200 });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
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

    const {
      name,
      phone,
      dateOfBirth,
      occupation,
      address,
      monthlyIncome,
      profileImage,
      currency,
      timezone
    } = await req.json();
    
    // Validate required fields
    if (!name || name.trim().length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Name is required' 
      }, { status: 400 });
    }

    // Validate phone number format if provided
    if (phone && !/^[+]?[1-9][\d\s\-()]{7,15}$/.test(phone)) {
      return Response.json({ 
        success: false, 
        error: 'Please enter a valid phone number' 
      }, { status: 400 });
    }

    // Validate date of birth if provided
    if (dateOfBirth && new Date(dateOfBirth) >= new Date()) {
      return Response.json({ 
        success: false, 
        error: 'Date of birth must be in the past' 
      }, { status: 400 });
    }

    // Validate monthly income if provided
    if (monthlyIncome !== undefined && monthlyIncome < 0) {
      return Response.json({ 
        success: false, 
        error: 'Monthly income cannot be negative' 
      }, { status: 400 });
    }

    // Prepare update object
    const updateData = {
      name: name.trim(),
      ...(phone && { phone }),
      ...(dateOfBirth && { dateOfBirth }),
      ...(occupation && { occupation: occupation.trim() }),
      ...(address && { address }),
      ...(monthlyIncome !== undefined && { monthlyIncome }),
      ...(profileImage && { profileImage }),
      ...(currency && { currency }),
      ...(timezone && { timezone })
    };

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      updateData,
      { 
        new: true, 
        runValidators: true,
        select: '-password'
      }
    );

    if (!updatedUser) {
      return Response.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    return Response.json({ 
      success: true, 
      user: updatedUser,
      completionPercentage: updatedUser.completionPercentage,
      message: 'Profile updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Profile update error:', error);
    
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