import { expect, test } from 'vitest';
import { createFakePromise } from '../utils.js';
import { FutureRunesInvoker, AsyncableFutureState } from '$lib';
import { flushSync } from 'svelte';
import { effectRootAsync } from '../svelte-utils.svelte.js';

async function testLoadWith(loadFn) {
	await effectRootAsync(async () => {
		const promise = createFakePromise();
		const future = new AsyncableFutureState(new FutureRunesInvoker(() => promise.make()));

		const cleanup = loadFn(future);

		flushSync();

		expect(future.loading).toBeTruthy();
		expect(future.refreshing).toBeFalsy();
		expect(future.loaded).toBeFalsy();

		await promise.resolve('foo');

		expect(future.loading).toBeFalsy();
		expect(future.loaded).toBeTruthy();
		expect(future.refreshing).toBeFalsy();
		expect(future.value).toBe('foo');

		return cleanup;
	});
}

test('load method with svelte invoker', async () => {
	await testLoadWith((future) => {
		future.load().then((val) => {
			expect(val).toBe('foo');
		});
	});
});

test('effect method', async () => {
	await testLoadWith((future) => {
		$effect(future.effect());
	});
});

test('invoker disallow implicit side effects', async () => {
	await effectRootAsync(async () => {
		let counter = $state(0);
		const future = new AsyncableFutureState(() => Promise.resolve(counter));

		$effect(future.effect());

		flushSync();

		await future.load();

		expect(future.value).toBe(0);

		counter++;

		flushSync();

		await future.load();

		expect(future.value).toBe(0);
	});
});

test('disallow calling mount() inside $effect', async () => {
	await effectRootAsync(async () => {
		const future = new AsyncableFutureState(() => Promise.resolve('foo'));

		expect(() => {
			$effect(() => {
				future.mount();
			});

			flushSync();
		}).toThrowError();
	});
});

test('refresh method called by invoker', async () => {
	const promise = createFakePromise();

	await effectRootAsync(async () => {
		let dep = $state(0);
		const history = [];
		const invoker = new FutureRunesInvoker(
			(dep) => {
				history.push(dep);

				return promise.make();
			},
			() => [dep]
		);

		const future = new AsyncableFutureState(invoker);

		$effect(future.effect());

		// initial request
		flushSync();

		expect(promise.made).toBe(1);
		expect(future.loading).toBeTruthy();

		await promise.resolve('foo');

		expect(future.loading).toBeFalsy();
		expect(future.loaded).toBeTruthy();
		expect(future.value).toBe('foo');
		expect(history).toEqual([0]);

		// refresh request by invoker
		dep++;

		flushSync();

		expect(promise.made).toBe(2);
		expect(future.refreshing).toBeTruthy();
		expect(history).toEqual([0, 1]);

		await promise.resolve('bar');

		expect(future.refreshing).toBeFalsy();
		expect(future.loaded).toBeTruthy();
		expect(future.value).toBe('bar');
	});
});

test('effect with condition', async () => {
	let future;

	await effectRootAsync(async () => {
		let mounted = $state(false);

		future = new TrackingFutureState(() => Promise.resolve('foo'));

		$effect(future.effect(() => mounted));

		expect(future.mountCount).toBe(0);
		expect(future.unmountCount).toBe(0);

		flushSync();

		expect(future.mountCount).toBe(0);
		expect(future.unmountCount).toBe(0);

		mounted = true;

		flushSync();

		expect(future.mountCount).toBe(1);
		expect(future.unmountCount).toBe(0);

		mounted = false;

		flushSync();

		expect(future.mountCount).toBe(1);
		expect(future.unmountCount).toBe(1);

		mounted = true;

		flushSync();

		expect(future.mountCount).toBe(2);
		expect(future.unmountCount).toBe(1);
	});

	expect(future.mountCount).toBe(2);
});

class TrackingFutureState extends AsyncableFutureState {
	mountCount = 0;
	unmountCount = 0;

	constructed() {
		this.internals.onMount(() => {
			this.mountCount++;

			return () => {
				this.unmountCount++;
			};
		});
	}
}
