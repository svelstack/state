/**
 * @param {() => (() => void) | void} initializer
 */
export function createMountInitializer(initializer) {
	let listeners = new Set();
	let unsubscribe;

	return {
		get isMounted() { return listeners.size > 0 },
		mount() {
			const id = Symbol('id');

			listeners.add(id);

			if (listeners.size === 1) {
				unsubscribe = initializer();
			}

			return () => {
				if (listeners.delete(id) && listeners.size === 0) {
					unsubscribe?.();
				}
			};
		},
	};
}

/**
 * @param {(args: { unmount: import('$lib').DelegateUnmount }) => void} initializer
 */
export function createMounter(initializer) {
	const subscribers = new Set();
	const unsubscribers = new Set();

	function unmount(fn) {
		if (fn) { unsubscribers.add(fn) }
	}

	const parent = createMountInitializer(() => {
		subscribers.forEach((subscribe) => {
			unmount(subscribe());
		});

		initializer({
			unmount,
		});

		return () => {
			unsubscribers.forEach((fn) => {
				try {
					fn();
				} catch (error) {
					console.error(error);
				}
			});

			unsubscribers.clear();
		};
	});

	return {
		...parent,
		/**
		 * @param {() => import('$lib').UnmountOrVoid} subscribe
		 */
		addSubscriber(subscribe) {
			subscribers.add(subscribe);

			if (parent.isMounted) {
				unmount(subscribe());
			}
		},
	};
}

/**
 * @template TValue
 * @param {Promise<TValue>} promise
 * @param {number | undefined} delay
 * @param {() => void} before
 * @param {() => void} after
 * @return {Promise<TValue>}
 */
export async function delayed(promise, delay, before, after) {
	if (delay == null) {
		before();

		try {
			return await promise;
		} finally {
			after();
		}
	}

	const timeout = setTimeout(before, delay);

	try {
		return await promise;
	} finally {
		clearTimeout(timeout);

		after();
	}
}
