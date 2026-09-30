import { PostListView } from "src/features/admin/posts/post-list-view";

export const metadata = { title: "Blog posts" };

export default function AdminPostsPage() {
  return <PostListView />;
}
