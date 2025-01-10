'use client';

import dynamic from 'next/dynamic';
const ForgetPasswordForm = dynamic(
  () => import('@/app/forms/ForgetPasswordForm')
);

const ForgetPassword = () => {
  return (
    <div>
      <ForgetPasswordForm />
    </div>
  );
};

export default ForgetPassword;
