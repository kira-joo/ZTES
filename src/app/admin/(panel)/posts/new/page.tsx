"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { PostForm } from "src/features/admin/posts/post-form";

export default function NewPostPage() {
  return (
    <PageShell title="Add post" backRoute={{ path: "/admin/posts", label: "Back to posts" }}>
      <PostForm />
    </PageShell>
  );
}
