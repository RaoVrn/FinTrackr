import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Budget from '../../../lib/models/Budget';

// POST - Create database indexes for better performance
export async function POST(request) {
  try {
    await connectDB();
    
    console.log('Creating database indexes for Budget collection...');
    
    // Ensure indexes are created
    await Budget.createIndexes();
    
    // Get collection stats
    const collection = Budget.collection;
    const indexes = await collection.listIndexes().toArray();
    
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    return NextResponse.json({
      success: true,
      message: 'Database indexes created successfully',
      indexes: indexes.map(idx => ({
        name: idx.name,
        key: idx.key
      }))
    });

  } catch (error) {
    console.error('POST /api/budgets/indexes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create indexes' },
      { status: 500 }
    );
  }
}