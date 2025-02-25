import Loader from '@/components/common/Loader';

export default function Loading() {
  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div className="border px-6 py-10 rounded-2xl flex flex-col gap-6 sm:shadow-md min-h-[300px] items-center justify-center">
        <Loader />
      </div>
    </div>
  );
}
