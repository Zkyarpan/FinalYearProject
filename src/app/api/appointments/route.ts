// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Appointment from '@/models/Appointment';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();

    const appointment = await Appointment.create({
      psychologist: data.psychologistId,
      client: data.userId,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      amount: data.amount,
      status: 'pending',
    });

    return NextResponse.json(
      createSuccessResponse(201, {
        message: 'Appointment created successfully',
        appointment,
      })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error: ' + error.message)
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const psychologistId = searchParams.get('psychologistId');

    const query: { client?: string; psychologist?: string } = {};
    if (userId) query.client = userId;
    if (psychologistId) query.psychologist = psychologistId;

    const appointments = await Appointment.find(query)
      .populate('psychologist', 'firstName lastName email')
      .sort({ date: 1 })
      .exec();

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Appointments fetched successfully',
        appointments,
      })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error: ' + error.message)
    );
  }
}
