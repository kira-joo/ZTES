import { Skeleton } from "@kira-joo/frontend-toolkit-tailwind";

export default function StorefrontLoading() {
  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-3 px-3 py-6 sm:grid-cols-3 md:px-4 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="aspect-[3/4] rounded-card" />
      ))}
    </div>
  );
}
