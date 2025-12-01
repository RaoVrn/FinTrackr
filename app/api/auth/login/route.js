import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // In a real app, you'd hash passwords. For demo, we'll use plain text
    const user = await User.findOne({ email, password });
    
    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

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
    }, { status: 200 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}