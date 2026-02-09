/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Recupera.ia Identity (Deep Green + Lime)
                brand: {
                    DEFAULT: '#b4f03a', // Neon Lime Green
                    hover: '#a3d935',
                    dark: '#1a3322', // Darker green for borders/accents
                },
                background: {
                    primary: '#050a07', // Very deep green/black base
                    secondary: '#0d1f12', // Rich dark green for cards/sidebars
                    card: '#142e1b', // Slightly lighter for card backgrounds
                    hover: '#1a3322',
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#a1a1aa', // Zinc 400
                    muted: '#52525b', // Zinc 600
                    inverted: '#000000',
                },
                // Functional Colors
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'neon': '0 0 10px rgba(180, 240, 58, 0.2), 0 0 20px rgba(180, 240, 58, 0.1)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }
        },
    },
    plugins: [],
}
