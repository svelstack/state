import { expect, test } from 'vitest';
import { createFakePromise } from '../utils.js';
import { FutureRunesInvoker } from '$lib';
import { flushSync } from 'svelte';

test('svelte invoker basics', () => {
	const cleanup = $effect.root(() => {
		const promise = createFakePromise();
		const invoker = new FutureRunesInvoker(() => promise.makeResolved('foo'));

		invoker.run();

		expect(promise.made).toBe(1);

		invoker.run();

		expect(promise.made).toBe(2);
	});

	cleanup();
});

test('svelte invoker subscribe', () => {
	const promises = [];

	const cleanup = $effect.root(() => {
		let dep = $state(0);

		const promise = createFakePromise();
		const invoker = new FutureRunesInvoker(
			() => promise.makeResolved('foo'),
			() => [dep]
		);

		invoker.subscribe((invoker) => {
			promises.push(invoker.run());
		});

		expect(promises.length).toBe(1);

		flushSync();

		expect(promises.length).toBe(2);

		dep++;

		expect(promises.length).toBe(2);

		flushSync();

		expect(promises.length).toBe(3);
	});

	cleanup();
});
