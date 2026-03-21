/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "!./node_modules/**",
        "!./dist/**",
        "!./backend/**",
        "!./electron/**",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--gh-primary)",
                "gh-bg": "var(--gh-bg)",
                "gh-bg-secondary": "var(--gh-bg-secondary)",
                "gh-bg-tertiary": "var(--gh-bg-tertiary)",
                "gh-border": "var(--gh-border)",
                "gh-text": "var(--gh-text)",
                "gh-text-secondary": "var(--gh-text-secondary)",
                "vscode-editor": "#1e1e1e",
                "vscode-sidebar": "#252526",
                "vscode-border": "#333333",
                "vscode-activity-bar": "#333333",
                /* Global Vercel Dark Theme Overrides */
                gray: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#333333', // Subtle text / strong border
                    700: '#1A1A1A', // Secondary Vercel border
                    800: '#111111', // Hover state background
                    900: '#0A0A0A', // Card / Sidebar background
                    950: '#000000', // Pure black base
                },
                zinc: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#333333',
                    700: '#1A1A1A',
                    800: '#111111',
                    900: '#0A0A0A',
                    950: '#000000',
                },
            },
            fontFamily: {
                sans: [
                    "Geist",
                    "Inter",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "sans-serif",
                ],
                display: [
                    "Geist",
                    "Inter",
                    "SF Pro Display",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "sans-serif",
                ],
                mono: [
                    "JetBrains Mono",
                    "ui-monospace",
                    "SFMono-Regular",
                    "Menlo",
                    "Monaco",
                    "Consolas",
                    "monospace",
                ],
            },
            fontSize: {
                'xs': ['var(--tc-font-xs)', { lineHeight: '1.4' }],
                'sm': ['var(--tc-font-sm)', { lineHeight: '1.4' }],
                'base': ['var(--tc-font-base)', { lineHeight: '1.5' }],
                'md': ['var(--tc-font-md)', { lineHeight: '1.4' }],
                'lg': ['var(--tc-font-lg)', { lineHeight: '1.3' }],
                'xl': ['var(--tc-font-xl)', { lineHeight: '1.2' }],
                '2xl': ['var(--tc-font-2xl)', { lineHeight: '1.2' }],
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/container-queries"),
    ],
};
