import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    console.log('Test memory API called');
    
    const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
    console.log('Storage dir:', storageDir);
    console.log('Storage dir exists:', fs.existsSync(storageDir));
    
    if (!fs.existsSync(storageDir)) {
      return NextResponse.json({ 
        success: true, 
        memories: [], 
        totalCount: 0,
        message: "Storage directory does not exist"
      });
    }

    const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.json'));
    console.log('Found files:', files.length);
    
    const memories = [];
    for (const file of files.slice(0, 3)) {
      try {
        const filePath = path.join(storageDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const memory = JSON.parse(data);
        memories.push({
          id: memory.id,
          summary: memory.summary.substring(0, 100) + '...',
          memoryTags: memory.memoryTags,
          timestamp: memory.timestamp
        });
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    }

    console.log('Returning memories:', memories.length);
    
    return NextResponse.json({
      success: true,
      memories,
      totalCount: memories.length,
      message: "Test successful"
    });

  } catch (err: any) {
    console.error('Test memory error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err?.message ?? "Unknown error",
        message: "Test failed"
      },
      { status: 500 }
    );
  }
}
