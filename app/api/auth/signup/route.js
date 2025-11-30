import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

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

    // Return user data (exclude password)
    const { password: _, ...userData } = user.toObject();
    
    return Response.json({
      success: true,
      user: userData,
      token: `${user._id}:${user.email}` // Simple token format
    }, { status: 201 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}