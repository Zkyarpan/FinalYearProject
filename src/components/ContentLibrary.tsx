// "use client";

// import React from "react";
// import Image from "next/image";
// import Link from "next/link";

// const ContentLibrary = () => {
//   const tabs = [
//     { id: 0, label: "Featured", icon: "/icons/star_icon.svg" },
//     { id: 1, label: "Popular", icon: "/icons/heart_icon.svg" },
//     { id: 2, label: "Sleep", icon: "/icons/sleep_icon.svg" },
//     { id: 3, label: "Stress", icon: "/icons/stress_icon.svg" },
//     {
//       id: 4,
//       label: "Meditation and Mindfulness",
//       icon: "/icons/meditation_icon.svg",
//     },
//   ];

//   const cards = [
//     {
//       id: 1,
//       title: "Meet Ebb",
//       description: "Get personalized content recommendations with Ebb",
//       tag: "New",
//       image: "/images/ebb.webp",
//       link: "https://www.headspace.com/ai-mental-health-companion?origin=homepage",
//     },
//     {
//       id: 2,
//       title: "LinkedIn Life Skills",
//       description: "Bring your best, most confident self to work",
//       image: "/images/linkedin.webp",
//       link: "https://www.headspace.com/content/topics/188?origin=homepage",
//     },
//     {
//       id: 3,
//       title: "Headspace XR",
//       description: "A playground for your mind",
//       tag: "Trending",
//       image: "/images/xr.webp",
//       link: "https://www.headspace.com/xr?origin=homepage",
//     },
//     {
//       id: 4,
//       title: "Politics Without Panic",
//       description: "Stress-relieving tools for election season",
//       tag: "New",
//       image: "/images/politics.webp",
//       link: "https://www.headspace.com/election?origin=homepage",
//     },
//     {
//       id: 5,
//       title: "Mindful Families Collection",
//       description:
//         "Bring your attention to all interactions with your children",
//       image: "/images/families.webp",
//       link: "https://www.headspace.com/mindful-families?origin=homepage",
//     },
//   ];

//   return (
//     <div className="content-library-container py-8">
//       <h2 className="text-2xl font-bold text-center mb-6">
//         Explore our library
//       </h2>

//       {/* Tabs */}
//       <div className="tabs flex justify-center space-x-4 mb-8">
//         {tabs.map((tab) => (
//           <button
//             key={tab.id}
//             type="button"
//             className="tab flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all"
//           >
//             <Image
//               src={tab.icon}
//               alt={tab.label}
//               width={20}
//               height={20}
//               className="icon"
//             />
//             <span>{tab.label}</span>
//           </button>
//         ))}
//       </div>

//       {/* Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {cards.map((card) => (
//           <Link
//             key={card.id}
//             href={card.link}
//             target="_blank"
//             className="card block overflow-hidden rounded-lg shadow hover:shadow-lg transition-all"
//           >
//             <div className="relative w-full h-48">
//               <Image
//                 src={card.image}
//                 alt={card.title}
//                 layout="fill"
//                 objectFit="cover"
//                 className="rounded-t-lg"
//               />
//               {card.tag && (
//                 <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
//                   {card.tag}
//                 </span>
//               )}
//             </div>
//             <div className="p-4">
//               <h5 className="text-lg font-semibold mb-2">{card.title}</h5>
//               <p className="text-sm text-gray-600">{card.description}</p>
//             </div>
//           </Link>
//         ))}
//       </div>

//       <div className="text-center mt-8">
//         <Link
//           href="https://www.headspace.com/content?origin=homepage"
//           target="_blank"
//           className="inline-block px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-all"
//         >
//           View All
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default ContentLibrary;
