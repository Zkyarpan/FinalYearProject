import { Types, Document } from 'mongoose';
import Availability, { IAvailability } from '@/models/Availability';

interface AvailabilitySlot {
  _id: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  userId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
}

interface AvailabilityDocument extends Document {
  _id: Types.ObjectId;
  psychologistId: Types.ObjectId;
  slots: AvailabilitySlot[];
}

export async function findAvailableSlot(
  psychologistId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  slot: AvailabilityDocument | null;
  matchingSlot: AvailabilitySlot | undefined;
}> {
  try {
    // Find the availability document
    const slot = (await Availability.findOne({
      psychologistId: new Types.ObjectId(psychologistId),
      'slots.startTime': { $lte: startDate },
      'slots.endTime': { $gte: endDate },
      'slots.isBooked': false,
    })) as AvailabilityDocument | null;

    if (!slot) {
      return { slot: null, matchingSlot: undefined };
    }

    // Find matching slot
    const matchingSlot = slot.slots.find(
      (s): s is AvailabilitySlot =>
        s.startTime.getTime() === startDate.getTime() &&
        s.endTime.getTime() === endDate.getTime() &&
        !s.isBooked
    );

    return { slot, matchingSlot };
  } catch (error) {
    console.error('Error finding available slot:', error);
    throw error;
  }
}

export async function updateAvailabilitySlot(
  slotId: Types.ObjectId | string,
  matchingSlotId: Types.ObjectId | string,
  userId: string,
  appointmentId: Types.ObjectId | string
): Promise<AvailabilityDocument | null> {
  try {
    // Convert all IDs to ObjectId
    const availabilityId = new Types.ObjectId(slotId);
    const slotObjectId = new Types.ObjectId(matchingSlotId);
    const userObjectId = new Types.ObjectId(userId);
    const appointmentObjectId = new Types.ObjectId(appointmentId);

    // Update the availability slot
    const updatedAvailability = (await Availability.findOneAndUpdate(
      {
        _id: availabilityId,
        'slots._id': slotObjectId,
        'slots.isBooked': false,
      },
      {
        $set: {
          'slots.$.isBooked': true,
          'slots.$.userId': userObjectId,
          'slots.$.appointmentId': appointmentObjectId,
        },
      },
      {
        new: true,
        runValidators: false,
      }
    )) as AvailabilityDocument | null;

    return updatedAvailability;
  } catch (error) {
    console.error('Error updating availability slot:', error);
    throw error;
  }
}
