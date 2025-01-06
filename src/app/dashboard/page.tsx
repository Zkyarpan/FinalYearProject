import { Home, Rocket, FileText, Briefcase, Search, Edit3 } from 'lucide-react';

function HomePage() {
  return (
    <div className="flex min-h-screen bg-white p-10">
      {/* Left Sidebar */}
      <div className="w-[212px] border-r border-gray-200 flex-col flex-shrink-0 fixed h-screen pb-2 lg:flex justify-between">
        <div>
          <div className="relative my-3 px-6">
            {/* <h1 className="text-xl font-bold">Peerlist</h1> */}
          </div>
          <div className="pr-6 flex flex-col justify-between h-full overflow-y-auto">
            <div className="mt-6">
              <NavItem icon={<Home />} text="Scroll" active />
              <NavItem icon={<Rocket />} text="Spotlight" />
              <NavItem icon={<FileText />} text="Articles" />
              <NavItem icon={<Briefcase />} text="Jobs" />
              <NavItem icon={<Search />} text="Search" />
              <NavItem icon={<Edit3 />} text="Blog" />
            </div>
          </div>
        </div>
        <div className="px-6">
          <div className="text-gray-500 text-xs mb-1">
            <a href="#" className="hover:underline">
              Blog
            </a>{' '}
            •{' '}
            <a href="#" className="hover:underline">
              Support
            </a>{' '}
            •{' '}
            <a href="#" className="hover:underline">
              Help
            </a>{' '}
            •{' '}
            <a href="#" className="hover:underline">
              Legal
            </a>
          </div>
          <p className="text-gray-500 text-[10px]">© 2025 Peerlist, Inc.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-[212px] lg:pr-[348px]">
        <div className="flex h-14">
          <div className="h-14 z-40 lg:z-50 lg:border-r border-b border-gray-200 box-border lg:max-w-[640px] lg:w-full fixed top-0 bg-white py-4 px-6 flex items-center justify-center">
            <div className="flex items-center justify-center w-full relative">
              <div className="absolute left-0">
                <h1 className="text-base font-semibold">Scroll</h1>
              </div>
              <div className="border border-gray-200 flex rounded-xl">
                <a
                  className="px-4 py-2 uppercase border-r border-gray-200 flex items-center"
                  href="#"
                >
                  <p className="text-green-500 font-semibold text-xs">Newest</p>
                </a>
                <a className="px-4 uppercase flex gap-2 items-center" href="#">
                  <p className="text-gray-700 font-semibold text-xs">
                    Trending
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Post Creation Box */}
        <div className="pt-14">
          <div className="group flex flex-col gap-2 bg-gray-50 hover:bg-white border-b border-gray-200 px-6 py-4 hover:cursor-pointer">
            <div className="flex gap-2 items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="text-gray-500 font-normal text-sm">
                What are you building?
              </div>
            </div>
            <div className="flex justify-between items-center pl-10">
              <div className="flex gap-2">
                <ActionButton icon={<FileText className="w-4 h-4" />} />
                <ActionButton icon={<Edit3 className="w-4 h-4" />} />
                <ActionButton icon={<Briefcase className="w-4 h-4" />} />
              </div>
              <div className="flex items-center gap-x-4">
                <button className="text-gray-700 border border-gray-200 rounded-xl px-4 py-1.5 text-sm font-semibold hover:shadow-sm">
                  Write Article
                </button>
                <button className="bg-green-500 text-white rounded-xl px-4 py-1.5 text-sm font-semibold hover:bg-green-600">
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-[348px] fixed right-0 top-0 border-l border-gray-200 h-screen p-6 lg:block">
        <div className="flex flex-col gap-10">
          <div
            className="flex flex-col items-center p-4 rounded-2xl border border-gray-200"
            style={{
              background:
                'linear-gradient(215deg, rgba(0, 170, 69, 0.2) 0%, rgba(255, 255, 255, 0) 49.92%)',
            }}
          >
            <p className="text-2xl text-center mb-1">
              Not your typical content feed!
            </p>
            <p className="text-sm text-center">
              Are you building side projects, writing articles, designing UIs,
              reading books, hiring, or looking for a new job?
            </p>
            <p className="text-sm text-center mt-2">
              Share it here to get valuable feedback, intros, and opportunities.
            </p>
            <div className="flex flex-col items-center gap-2 mt-4">
              <button className="bg-green-500 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-green-600">
                Create Profile
              </button>
              <p className="text-xs text-center italic">
                Claim your username before it's too late!
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function NavItem({ icon, text, active = false }) {
  return (
    <a
      className={`flex items-center group pt-2 lg:py-2.5 ${
        active ? 'border-t-2 border-green-500 md:border-0' : ''
      }`}
      href="#"
    >
      <span
        className={`text-gray-700 shrink-0 ${active ? 'text-green-500' : 'text-gray-700'}`}
      >
        {icon}
      </span>
      <span className="flex flex-col lg:ml-2 mt-2 lg:mt-0 transition-all lg:group-hover:translate-x-1">
        <span
          className={`lg:text-base text-xxs font-semibold ${
            active ? 'text-green-500' : 'text-gray-700'
          }`}
        >
          {text}
        </span>
      </span>
    </a>
  );
}

function ActionButton({ icon }) {
  return (
    <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-700">
      {icon}
    </button>
  );
}

export default HomePage;
