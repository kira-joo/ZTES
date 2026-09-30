"use client";

import { postCrudEndpoints, type PostEntity, type PostFormValues } from "api/admin-posts.endpoints";
import { CustomForm, FieldType, renderFormField, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { PageSection, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { FormLocalizedRichText } from "src/components/admin/form-localized-rich-text";
import { SlugFields } from "src/components/admin/slug-fields";
import { contentImagePolicy } from "src/server/core/assets/upload-policies";

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toFormValues(post?: PostEntity): PostFormValues {
  if (!post) {
    return {
      title: EMPTY_LOCALIZED,
      slug: EMPTY_LOCALIZED,
      excerpt: EMPTY_LOCALIZED,
      body: EMPTY_LOCALIZED,
      cover: null,
      isPublished: true,
      publishedAt: new Date().toISOString().slice(0, 10),
      seo: { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
    };
  }
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    cover: post.cover ?? null,
    isPublished: post.isPublished,
    publishedAt: post.publishedAt.slice(0, 10),
    seo: post.seo ?? { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
  };
}

function toBody(values: PostFormValues, form: UseFormReturn<PostFormValues>): PostFormValues {
  return { ...values, slug: form.getValues("slug"), body: form.getValues("body") };
}

export interface PostFormProps {
  post?: PostEntity;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<PostFormValues>({ defaultValues: toFormValues(post) });

  const sections: FormSection<PostFormValues>[] = [
    {
      title: "Title",
      fields: [
        { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title", rules: { required: "Required" }, colSpan: "full" },
        { type: FieldType.LOCALIZED_TEXTAREA, name: "excerpt", label: "Excerpt", colSpan: "full", rows: 2 },
        { type: FieldType.IMAGE_ASSET, name: "cover", label: "Cover image", policy: contentImagePolicy, colSpan: "full" },
      ],
    },
    {
      title: "Publishing",
      fields: [
        { type: FieldType.DATE, name: "publishedAt", label: "Published on" },
        { type: FieldType.SWITCH, name: "isPublished", label: "Published" },
      ],
    },
  ];

  const children = (
    <>
      <PageSection title="Slug">
        <SlugFields control={form.control} setValue={form.setValue} getValues={form.getValues} nameField="title" slugField="slug" />
      </PageSection>
      <PageSection title="Body">
        <FormLocalizedRichText control={form.control} name="body" />
      </PageSection>
      <PageSection title="SEO">
        <div className="grid grid-cols-1 gap-4">
          {renderFormField({ type: FieldType.LOCALIZED_INPUT, name: "seo.title", label: "Meta title" }, form)}
          {renderFormField({ type: FieldType.LOCALIZED_TEXTAREA, name: "seo.description", label: "Meta description", rows: 3 }, form)}
        </div>
      </PageSection>
    </>
  );

  const handleSuccess = (saved: PostEntity) => {
    toast.success(post ? "Post updated" : "Post created");
    void queryClient.invalidateQueries();
    router.push(`/admin/posts/${saved._id}`);
  };

  if (post) {
    return (
      <CustomForm<PostFormValues, typeof postCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={postCrudEndpoints.update}
        submitParams={{ id: post._id }}
        transformValues={(values) => toBody(values, form)}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {children}
      </CustomForm>
    );
  }

  return (
    <CustomForm<PostFormValues, typeof postCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={postCrudEndpoints.create}
      transformValues={(values) => toBody(values, form)}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    >
      {children}
    </CustomForm>
  );
}
