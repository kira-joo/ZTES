"use client";

import { postCrudEndpoints } from "api/admin-posts.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { PostForm } from "src/features/admin/posts/post-form";
import { pickLocalized } from "src/lib/localized";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: postCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? pickLocalized(query.data.title, "en") : "Edit post"}
      backRoute={{ path: "/admin/posts", label: "Back to posts" }}
    >
      <QueryState query={query} entityName="Post" backRoute={{ path: "/admin/posts", label: "Back to posts" }}>
        {(post) => <PostForm post={post} />}
      </QueryState>
    </PageShell>
  );
}
