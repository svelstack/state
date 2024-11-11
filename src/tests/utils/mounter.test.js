import { expect, test } from 'vitest';
import { createMounter } from '$lib/utils/helpers.js';

function createSubscriber() {
	let called = 0;
	let unmounted = 0;

	return {
		get called() {
			return called;
		},
		get unmounted() {
			return unmounted;
		},
		subscribe() {
			called++;

			return () => {
				unmounted++;
			};
		},
	};
}

test('createMounter', () => {
	const firstSubscriber = createSubscriber();
	const secondSubscriber = createSubscriber();
	let called = 0;
	let unsubscribed = 0;

	const mounter = createMounter(({ unmount }) => {
			called++;

			unmount(() => unsubscribed++);
	});

	mounter.addSubscriber(firstSubscriber.subscribe);

	expect(firstSubscriber.called).toBe(0);
	expect(firstSubscriber.unmounted).toBe(0);

	mounter.mount();

	expect(called).toBe(1);
	expect(unsubscribed).toBe(0);
	expect(firstSubscriber.called).toBe(1);

	mounter.addSubscriber(secondSubscriber.subscribe);

	expect(secondSubscriber.called).toBe(1);
	expect(secondSubscriber.unmounted).toBe(0);

	mounter.mount();

	expect(called).toBe(1);
	expect(unsubscribed).toBe(0);
	expect(firstSubscriber.called).toBe(1);
	expect(secondSubscriber.called).toBe(1);

	mounter.unmount();

	expect(called).toBe(1);
	expect(unsubscribed).toBe(0);
	expect(firstSubscriber.unmounted).toBe(0);
	expect(secondSubscriber.unmounted).toBe(0);

	mounter.unmount();

	expect(called).toBe(1);
	expect(unsubscribed).toBe(1);
	expect(firstSubscriber.unmounted).toBe(1);
	expect(secondSubscriber.unmounted).toBe(1);

	mounter.mount();

	expect(called).toBe(2);

	mounter.unmount();

	expect(called).toBe(2);
});
