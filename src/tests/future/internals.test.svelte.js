import { expect, test } from 'vitest';
import { FutureStateInternals } from '$lib';
import { flushSync } from 'svelte';

test('shallow reactivity', () => {
	const cleanup = $effect.root(() => {
		const history = [];
		const internals = new FutureStateInternals(
			() => Promise.resolve('foo'),
			{ exceptionHandler() {} }
		);

		$effect(() => {
			history.push($state.snapshot(internals.value));
		});

		flushSync();

		expect(history).toEqual([undefined]);

		internals.value = [{ val: 'foo' }];

		flushSync();

		expect(history).toEqual([undefined, [{ val: 'foo' }]]);

		internals.value[0].val = 'bar';

		flushSync();

		expect(history).toEqual([undefined, [{ val: 'foo' }]]);
	});

	cleanup();
});

test('deep reactivity', () => {
	const cleanup = $effect.root(() => {
		const history = [];
		const internals = new FutureStateInternals(
			() => Promise.resolve('foo'),
			{ exceptionHandler() {}, deepReactivity: true }
		);

		$effect(() => {
			history.push($state.snapshot(internals.value));
		});

		flushSync();

		expect(history).toEqual([undefined]);

		internals.value = [{ val: 'foo' }];

		flushSync();

		expect(history).toEqual([undefined, [{ val: 'foo' }]]);

		internals.value[0].val = 'bar';

		flushSync();

		expect(history).toEqual([undefined, [{ val: 'foo' }], [{ val: 'bar' }]]);
	});

	cleanup();
});
