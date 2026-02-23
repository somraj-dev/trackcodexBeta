import React from "react";
import { Outlet } from "react-router-dom";

const BlogLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <header className="px-6 py-4 border-b border-[#30363d]">
        <h1 className="text-xl font-bold">Blog</h1>
      </header>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default BlogLayout;
