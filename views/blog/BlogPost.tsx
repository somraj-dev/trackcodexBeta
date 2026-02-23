import React from "react";
import { useParams } from "react-router-dom";

const BlogPost: React.FC = () => {
  const { slug } = useParams();

  return (
    <div className="prose prose-invert max-w-none">
      <h1>Blog Post: {slug}</h1>
      <p>Content for this post will appear here.</p>
    </div>
  );
};

export default BlogPost;
