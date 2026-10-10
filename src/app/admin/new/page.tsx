import { createPost } from "../actions";
import { PostForm } from "@/components/PostForm";
import { ContentLoader } from "@/components/ContentLoader";

export const metadata = { title: "Nova postagem" };

export default function NewPost() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">nova postagem</h1>
      <ContentLoader />
      <PostForm action={createPost} />
    </div>
  );
}
