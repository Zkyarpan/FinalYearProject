// 'use client';

// import { useState, useEffect } from 'react';

// const SpinnerLoader = ({ isLoading }: { isLoading: boolean }) => {
//   const [progress, setProgress] = useState(0);
//   const [showLoader, setShowLoader] = useState(false);

//   useEffect(() => {
//     if (isLoading) {
//       setShowLoader(true);
//       setProgress(0);
//       const interval = setInterval(() => {
//         setProgress(prev => (prev < 95 ? prev + 10 : prev));
//       }, 200);
//       return () => clearInterval(interval);
//     } else {
//       setProgress(100);
//       setTimeout(() => {
//         setProgress(0);
//         setShowLoader(false);
//       }, 500);
//     }
//   }, [isLoading]);

//   return (
//     <>
//       {showLoader && (
//         <div
//           className="fixed top-0 left-0 z-[9999] w-full h-1 bg-[#0466c8] transition-all duration-500 ease-in-out shadow-sm"
//           style={{ width: `${progress}%` }}
//         />
//       )}
//     </>
//   );
// };

// export default SpinnerLoader;
