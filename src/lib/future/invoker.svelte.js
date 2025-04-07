import { untrack } from 'svelte';

export class FutureInvoker {
	constructor() {
		if (new.target === FutureInvoker) {
			throw new TypeError('Cannot construct FutureInvoker, because it is an abstract class');
		}
	}

}

export class BaseFutureInvoker extends FutureInvoker {

	#subscribers = new Set();

	constructor() {
		super();

		if (new.target === BaseFutureInvoker) {
			throw new TypeError('Cannot construct BaseFutureInvoker, because it is an abstract class');
		}
	}

	mounted() {}

	unmounted() {}

	subscribe(fn) {
		if (this.#subscribers.size === 0) {
			this.mounted();
		}

		this.#subscribers.add(fn);

		fn(this);

		return () => {
			this.#subscribers.delete(fn);

			if (this.#subscribers.size === 0) {
				this.unmounted();
			}
		};
	}

	notify() {
		this.#subscribers.forEach((fn) => fn(this));
	}

}

export class DebouncedFutureInvoker extends BaseFutureInvoker {
	#timeoutId;
	#timeout;
	#invoker;
	#unmount;
	#promise;
	#resolve;
	#reject;

	constructor(invoker, timeoutInMs) {
		super();

		this.#invoker = invoker instanceof FutureInvoker ? invoker : new FuturePlainInvoker(invoker);
		this.#timeout = timeoutInMs;
	}

	run() {
		if (this.#promise == null) {
			this.#promise = new Promise((resolve, reject) => {
				this.#resolve = resolve;
				this.#reject = reject;
			});
		} else if (this.#timeoutId != null) {
			clearTimeout(this.#timeoutId);
		}

		this.#timeoutId = setTimeout(this.#complete.bind(this), this.#timeout);

		return this.#promise;
	}

	#complete() {
		const resolve = this.#resolve;
		const reject = this.#reject;

		this.#resolve = this.#reject = this.#promise = this.#timeoutId = undefined;

		this.#invoker.run().catch(reject).then(resolve);
	}

	mounted() {
		this.#unmount = this.#invoker.subscribe(() => {
			this.notify();
		});
	}

	unmounted() {
		this.#unmount?.();
		this.#unmount = undefined;
	}
}

export class FuturePlainInvoker extends FutureInvoker {
	#invoker;

	constructor(invoker) {
		super();

		this.#invoker = invoker;
	}

	run() {
		return this.#invoker();
	}

	subscribe(fn) {
		fn(this);

		return () => {};
	}

	notify() {}
}

export class FutureManualInvoker extends BaseFutureInvoker {
	#invoker;
	#factory;

	constructor(factory, values = []) {
		super();

		this.#factory = factory;
		this.#invoker = () => this.#factory(...values);
	}

	run() {
		return this.#invoker();
	}

	update(...values) {
		this.#invoker = () => this.#factory(...values);

		this.notify();
	}
}

export class FutureRunesInvoker extends BaseFutureInvoker {
	#invoker;
	#factory;

	constructor(factory, deps = () => [], options = {}) {
		super();

		if (!options.reactiveFactory) {
			this.#factory = factory;
		}

		$effect(() => {
			const args = deps();

			if (options.reactiveFactory) {
				this.#factory = factory();
			}

			untrack(() => this.#update(...args));
		});

		this.#update(...deps());
	}

	run() {
		return this.#invoker();
	}

	#update(...values) {
		this.#invoker = () => this.#factory(...values);

		this.notify();
	}

	static reactiveFactory(factory, deps = () => []) {
		return new FutureRunesInvoker(factory, deps, { reactiveFactory: true });
	}

}
