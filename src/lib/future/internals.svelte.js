import { FuturePlainInvoker } from '$lib';
import { createMounter, delayed } from '$lib/utils/helpers.js';

const voidFn = () => {};

export class FutureStateMountInternals {

	/** @type {ReturnType<typeof import('$lib/utils/helpers.js').createMounter>} */
	#mounter;

	events = {
		mount: new Set(),
		externalChange: new Set(),
	};

	constructor() {
		this.#mounter = createMounter(({ unmount }) => {
			const registerUnmount = (fn) => {
				if (fn) { unmount(fn) }
			};

			this.events.mount.forEach((fn) => registerUnmount(fn()));
		});
	}

	onMount(fn) {
		this.events.mount.add(fn);
	}

	onExternalChange(fn) {
		this.events.externalChange.add(fn);
	}

	autoSubscribe(subscriber, refreshOnChange = false) {
		if (refreshOnChange) {
			this.#mounter.addSubscriber(() => {
				let initialCall = true;

				const unmount = subscriber(() => {
					if (initialCall) { return }

					this.events.externalChange.forEach((fn) => fn());
				});

				initialCall = false;

				return unmount;
			});
		} else {
			this.#mounter.addSubscriber(() => subscriber(voidFn));
		}
	}

	mounted() {
		return this.#mounter.mount();
	}
}

class DeepReactiveValue {
	#value = $state(undefined);

	get value() {
		return this.#value;
	}

	set value(val) {
		this.#value = val;
	}
}

class ShallowReactiveValue {
	#value = $state.raw(undefined);

	get value() {
		return this.#value;
	}

	set value(val) {
		this.#value = val;
	}
}

export class FutureStateInternals extends FutureStateMountInternals {
	#invoker;

	#value = $state(undefined);
	#loading = $state(false);
	#loaded = $state(false);
	#refreshing = $state(false);
	#error = $state(undefined);

	#exceptionHandler;
	#delayTime;

	constructor(invoker, options) {
		super();

		if (typeof invoker === 'function') {
			invoker = new FuturePlainInvoker(invoker);
		}

		this.#invoker = invoker;
		this.#exceptionHandler = options.exceptionHandler;
		this.#delayTime = options.indicatorsDelay;
		this.#value = options.deepReactivity ? new DeepReactiveValue() : new ShallowReactiveValue();

		this.autoSubscribe(invoker.subscribe.bind(invoker), true);
	}

	get value() {
		return this.#value.value;
	}

	set value(val) {
		if (val === undefined) {
			this.#loaded = false;
		} else {
			this.#loaded = true;
			this.#error = undefined;
		}
		
		this.#value.value = val;
	}

	set loading(val) {
		this.#loading = val;
	}

	get loading() {
		return this.#loading;
	}

	get loaded() {
		return this.#loaded;
	}

	set loaded(val) {
		this.#loaded = val;
	}

	get refreshing() {
		return this.#refreshing;
	}

	set refreshing(val) {
		this.#refreshing = val;
	}

	get error() {
		return this.#error;
	}

	set error(val) {
		this.#error = val;
	}

	get isFirstRequest() {
		return !this.#loaded;
	}

	clear() {
		this.#value.value = undefined;
		this.#loading = false;
		this.#loaded = false;
		this.#refreshing = false;
		this.#error = undefined;
	}

	raiseError(error) {
		this.#error = this.#exceptionHandler(error);
	}

	get invoker() {
		return this.#invoker;
	}

	async invoke(invoker, before, after, onValue) {
		const firstRequest = this.isFirstRequest;

		return await delayed(
			(async () => {
				this.#error = undefined;

				try {
					let value = await invoker();

					if (onValue) {
						value = onValue(value, this.value);
					}

					return (this.value = value);
				} catch (error) {
					this.raiseError(error);

					return undefined;
				}
			})(),
			this.#delayTime,
			before ??
				(() => {
					if (firstRequest) {
						this.#loading = true;
					} else {
						this.#refreshing = true;
					}
				}),
			after ??
				(() => {
					if (firstRequest) {
						this.#loading = false;
					} else {
						this.#refreshing = false;
					}
				})
		);
	}

	async defaultInvoke(before, after, onValue) {
		return this.invoke(this.#invoker.run.bind(this.#invoker), before, after, onValue);
	}
}
