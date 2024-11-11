/**
 * @param {(args: { unmount: import('$lib').DelegateUnmount }) => void} initializer
 */
export function createMounter(initializer) {
	let counter = 0;
	const subscribers = new Set();
	const unsubscribers = new Set();

	function unmount(fn) {
		if (fn) { unsubscribers.add(fn) }
	}

	// TODO: prevent unmounting twice?
	return {
		/**
		 * @param {() => import('$lib').UnmountOrVoid} subscribe
		 */
		addSubscriber(subscribe) {
			subscribers.add(subscribe);

			if (counter > 0) {
				unmount(subscribe());
			}
		},
		unmount() {
			counter--;

			if (counter === 0) {
				unsubscribers.forEach((fn) => {
					try {
						fn();
					} catch (error) {
						console.error(error);
					}
				});

				unsubscribers.clear();
			}
		},
		mount() {
			counter++;

			if (counter === 1) {
				subscribers.forEach((subscribe) => {
					unmount(subscribe());
				});

				initializer({
					unmount,
				});
			}

			return this.unmount.bind(this);
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
