import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	test: {
		include: [
			'src/**/*.{test,spec}.{js,ts}',
			'src/**/*.{test,spec}.svelte.{js,ts}',
		],
		environment: 'jsdom',
	}
});
