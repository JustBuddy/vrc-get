import type {Config} from "tailwindcss";
import withMT from "@material-tailwind/react/utils/withMT";

const config: Config = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		colors: {
			'white': '#212121',
			'font-white': '#FFFFFF',
			'blue-500': '#BABABA',
			'blue-100': '#494949',
			'gray': '#8492a6',
			'gray-900': '#FDDA0D',
			'gray-light': '#d3dce6',
			'blue-gray-50': '#212121',
			'blue-gray-100': '#FDDA0D',
			'blue-gray-500': '#BABABA',
			'blue-gray-600': '#BABABA',
			'blue-gray-700': '#BABABA',
			'blue-gray-800': '#BABABA',
			'blue-gray-900': '#BABABA',
			'green-500': '#BABABA',
		},
		extend: {
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic":
					"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
			},
		},
	},
	plugins: [],
};
export default withMT(config);
