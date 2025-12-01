import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Create new user (in a real app, hash the password)
    const user = await User.create({
      name,
      email,
      password, // In production, hash this
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (exclude password)
    const { password: _, ...userData } = user.toObject();
    
    return Response.json({
      success: true,
      user: userData,
      token
    }, { status: 201 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}