'use client';

import dynamic from 'next/dynamic';
const VerifyEmail = dynamic(() => import('@/app/forms/verifyEmailForm'));

const Signup = () => {
  return (
    <div>
      <VerifyEmail />
    </div>
  );
};

export default Signup;
