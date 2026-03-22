import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  isOpen?: boolean;
}

const INITIAL_FILES: FileNode[] = [
  { id: '1', name: 'src', type: 'folder', parentId: null, isOpen: true },
  { id: '2', name: 'components', type: 'folder', parentId: '1', isOpen: true },
  { id: '3', name: 'ui', type: 'folder', parentId: '2', isOpen: true },
  { id: '4', name: 'component.tsx', type: 'file', parentId: '3', content: `import { cn } from "@/lib/utils";
import { useState } from "react";

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div className={cn("flex flex-col items-center gap-4 p-4 rounded-lg")}>
      <h1 className="text-2xl font-bold mb-2">Component Example</h1>
      <h2 className="text-xl font-semibold">{count}</h2>
      <div className="flex gap-2">
        <button onClick={() => setCount((prev) => prev - 1)}>-</button>
        <button onClick={() => setCount((prev) => prev + 1)}>+</button>
      </div>
    </div>
  );
};` },
  { id: '5', name: 'demos', type: 'folder', parentId: null, isOpen: true },
  { id: '6', name: 'default.tsx', type: 'file', parentId: '5', content: `import { Component } from "../src/components/ui/component";

export default function Demo() {
  return (
    <div className="p-10">
      <Component />
    </div>
  );
}` },
  { id: '7', name: 'index.css', type: 'file', parentId: null, content: `@tailwind base;
@tailwind components;
@tailwind utilities;

.custom-class {
  @apply bg-primary text-white p-4 rounded-xl;
}` },
];

