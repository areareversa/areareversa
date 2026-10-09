"use client";

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-6 dark:border-[#2a2a30] dark:bg-[#17171c] animate-pulse">
      <div className="aspect-video w-full rounded-xl bg-[#e5e7eb] dark:bg-[#2a2a30]" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-5/6 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-4 w-1/2 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
      </div>
    </div>
  );
}

export function PostPageSkeleton() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 animate-pulse">
      <div className="h-4 w-1/3 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
      <div className="h-10 w-3/4 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
      <div className="aspect-video w-full rounded-2xl bg-[#e5e7eb] dark:bg-[#2a2a30]" />
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-20 bg-[#e5e7eb] rounded-full dark:bg-[#2a2a30]" />
        <div className="h-6 w-24 bg-[#e5e7eb] rounded-full dark:bg-[#2a2a30]" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <div className="h-8 w-40 bg-[#e5e7eb] rounded-full dark:bg-[#2a2a30]" />
        <div className="h-10 w-48 bg-[#e5e7eb] rounded-full dark:bg-[#2a2a30]" />
      </div>
      <div className="space-y-4">
        <div className="h-6 w-full bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-full bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-5/6 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-full bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-4/5 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-full bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-3/4 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-full bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="h-6 w-2/3 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
      </div>
      <div className="h-10 w-32 bg-[#e5e7eb] rounded-full dark:bg-[#2a2a30]" />
      <div className="h-10 w-36 bg-[#e5e7eb] rounded-full dark:bg-[#2a2a30]" />
      <div className="rounded-2xl border border-[#e5e7eb] p-6 dark:border-[#2a2a30]">
        <div className="h-6 w-1/2 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
          <div className="h-4 w-5/6 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
          <div className="h-4 w-full bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        </div>
      </div>
    </article>
  );
}

export function PodcastEpisodeSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30] animate-pulse">
      <div className="h-6 w-3/4 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
      <div className="h-4 w-1/2 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
      <div className="h-4 w-3/4 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
      <div className="h-10 w-full bg-[#e5e7eb] rounded-xl dark:bg-[#2a2a30]" />
    </div>
  );
}

export function BlogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}