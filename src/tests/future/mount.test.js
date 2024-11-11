import { expect, test } from 'vitest';
import { createTestToolsWithInvoker } from '../utils.js';

test('mount once', async () => {
	const { store, invokerCalled, wait, invoker } = createTestToolsWithInvoker();

	const unmount = store.mount();

	await wait();

	expect(invokerCalled.value).toBe(1);

	invoker.update(2);

	await wait();

	expect(invokerCalled.value).toBe(2);

	unmount();

	invoker.update(3);

	await wait();

	expect(invokerCalled.value).toBe(2);
});

test('mount twice', async () => {
	const { store, invokerCalled, wait, invoker } = createTestToolsWithInvoker();

	const unmount1 = store.mount();
	const unmount2 = store.mount();

	await wait();

	expect(invokerCalled.value).toBe(1);

	invoker.update(2);

	await wait();

	expect(invokerCalled.value).toBe(2);

	unmount1();

	invoker.update(3);

	await wait();

	expect(invokerCalled.value).toBe(3);

	unmount2();

	invoker.update(4);

	await wait();

	expect(invokerCalled.value).toBe(3);
});
