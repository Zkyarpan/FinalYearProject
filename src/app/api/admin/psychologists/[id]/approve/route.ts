import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import User from '@/models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const { id } = req.query;

    // Find psychologist
    const psychologist = await Psychologist.findById(id);
    if (!psychologist) {
      return res.status(404).json({ message: 'Psychologist not found' });
    }

    // Update psychologist status
    psychologist.approvalStatus = 'approved';
    psychologist.approvedAt = new Date();
    await psychologist.save();

    // Update user role
    await User.findByIdAndUpdate(psychologist.userId, {
      role: 'psychologist',
    });

    // Fetch updated dashboard data
    const updatedPsychologists = await Psychologist.find({
      approvalStatus: 'pending',
    });

    return res.status(200).json({
      success: true,
      message: 'Psychologist approved successfully',
      pendingPsychologists: updatedPsychologists,
    });
  } catch (error) {
    console.error('Approval error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
