/**
 * @return {[() => void, () => void]}
 */
export function useUpdater() {
	let updater = {
		update: () => {}
	};
	return [
		() => {
			updater.update();
		},
		(fn) => {
			updater.update = fn;
		}
	];
}

/**
 * @template {Object} TObject
 * @param {TObject} obj
 * @return {[TObject&import('svelte/store').Readable<TObject>, () => void]}
 */
export function useSubscribable(obj) {
	const subscribers = [];

	obj.subscribe = (run) => {
		run(obj);

		subscribers.push(run);

		return () => {
			const index = subscribers.indexOf(run);

			if (index !== -1) {
				subscribers.splice(index, 1);
			}
		};
	};

	const update = () => {
		subscribers.forEach((run) => run(obj));
	};

	return [obj, update];
}

/**
 * @template {Object} TObject
 * @param {TObject} obj
 * @param {(fn: () => void) => void} setUpdate
 * @return {TObject&import('svelte/store').Readable<TObject>}
 */
export function subscribable(obj, setUpdate) {
	const [object, toSet] = useSubscribable(obj);

	setUpdate(toSet);

	return object;
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
