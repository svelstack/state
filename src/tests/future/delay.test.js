import { expect, test } from 'vitest';
import { createFakePromise, wait } from '../utils.js';
import { AsyncableFutureState } from '$lib';

test('indicators delay', async () => {
	const delay = 4;
	const promise = createFakePromise();
	const state = new AsyncableFutureState(() => promise.make(), {
		indicatorsDelay: delay
	});

	state.load();

	expect(state.loading).toBe(false);

	await wait(delay + 1);

	expect(state.loading).toBe(true);

	await promise.resolve('foo');

	expect(state.loading).toBe(false);
});
