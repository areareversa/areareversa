export function publishedFilter(now: Date = new Date()) {
  return {
    published: true,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

export function isVisible(post: { published: boolean; publishAt: Date | null }, now: Date = new Date()) {
  return post.published && (!post.publishAt || post.publishAt <= now);
}
