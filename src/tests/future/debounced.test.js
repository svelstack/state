import { expect, test } from "vitest";
import { DebouncedFutureInvoker } from "$lib";
import { wait } from '../utils';

test('debounced', async () => {
	let called = 0;

	const invoker = new DebouncedFutureInvoker(() => {
		called++;

		return Promise.resolve('foo');
	}, 4);

	expect(called).toBe(0);

	invoker.run();
	invoker.run();
	invoker.run();

	expect(called).toBe(0);

	await wait(5);

	expect(called).toBe(1);
});
