import { NextRequest, NextResponse } from 'next/server';
import { visibilityLogService } from '@/modules/module-4-agent-visibility/services/visibility-log.service';

export async function DELETE(request: NextRequest) {
  try {
    const { logId } = await request.json();

    if (!logId) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      );
    }

    const { success, error } = await visibilityLogService.deleteLogEntry(logId);

    if (!success || error) {
      return NextResponse.json(
        { error: 'Failed to delete log entry', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete-log API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}