const CreateLibraryResource = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme.type === "dark";

  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [activeFileId, setActiveFileId] = useState('4');
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "UI Component",
    demoName: "default.tsx",
    demoSlug: "default",
    tags: [] as string[],
  });

  const [previews, setPreviews] = useState({
    cover: null as string | null,
    video: null as string | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (type: "cover" | "video", file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews((prev) => ({ ...prev, [type]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const isStep1Valid = useMemo(() => {
    return formData.name && formData.slug && formData.description && previews.cover;
  }, [formData, previews]);

  const handleNext = () => {
    if (isStep1Valid) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleReset = () => {
    setFormData({
        name: "",
        slug: "",
        description: "",
        type: "UI Component",
        demoName: "default.tsx",
        demoSlug: "default",
        tags: [],
    });
    setPreviews({ cover: null, video: null });
    setFiles(INITIAL_FILES);
    setCurrentStep(1);
    setShowSuccessModal(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuccessModal(true);
  };

  const handleFileContentChange = (content: string) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f));
  };

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const renderFileTree = (parentId: string | null = null, depth = 0) => {
    return files
      .filter(f => f.parentId === parentId)
      .map(file => (
        <React.Fragment key={file.id}>
          <div 
            onClick={() => {
              if (file.type === 'folder') {
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isOpen: !f.isOpen } : f));
              } else {
                setActiveFileId(file.id);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1 cursor-pointer transition-all text-[13px] ${activeFileId === file.id ? 'active-file-node' : 'text-gh-text-secondary hover:text-gh-text'}`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {file.type === 'folder' ? (
                <>
                  <span className="material-symbols-outlined !text-[14px] opacity-70">
                    {file.isOpen ? 'expand_more' : 'chevron_right'}
                  </span>
                  <span className="material-symbols-outlined !text-[18px] folder-icon">
                    {file.isOpen ? 'folder_open' : 'folder'}
                  </span>
                </>
              ) : (
                <>
                   <div className="w-5" />
                   <span className="material-symbols-outlined !text-[18px] text-gh-text-secondary">description</span>
                </>
              )}
              <span className="truncate">{file.name}</span>
            </div>
          </div>
          {file.type === 'folder' && file.isOpen && renderFileTree(file.id, depth + 1)}
        </React.Fragment>
      ));
  };

  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gh-bg text-gh-text flex flex-col animate-in fade-in duration-500 relative">
        <header className="h-14 border-b border-gh-border flex items-center justify-between px-6 bg-gh-bg-secondary shrink-0">
          <div className="flex items-center gap-4">
             <button 
              onClick={handleBack}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all text-gh-text-secondary hover:text-gh-text"
            >
              <span className="material-symbols-outlined !text-[20px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gh-text-secondary uppercase tracking-widest">{formData.name}</span>
              <span className="text-gh-text-secondary">/</span>
              <span className="text-[11px] font-bold text-gh-text uppercase tracking-widest">Editor</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/library")}
              className="text-[11px] font-bold text-gh-text-secondary hover:text-gh-text uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSubmit()}
              className="px-5 py-2 bg-primary text-white rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:brightness-110"
            >
              Complete Import
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer */}
          <aside className={`w-64 flex flex-col overflow-y-auto pt-6 thin-scrollbar border-r border-gh-border ${isDark ? 'bg-black' : 'bg-gh-bg-tertiary'}`}>
            <div className="px-6 mb-6">
              <span className="text-[10px] font-bold text-gh-text-secondary uppercase tracking-[0.2em]">Project Files</span>
            </div>
            <div className="px-3 space-y-0.5">
              {renderFileTree()}
            </div>
          </aside>

          {/* Editor Area */}
          <main className={`flex-1 flex flex-col overflow-hidden relative ${isDark ? 'bg-black' : 'bg-gh-bg'}`}>
            <div className="flex-1 flex overflow-hidden">
                <div className={`w-12 flex flex-col items-center pt-8 text-[11px] font-mono select-none ${isDark ? 'text-[#484f58] bg-black' : 'text-gh-text-secondary bg-gh-bg-secondary'}`}>
                    {activeFile?.content?.split('\n').map((_, i) => (
                        <div key={i} className="h-6 flex items-center">{i + 1}</div>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <textarea 
                        value={activeFile?.content || ""}
                        onChange={(e) => handleFileContentChange(e.target.value)}
                        className={`w-full h-full bg-transparent font-mono text-[13px] pt-8 px-4 outline-none resize-none leading-6 thin-scrollbar ${isDark ? 'text-[#e6edf3]' : 'text-gh-text'}`}
                        placeholder="Enter your code here..."
                        spellCheck={false}
                    />
                </div>
            </div>
            
            {showSuccessModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSuccessModal(false)} />
                  <div className={`relative w-full max-w-[400px] border rounded-[20px] p-6 shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#0d1117] border-white/10' : 'bg-white border-gh-border'}`}>
                      <button 
                          onClick={() => setShowSuccessModal(false)}
                          className={`absolute top-5 right-5 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-gh-text-secondary hover:text-gh-text'}`}
                          aria-label="Close"
                      >
                          <span className="material-symbols-outlined !text-[18px]">close</span>
                      </button>

                      <h2 className={`text-lg font-bold mb-1.5 ${isDark ? 'text-white' : 'text-gh-text'}`}>Component Submitted for Review</h2>
                      <p className={`text-[13px] leading-relaxed mb-6 ${isDark ? 'text-white/60' : 'text-gh-text-secondary'}`}>
                          You can preview your component, it will be public after approval. Review usually takes 24-48 hours.
                      </p>

                      <div className="flex items-center gap-2.5">
                          <button 
                              onClick={handleReset}
                              className={`flex-1 h-10 px-4 rounded-lg transition-all group flex items-center justify-center gap-1.5 border ${isDark ? 'bg-transparent border-white/10 hover:bg-white/5' : 'bg-white border-gh-border hover:bg-gh-bg-secondary'}`}
                          >
                              <span className={`text-[12px] font-bold ${isDark ? 'text-white' : 'text-gh-text'}`}>Add another</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'text-white/20 bg-white/5 group-hover:text-primary group-hover:bg-primary/10' : 'text-gh-text-secondary bg-gh-bg-secondary'}`}>N</span>
                          </button>
                          <button 
                              onClick={() => navigate("/library")}
                              className="flex-1 h-10 px-4 bg-[#0969da] hover:bg-[#0860c6] text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] group"
                          >
                              <span className="text-[12px] font-bold">View Component</span>
                              <span className="text-[14px] material-symbols-outlined text-white/50 group-hover:translate-x-0.5 transition-transform font-bold">keyboard_return</span>
                          </button>
                      </div>
                  </div>
              </div>
            )}
            
            <style>{`
                .active-file-node { background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : resolvedTheme.colors.primary + '15'}; color: ${isDark ? '#fff' : resolvedTheme.colors.primary}; border-radius: 4px; }
                .folder-icon { color: ${isDark ? '#79c0ff' : resolvedTheme.colors.primary}; }
                textarea::placeholder { color: #484f58; }
                .thin-scrollbar::-webkit-scrollbar { width: 6px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#30363d' : '#d0d7de'}; border-radius: 10px; }
                .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#484f58' : '#afb8c1'}; }
            `}</style>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gh-bg text-gh-text p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-gh-border">
          <div>
            <nav className="flex items-center gap-2 text-[10px] text-gh-text-secondary font-bold uppercase tracking-widest mb-2">
              <span className="hover:text-gh-text cursor-pointer" onClick={() => navigate("/library")}>library</span>
              <span>/</span>
              <span className="text-gh-text">import new</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight">Import New Library Resource</h1>
            <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">1</div>
                    <span className="text-xs font-bold text-gh-text">Basic Information</span>
                </div>
                <div className="w-12 h-[1px] bg-gh-border mx-2" />
                <div className="flex items-center gap-2 opacity-50">
                    <div className="size-6 rounded-full bg-gh-bg-tertiary text-gh-text-secondary flex items-center justify-center text-[10px] font-bold border border-gh-border">2</div>
                    <span className="text-xs font-bold text-gh-text-secondary">Implementation Code</span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/library")}
              className="px-4 py-2 text-xs font-bold text-gh-text-secondary hover:text-gh-text uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleNext}
              disabled={!isStep1Valid}
              className={`px-6 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest transition-all shadow-lg ${isStep1Valid ? 'bg-primary text-white shadow-primary/20 hover:brightness-110' : 'bg-gh-bg-tertiary text-gh-text-secondary cursor-not-allowed border border-gh-border'}`}
            >
              Next Step
            </button>
          </div>
        </header>

        <div className="space-y-8 pb-20">
          {/* Component Info Section */}
          <section className="bg-gh-bg-secondary border border-gh-border rounded-2xl overflow-hidden">
            <div className="p-4 bg-gh-bg-tertiary border-b border-gh-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gh-text">Component Info</h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                  <div className="size-1 rounded-full bg-amber-500" />
                  Required
                </span>
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="comp-name" className="text-sm font-semibold text-gh-text flex items-center gap-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input 
                  id="comp-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='e.g. "Button"'
                  className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all shadow-inner"
                  required
                />
                <p className="text-[11px] text-gh-text-secondary">The display name of your component</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="comp-slug" className="text-sm font-semibold text-gh-text flex items-center gap-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input 
                  id="comp-slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder='e.g. "button"'
                  className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all shadow-inner"
                  required
                />
                <p className="text-[11px] text-gh-text-secondary">Used in the URL and imports</p>
              </div>

              <div className="col-span-2 space-y-2">
                <label htmlFor="comp-desc" className="text-sm font-semibold text-gh-text flex items-center gap-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                  id="comp-desc"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add some description to help others discover your component"
                  className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all h-24 resize-none shadow-inner"
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label htmlFor="comp-type" className="text-sm font-semibold text-gh-text">Component type <span className="text-red-500">*</span></label>
                <select 
                  id="comp-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  title="Component type"
                  className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all appearance-none cursor-pointer shadow-inner"
                >
                  <option>UI Component</option>
                  <option>React Hook</option>
                  <option>Utility Function</option>
                  <option>API Wrapper</option>
                </select>
              </div>
            </div>
          </section>

          {/* Tags Section */}
          <section className="space-y-4">
            <label htmlFor="comp-tags" className="text-sm font-semibold text-gh-text">Tags <span className="text-red-500">*</span></label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary text-sm group-focus-within:text-primary transition-colors">search</span>
              <input 
                id="comp-tags"
                name="tags-search"
                title="Search tags"
                placeholder="Search tags..."
                className="w-full bg-gh-bg-tertiary border border-gh-border rounded-xl px-10 py-3 text-sm focus:border-primary outline-none shadow-inner"
              />
            </div>
          </section>

          {/* Media Sections */}
          <section className="space-y-8">
             <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gh-text">Cover Image <span className="text-red-500">*</span></h3>
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="group border-2 border-dashed border-gh-border rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[240px]"
              >
                {previews.cover ? (
                  <img src={previews.cover} className="absolute inset-0 w-full h-full object-cover" alt="Cover Preview" />
                ) : (
                  <>
                    <div className="size-16 rounded-2xl bg-gh-bg-tertiary flex items-center justify-center text-gh-text-secondary mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <p className="text-sm font-bold text-gh-text">Click to upload <span className="font-normal text-gh-text-secondary">or drag and drop</span></p>
                    <p className="text-[11px] text-gh-text-secondary mt-1">PNG, JPEG (max. 5MB)</p>
                  </>
                )}
                <input 
                  id="cover-upload"
                  type="file" 
                  ref={coverInputRef} 
                  className="hidden" 
                  title="Upload Cover Image"
                  accept="image/png,image/jpeg"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("cover", e.target.files[0])}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gh-text">Video Preview</h3>
                <span className="text-[11px] text-gh-text-secondary font-medium">Optional</span>
              </div>
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="group border-2 border-dashed border-gh-border rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px]"
              >
                 {previews.video ? (
                   <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-4xl">check_circle</span>
                        <p className="text-sm font-bold text-gh-text">Video Selected</p>
                        <p className="text-[11px] text-gh-text-secondary">Click to change</p>
                   </div>
                 ) : (
                   <>
                    <div className="size-16 rounded-2xl bg-gh-bg-tertiary flex items-center justify-center text-gh-text-secondary mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl">movie</span>
                    </div>
                    <p className="text-sm font-bold text-gh-text">Click to upload <span className="font-normal text-gh-text-secondary">or drag and drop</span></p>
                    <p className="text-[11px] text-gh-text-secondary mt-1">MOV, MP4 (max. 50MB)</p>
                   </>
                 )}
                <input 
                  id="video-upload"
                  type="file" 
                  ref={videoInputRef} 
                  className="hidden" 
                  title="Upload Video Preview"
                  accept="video/mp4,video/quicktime"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("video", e.target.files[0])}
                />
              </div>
            </div>
          </section>

          <footer className="pt-8 border-t border-gh-border flex justify-end gap-4">
             <button 
              type="button"
              onClick={() => navigate("/library")}
              className="px-6 py-2.5 rounded-xl border border-gh-border text-xs font-bold text-gh-text-secondary hover:text-gh-text hover:bg-white/5 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={handleNext}
              disabled={!isStep1Valid}
              className={`px-8 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest transition-all shadow-lg ${isStep1Valid ? 'bg-primary text-white shadow-primary/20 hover:brightness-110' : 'bg-gh-bg-tertiary text-gh-text-secondary cursor-not-allowed border border-gh-border'}`}
            >
              Next Step
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CreateLibraryResource;
