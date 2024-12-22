import { useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { Button } from "@/components/ui/button";

const BlogEditor = ({ initialValue, onSave }: any) => {
  const editorRef = useRef<Editor>(null);

  const handlePublish = () => {
    const markdown = editorRef.current?.getInstance().getMarkdown();
    if (onSave) {
      onSave(markdown);
    }
  };

  return (
    <div className="bg-white">
      <Editor
        initialValue={initialValue || "Write your post here..."}
        previewStyle="vertical"
        height="600px"
        initialEditType="markdown"
        useCommandShortcut={true}
        ref={editorRef}
      />
      <Button className="mt-6" onClick={handlePublish}>
        Publish
      </Button>
    </div>
  );
};

export default BlogEditor;
