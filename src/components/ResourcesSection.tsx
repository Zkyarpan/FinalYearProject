'use client';

const categories = [
  { name: 'All', count: 85 },
  { name: 'Mental Health Basics', count: 51 },
  { name: 'Therapy Techniques', count: 3 },
  { name: 'User Stories', count: 2 },
  { name: 'Research Insights', count: 17 },
  { name: 'FAQs', count: 1 },
  { name: 'Personal Stories', count: 1 },
  { name: 'Careers in Mental Health', count: 10 },
];

const ResourcesSection = () => {
  return (
    <div className="max-w-xs px-6 py-6">
      <div className="mb-14">
        <ul>
          {categories.map(category => (
            <li key={category.name}>
              <a
                className={`flex items-center justify-between mb-2`}
                href={`/blog/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  fontWeight: category.name === 'All' ? 'bold' : 'normal',
                }}
              >
                <p className="capitalize text-sm">{category.name}</p>
                <span
                  className={`text-xs font-semibold leading-4 px-2 py-0.5 rounded-md inline-flex items-center justify-center text-center ${category.name === 'All' ? 'bg-input text-white' : 'bg-gray-200 dark:bg-input'}`}
                >
                  {category.count}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResourcesSection;
