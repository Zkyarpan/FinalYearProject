'use client';

import dynamic from 'next/dynamic';
const SignupForm = dynamic(() => import('@/components/SignUpPage'));

const Signup = () => {
  return (
    <div>
      <SignupForm />
    </div>
  );
};

export default Signup;
