import { expect, test } from 'vitest';
import { createFakePromise } from '../utils.js';
import { ExtendableFutureState } from '$lib';
import { effectRootAsync } from '../svelte-utils.svelte.js';
import { flushSync } from 'svelte';

test('modify method', async () => {
	await effectRootAsync(async () => {
		const promise = createFakePromise();
		const history = [];
		const state = new ExtendableFutureState(() => promise.make());

		$effect(state.effect());

		$effect(() => {
			history.push(state.valueOrUndefined);
		});

		flushSync();

		expect(history).toEqual([undefined]);

		await promise.resolve([1]);

		flushSync();

		expect(history).toEqual([undefined, [1]]);

		state.modify((value) => [...value, 2]);

		expect(history).toEqual([undefined, [1]]);

		flushSync();

		expect(history).toEqual([undefined, [1], [1, 2]]);
	});
});
