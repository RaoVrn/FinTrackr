import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

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

    // Return user data (exclude password)
    const { password: _, ...userData } = user.toObject();
    
    return Response.json({
      success: true,
      user: userData,
      token: `${user._id}:${user.email}` // Simple token format
    }, { status: 200 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}