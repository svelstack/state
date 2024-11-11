import { AsyncableFutureState } from '$lib';
import { FutureManualInvoker } from '$lib/future/index.js';

/**
 * Waits for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @return {Promise<void>} A promise that resolves after the specified delay.
 */
export function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createTestToolsWithInvoker() {
	const invoker = new FutureManualInvoker((value) => Promise.resolve({
		called: called++,
		value,
	}), [0]);

	let called = 0;

	return {
		store: new AsyncableFutureState(invoker),
		invokerCalled: {
			get value() { return called },
		},
		invoker,
		wait: () => {
			return new Promise(resolve => {
				queueMicrotask(() => resolve());
			});
		},
	};
}

export function createFakePromise() {
	let _resolve, _reject, _promise;
	let clean = true;
	let made = 0;

	function make() {
		if (!clean) {
			throw new Error('Promise already created, call resolve or reject first.');
		}

		made++;

		return (_promise = new Promise((r, j) => {
			_reject = j;
			_resolve = r;
		}));
	}

	function clear() {
		clean = true;
		_resolve = _reject = _promise = undefined;
	}

	async function resolve(val) {
		_resolve(val);

		await _promise;

		clear();
	}

	async function makeResolved(val) {
		made++;

		return Promise.resolve(val);
	}

	async function reject(val) {
		_reject(val);

		try {
			await _promise;
		} catch (e) {
			// Ignore
		}

		clear();
	}

	return {
		make,
		makeResolved,
		resolve,
		reject,
		get made() {
			return made;
		}
	};
}
