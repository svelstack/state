import { expect, test } from 'vitest';
import { FutureStateMountInternals } from '$lib/future/index.js';

function createSubscriber() {
	const subscribers = new Set();
	let value = 0;
	let subscribed = false;

	return {
		get subscribed() {
			return subscribed;
		},
		increment() {
			value += 1;

			subscribers.forEach((fn) => fn(value));
		},
		subscribe(fn) {
			subscribed = true;
			fn(value);
			subscribers.add(fn);

			return () => {
				subscribed = false;
				subscribers.delete(fn);
			};
		}
	};
}

test('autosubscribe', () => {
	let changed = 0;
	let onMountCalled = 0;
	const subscriber = createSubscriber();
	const internals = new FutureStateMountInternals();

	internals.autoSubscribe(subscriber.subscribe);
	internals.onMount(() => {
		onMountCalled++;

		return () => {};
	});

	expect(subscriber.subscribed).toBe(false);

	const unmount = internals.mounted(() => changed++);

	expect(subscriber.subscribed).toBe(true);
	expect(changed).toBe(0);

	subscriber.increment();

	expect(changed).toBe(1);

	unmount();

	expect(subscriber.subscribed).toBe(false);
	expect(onMountCalled).toBe(1);
});
