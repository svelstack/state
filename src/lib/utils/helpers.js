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
