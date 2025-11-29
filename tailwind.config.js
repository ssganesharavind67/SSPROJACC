export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                slate: {
                    850: '#151f32',
                    950: '#020617',
                }
            }
        },
    },
    plugins: [],
}
