'use client';

import dynamic from 'next/dynamic';
const ConfirmationForm = dynamic(() => import('@/app/forms/ConfirmationForm'));

const Confirmation = () => {
  return (
    <div>
      <ConfirmationForm />
    </div>
  );
};

export default Confirmation;
