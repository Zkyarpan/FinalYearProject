'use client';
import dynamic from 'next/dynamic';

const LoginPage = dynamic(() => import('@/components/LoginPage'));

const Login = () => {
  return (
    <div>
      <LoginPage />
    </div>
  );
};

export default Login;
