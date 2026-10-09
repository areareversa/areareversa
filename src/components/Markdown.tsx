import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HeadingWithCopy } from "@/components/HeadingWithCopy";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="article-body max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_p]:my-4 [&_p]:leading-7 [&_a]:text-[#9333ea] [&_a]:underline [&_img]:my-6 [&_img]:rounded-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#f9f7fa] [&_pre]:p-4 dark:[&_pre]:bg-neutral-900 [&_code]:rounded [&_code]:bg-[#f9f7fa] [&_code]:px-1 dark:[&_code]:bg-neutral-900 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-4 [&_blockquote]:text-neutral-500" style={{ fontSize: "var(--article-font-size, 1rem)" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children, ...props }) => <HeadingWithCopy level={2} {...props}>{children}</HeadingWithCopy>,
          h3: ({ children, ...props }) => <HeadingWithCopy level={3} {...props}>{children}</HeadingWithCopy>,
        }}
      >{children}</ReactMarkdown>
    </div>
  );
}