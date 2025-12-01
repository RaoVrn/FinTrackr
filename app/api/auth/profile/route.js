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

    return Response.json({ user: userData }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email } = await req.json();
    
    if (!name || !email) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user.userId } });
      if (existingUser) {
        return Response.json({ error: 'Email already taken' }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        name, 
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
      },
      { new: true, select: '-password' }
    );

    return Response.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}