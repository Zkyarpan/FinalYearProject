import { describe, it, expect, beforeEach } from '@jest/globals';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Psychologist {
  email: string;
  fullName: string;
  approvalStatus: ApprovalStatus;
  adminFeedback?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
}

let mockPsychologist: Psychologist;

beforeEach(() => {
  mockPsychologist = {
    email: 'psych1@mentality.com',
    fullName: 'Dr. Arpan Karki',
    approvalStatus: 'pending',
  };
});

function approvePsychologist(p: Psychologist): Psychologist {
  p.approvalStatus = 'approved';
  p.approvedAt = new Date();
  return p;
}

function rejectPsychologist(p: Psychologist, reason: string): Psychologist {
  p.approvalStatus = 'rejected';
  p.rejectedAt = new Date();
  p.adminFeedback = reason;
  return p;
}

describe('🛡️ Admin Approval of Psychologist Requests', () => {
  it('✅ should approve a pending psychologist profile', () => {
    const updated = approvePsychologist(mockPsychologist);
    expect(updated.approvalStatus).toBe('approved');
    expect(updated.approvedAt).toBeDefined();
  });

  it('❌ should reject a psychologist with admin feedback', () => {
    const updated = rejectPsychologist(mockPsychologist, 'Incomplete license details');
    expect(updated.approvalStatus).toBe('rejected');
    expect(updated.rejectedAt).toBeDefined();
    expect(updated.adminFeedback).toBe('Incomplete license details');
  });
});
