import { Repository } from "../../types";
import styles from "./VisualPortfolio.module.css";

interface VisualPortfolioProps {
  repos: Repository[];
  loading?: boolean;
}

const VisualPortfolio: React.FC<VisualPortfolioProps> = ({ repos, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-gh-bg-secondary border border-gh-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-gh-border rounded-xl">
        <span className="material-symbols-outlined text-4xl text-gh-text-secondary mb-2">grid_view</span>
        <p className="text-gh-text-secondary text-sm">No repositories in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between px-1 mb-6">
        <h3 className="text-lg font-semibold text-gh-text tracking-tight">
          Visual Portfolio
        </h3>
        <div className="flex gap-2 text-xs font-bold text-gh-text-secondary">
          <span className="text-gh-text">Posts</span>
          <span>•</span>
          <span>Saved</span>
          <span>•</span>
          <span>Tagged</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {repos.slice(0, 9).map((repo, i) => (
          <div
            key={repo.id}
            className="aspect-square bg-gh-bg-secondary border border-gh-border rounded-lg overflow-hidden group cursor-pointer relative"
          >
            {/* Image Gradient based on tech color */}
            <div
              className={`w-full h-full opacity-20 group-hover:opacity-30 transition-opacity ${styles.portfolioGradient}`}
              style={
                {
                  "--gradient-start": repo.language === 'TypeScript' ? '#3178c6' : repo.language === 'JavaScript' ? '#f1e05a' : '#2ea043',
                } as React.CSSProperties
              }
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <span className="material-symbols-outlined text-4xl text-white mb-2 shadow-black drop-shadow-lg">
                {i % 2 === 0 ? "terminal" : "dataset"}
              </span>
              <h4 className="font-bold text-white text-sm drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                {repo.name}
              </h4>
            </div>

            {/* Stats Overlay on Hover */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-white font-bold">
                <span className="material-symbols-outlined filled !text-[18px]">
                  favorite
                </span>
                {((repo.name.length * 97) % 400) + 50}
              </div>
              <div className="flex items-center gap-1 text-white font-bold">
                <span className="material-symbols-outlined filled !text-[18px]">
                  chat_bubble
                </span>
                {((repo.name.length * 13) % 40) + 5}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualPortfolio;
