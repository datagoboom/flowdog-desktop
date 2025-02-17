/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
      extend: {
        backgroundColor: {
          'light-background': '#ffffff',
          'light-paper': '#f9f9f9',
          'dark-background': '#2d2d2d',
          'dark-paper': '#393939',
        },
        textColor: {
          'light-foreground': '#4d4d4c',
          'light-comment': '#8e908c',
          'dark-foreground': '#cccccc',
          'dark-comment': '#999999',
        },
        borderColor: {
          'light-foreground': '#4d4d4c',
          'dark-foreground': '#cccccc',
          semantic: {
            red: 'var(--color-red)',
            orange: 'var(--color-orange)',
            yellow: 'var(--color-yellow)',
            green: 'var(--color-green)',
            aqua: 'var(--color-aqua)',
            blue: 'var(--color-blue)',
            purple: 'var(--color-purple)',
            cyan: 'var(--color-cyan)',
          }
        },
        colors: {
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#c82829', // light-red
            600: '#b91c1c',
            700: '#991b1b',
            800: '#7f1d1d',
            900: '#661c1c',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f5871f', // light-orange
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab700', // light-yellow
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#718c00', // light-green
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          aqua: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#3e999f', // light-aqua
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
          },
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#4271ae', // light-blue
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          purple: {
            50: '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#8959a8', // light-purple
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
          },
          cyan: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#66cc99', // light-cyan
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
          },
          // Semantic colors for nodes
          semantic: {
            red: {
              50: 'var(--color-red-50)',
              100: 'var(--color-red-100)',
              200: 'var(--color-red-200)',
              300: 'var(--color-red-300)',
              400: 'var(--color-red-400)',
              500: 'var(--color-red-500)',
              600: 'var(--color-red-600)',
              700: 'var(--color-red-700)',
              800: 'var(--color-red-800)',
              900: 'var(--color-red-900)',
              DEFAULT: 'var(--color-red)'
            },
            orange: {
              50: 'var(--color-orange-50)',
              100: 'var(--color-orange-100)',
              200: 'var(--color-orange-200)',
              300: 'var(--color-orange-300)',
              400: 'var(--color-orange-400)',
              500: 'var(--color-orange-500)',
              600: 'var(--color-orange-600)',
              700: 'var(--color-orange-700)',
              800: 'var(--color-orange-800)',
              900: 'var(--color-orange-900)',
              DEFAULT: 'var(--color-orange)'
            },
            yellow: {
              50: 'var(--color-yellow-50)',
              100: 'var(--color-yellow-100)',
              200: 'var(--color-yellow-200)',
              300: 'var(--color-yellow-300)',
              400: 'var(--color-yellow-400)',
              500: 'var(--color-yellow-500)',
              600: 'var(--color-yellow-600)',
              700: 'var(--color-yellow-700)',
              800: 'var(--color-yellow-800)',
              900: 'var(--color-yellow-900)',
              DEFAULT: 'var(--color-yellow)'
            },
            green: {
              50: 'var(--color-green-50)',
              100: 'var(--color-green-100)',
              200: 'var(--color-green-200)',
              300: 'var(--color-green-300)',
              400: 'var(--color-green-400)',
              500: 'var(--color-green-500)',
              600: 'var(--color-green-600)',
              700: 'var(--color-green-700)',
              800: 'var(--color-green-800)',
              900: 'var(--color-green-900)',
              DEFAULT: 'var(--color-green)'
            },
            aqua: {
              50: 'var(--color-aqua-50)',
              100: 'var(--color-aqua-100)',
              200: 'var(--color-aqua-200)',
              300: 'var(--color-aqua-300)',
              400: 'var(--color-aqua-400)',
              500: 'var(--color-aqua-500)',
              600: 'var(--color-aqua-600)',
              700: 'var(--color-aqua-700)',
              800: 'var(--color-aqua-800)',
              900: 'var(--color-aqua-900)',
              DEFAULT: 'var(--color-aqua)'
            },
            blue: {
              50: 'var(--color-blue-50)',
              100: 'var(--color-blue-100)',
              200: 'var(--color-blue-200)',
              300: 'var(--color-blue-300)',
              400: 'var(--color-blue-400)',
              500: 'var(--color-blue-500)',
              DEFAULT: 'var(--color-blue)'
            },
            purple: {
              50: 'var(--color-purple-50)',
              100: 'var(--color-purple-100)',
              200: 'var(--color-purple-200)',
              300: 'var(--color-purple-300)',
              400: 'var(--color-purple-400)',
              500: 'var(--color-purple-500)',
              DEFAULT: 'var(--color-purple)'
            },
            cyan: {
              50: 'var(--color-cyan-50)',
              100: 'var(--color-cyan-100)',
              200: 'var(--color-cyan-200)',
              300: 'var(--color-cyan-300)',
              400: 'var(--color-cyan-400)',
              500: 'var(--color-cyan-500)',
              DEFAULT: 'var(--color-cyan)'
            }
          }
        },
        scale: {
          '101': '1.01',
          '102': '1.02',
        }
      },
    },
    plugins: [],
  }