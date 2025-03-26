import { untrack } from 'svelte';

let defaultOptions = {
	exceptionHandler: defaultExceptionHandler
};

export class FutureState {
	options;

	constructor(options = {}) {
		if (new.target === FutureState) {
			throw new Error('FutureState is an abstract class and cannot be instantiated directly.');
		}

		this.options = Object.assign({}, defaultOptions, options);
	}

	effect(conditionFn) {
		if (conditionFn) {
			return () => {
				if (conditionFn()) {
					return untrack(() => this.mount());
				}
			};
		}

		return () => {
			return untrack(() => this.mount());
		};
	}

	static configure(options) {
		defaultOptions = Object.assign({}, defaultOptions, options);
	}
}

/**
 * @param {any} error
 * @return {import('./types.js').FutureStateError}
 */
function defaultExceptionHandler(error) {
	return {
		original: error,
		message: 'Something went wrong. Please try again later.',
		details: {},
	};
}
