'use client';

import Image from 'next/image';
import Link from 'next/link';

const BlogSection = () => {
  const posts = [
    {
      id: 1,
      title: 'Boost your conversion rate',
      href: '#',
      description:
        'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
      date: 'Mar 16, 2020',
      category: 'Marketing',
      author: {
        name: 'Michael Foster',
        role: 'Co-Founder / CTO',
        imageUrl:
          'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      imageUrl:
        'https://images.unsplash.com/photo-1496128858413-b36217c2ce36?ixlib=rb-4.0.3&auto=format&fit=crop&w=3603&q=80',
    },
    {
      id: 2,
      title: 'How to use search engine optimization to drive sales',
      href: '#',
      description:
        'Optio sit exercitation et ex ullamco aliquid explicabo. Dolore do ut officia anim non ad eu.',
      date: 'Mar 10, 2020',
      category: 'Sales',
      author: {
        name: 'Lindsay Walton',
        role: 'Front-end Developer',
        imageUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      imageUrl:
        'https://images.unsplash.com/photo-1547586696-ea22b4d4235d?ixlib=rb-4.0.3&auto=format&fit=crop&w=3270&q=80',
    },
    {
      id: 3,
      title: 'Improve your customer experience',
      href: '#',
      description:
        'Dolore commodo in nulla do nulla esse consectetur. Adipisicing voluptate velit sint adipisicing ex duis elit deserunt sint ipsum.',
      date: 'Feb 12, 2020',
      category: 'Business',
      author: {
        name: 'Tom Cook',
        role: 'Director of Product',
        imageUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      imageUrl:
        'https://images.unsplash.com/photo-1492724441997-5dc865305da7?ixlib=rb-4.0.3&auto=format&fit=crop&w=3270&q=80',
    },
  ];

  return (
    <div className="bg-[hsl(var(--background))] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
            From the blog
          </h2>
          <p className="mt-2 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            Learn how to grow your business with our expert advice.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map(post => (
            <article key={post.id} className="flex flex-col items-start">
              <div className="relative w-full">
                <Image
                  src={post.imageUrl}
                  alt=""
                  width={2400}
                  height={1600}
                  className="aspect-[16/9] w-full rounded-2xl bg-[hsl(var(--muted))] object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[hsl(var(--border))]" />
              </div>
              <div className="max-w-xl">
                <div className="mt-8 flex items-center gap-x-4 text-xs">
                  <time
                    dateTime={post.date}
                    className="text-[hsl(var(--muted-foreground))]"
                  >
                    {post.date}
                  </time>
                  <Link
                    href={post.href}
                    className="relative z-10 rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                  >
                    {post.category}
                  </Link>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
                    <Link href={post.href}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                    {post.description}
                  </p>
                </div>
                <div className="relative mt-8 flex items-center gap-x-4">
                  <Image
                    src={post.author.imageUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full bg-[hsl(var(--muted))]"
                  />
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-[hsl(var(--foreground))]">
                      <Link href={post.href}>
                        <span className="absolute inset-0" />
                        {post.author.name}
                      </Link>
                    </p>
                    <p className="text-[hsl(var(--muted-foreground))]">
                      {post.author.role}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogSection;

// import { Home, Rocket, FileText, Briefcase, Search, Edit3 } from 'lucide-react';

// function HomePage() {
//   return (
//     <div className="flex min-h-screen bg-white">
//       {/* Left Sidebar */}
//       <div className="w-[212px] border-r border-gray-200 flex-col flex-shrink-0 fixed h-screen pb-2 lg:flex justify-between">
//         <div>
//           <div className="relative my-3 px-6">
//             {/* <h1 className="text-xl font-bold">Peerlist</h1> */}
//           </div>
//           <div className="pr-6 flex flex-col justify-between h-full overflow-y-auto">
//             <div className="mt-6">
//               <NavItem icon={<Home />} text="Scroll" active />
//               <NavItem icon={<Rocket />} text="Spotlight" />
//               <NavItem icon={<FileText />} text="Articles" />
//               <NavItem icon={<Briefcase />} text="Jobs" />
//               <NavItem icon={<Search />} text="Search" />
//               <NavItem icon={<Edit3 />} text="Blog" />
//             </div>
//           </div>
//         </div>
//         <div className="px-6">
//           <div className="text-gray-500 text-xs mb-1">
//             <a href="#" className="hover:underline">Blog</a> •{" "}
//             <a href="#" className="hover:underline">Support</a> •{" "}
//             <a href="#" className="hover:underline">Help</a> •{" "}
//             <a href="#" className="hover:underline">Legal</a>
//           </div>
//           <p className="text-gray-500 text-[10px]">© 2025 Peerlist, Inc.</p>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 lg:pl-[212px] lg:pr-[348px]">
//         <div className="flex h-14">
//           <div className="h-14 z-40 lg:z-50 lg:border-r border-b border-gray-200 box-border lg:max-w-[640px] lg:w-full fixed top-0 bg-white py-4 px-6 flex items-center justify-center">
//             <div className="flex items-center justify-center w-full relative">
//               <div className="absolute left-0">
//                 <h1 className="text-base font-semibold">Scroll</h1>
//               </div>
//               <div className="border border-gray-200 flex rounded-xl">
//                 <a className="px-4 py-2 uppercase border-r border-gray-200 flex items-center" href="#">
//                   <p className="text-green-500 font-semibold text-xs">Newest</p>
//                 </a>
//                 <a className="px-4 uppercase flex gap-2 items-center" href="#">
//                   <p className="text-gray-700 font-semibold text-xs">Trending</p>
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Post Creation Box */}
//         <div className="pt-14">
//           <div className="group flex flex-col gap-2 bg-gray-50 hover:bg-white border-b border-gray-200 px-6 py-4 hover:cursor-pointer">
//             <div className="flex gap-2 items-center">
//               <div className="w-10 h-10 rounded-full bg-gray-200"></div>
//               <div className="text-gray-500 font-normal text-sm">
//                 What are you building?
//               </div>
//             </div>
//             <div className="flex justify-between items-center pl-10">
//               <div className="flex gap-2">
//                 <ActionButton icon={<FileText className="w-4 h-4" />} />
//                 <ActionButton icon={<Edit3 className="w-4 h-4" />} />
//                 <ActionButton icon={<Briefcase className="w-4 h-4" />} />
//               </div>
//               <div className="flex items-center gap-x-4">
//                 <button className="text-gray-700 border border-gray-200 rounded-xl px-4 py-1.5 text-sm font-semibold hover:shadow-sm">
//                   Write Article
//                 </button>
//                 <button className="bg-green-500 text-white rounded-xl px-4 py-1.5 text-sm font-semibold hover:bg-green-600">
//                   Post
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Sidebar */}
//       <aside className="w-[348px] fixed right-0 top-0 border-l border-gray-200 h-screen p-6 lg:block">
//         <div className="flex flex-col gap-10">
//           <div className="flex flex-col items-center p-4 rounded-2xl border border-gray-200"
//                style={{ background: "linear-gradient(215deg, rgba(0, 170, 69, 0.2) 0%, rgba(255, 255, 255, 0) 49.92%)" }}>
//             <p className="text-2xl text-center mb-1">Not your typical content feed!</p>
//             <p className="text-sm text-center">
//               Are you building side projects, writing articles, designing UIs, reading books,
//               hiring, or looking for a new job?
//             </p>
//             <p className="text-sm text-center mt-2">
//               Share it here to get valuable feedback, intros, and opportunities.
//             </p>
//             <div className="flex flex-col items-center gap-2 mt-4">
//               <button className="bg-green-500 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-green-600">
//                 Create Profile
//               </button>
//               <p className="text-xs text-center italic">
//                 Claim your username before it's too late!
//               </p>
//             </div>
//           </div>
//         </div>
//       </aside>
//     </div>
//   );
// }

// function NavItem({ icon, text, active = false }) {
//   return (
//     <a
//       className={`flex items-center group pt-2 lg:py-2.5 ${
//         active ? "border-t-2 border-green-500 md:border-0" : ""
//       }`}
//       href="#"
//     >
//       <span className={`text-gray-700 shrink-0 ${active ? "text-green-500" : "text-gray-700"}`}>
//         {icon}
//       </span>
//       <span className="flex flex-col lg:ml-2 mt-2 lg:mt-0 transition-all lg:group-hover:translate-x-1">
//         <span className={`lg:text-base text-xxs font-semibold ${
//           active ? "text-green-500" : "text-gray-700"
//         }`}>
//           {text}
//         </span>
//       </span>
//     </a>
//   );
// }

// function ActionButton({ icon }) {
//   return (
//     <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-700">
//       {icon}
//     </button>
//   );
// }

// export default HomePage;
