import { UninitializedStateError } from '$lib';
import { FutureState } from '$lib/future/abstract.svelte.js';
import { FutureStateMountInternals } from '$lib/future/internals.svelte.js';

export class ComposableFutureState extends FutureState {
	#states = [];
	#value = $derived(this.#states.map((state) => state.value));
	#loading = $derived(this.#states.map((state) => state.loading).some((val) => val));
	#loaded = $derived(this.#states.map((state) => state.loaded).every((val) => val));
	#refreshing = $derived(this.#states.map((state) => state.refreshing).some((val) => val));
	#error = $derived(this.#states.map((state) => state.error).find((val) => val !== undefined));
	internals;

	constructor(states) {
		super();

		this.#states = states;
		this.internals = new FutureStateMountInternals();

		states.forEach((state) => {
			this.internals.addSubscriber(state.mount.bind(state));
		});
	}

	get value() {
		if (!this.#loaded) {
			throw new UninitializedStateError();
		}

		return this.#value;
	}

	get valueOrUndefined() {
		if (!this.#loaded) {
			return undefined;
		}

		return this.#value;
	}

	get loading() {
		return this.#loading;
	}

	get loaded() {
		return this.#loaded;
	}

	get refreshing() {
		return this.#refreshing;
	}

	get error() {
		return this.#error;
	}

	clear() {
		this.#states.forEach((state) => state.clear());
	}

	load() {
		return Promise.all(this.#states.map((state) => state.load()));
	}

	refresh(clear) {
		return Promise.all(this.#states.map((state) => state.refresh(clear)));
	}

	mount() {
		return this.internals.mounted();
	}
}
