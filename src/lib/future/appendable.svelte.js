import { AsyncableFutureState } from './asyncable.svelte.js';
import { FutureInvoker } from './invoker.svelte.js';

export class AppendableFutureState extends AsyncableFutureState {
	#cursor;
	#appending = $state(false);

	constructor(invoker, cursor, options) {
		super(
			new AppendableFutureInvoker(invoker, (original) => {
				const ret = original(this.#cursor);

				if (ret instanceof FutureInvoker) {
					return ret.run();
				}

				return ret;
			}),
			options,
		);

		this.#cursor = cursor;
	}

	async load() {
		const firstRequest = this.internals.isFirstRequest;

		if (firstRequest) {
			this.#cursor.beforeRequest(true);
		}

		const values = await super.load();

		if (firstRequest) {
			this.#cursor.afterRequest(values, true);
		}

		return values;
	}

	get cursor() {
		return this.#cursor;
	}

	clear() {
		super.clear();

		this.#cursor.reset();
	}

	refresh(clear) {
		this.#cursor.reset();

		return super.refresh(clear);
	}

	async #append() {
		if (!Array.isArray(this.value)) {
			console.error('Values in appendable must be an array');

			return this.value;
		}

		return this.internals.defaultInvoke(
			() => {
				this.#appending = true;
			},
			() => {
				this.#appending = false;
			},
			(newValues, oldValues) => {
				if (!Array.isArray(newValues)) {
					console.error('Values in appendable must be an array');

					return oldValues;
				}

				this.#cursor.afterRequest(newValues);

				if (!newValues.length) {
					return oldValues;
				}

				return [...oldValues, ...newValues];
			}
		);
	}

	get appending() {
		return this.#appending;
	}

	get finished() {
		return this.#cursor.finished;
	}

	async next() {
		if (!this.loaded) {
			return await this.load();
		}

		if (this.#cursor.finished) {
			return;
		}

		this.#cursor.beforeRequest();

		if (this.#cursor.finished) {
			return;
		}

		return await this.#append();
	}
}

class AppendableFutureInvoker extends FutureInvoker {
	#proxy;
	#original;

	constructor(original, proxy) {
		super();

		this.#original = original;
		this.#proxy = proxy;
	}

	run() {
		return this.#proxy(this.#original);
	}

	subscribe(fn) {
		if (this.#original instanceof FutureInvoker) {
			return this.#original.subscribe(fn);
		}

		return () => {};
	}

	notify() {
		if (this.#original instanceof FutureInvoker) {
			this.#original.notify();
		}
	}
}
