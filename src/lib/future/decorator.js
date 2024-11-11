import { FutureState } from '$lib/future/abstract.svelte.js';

export class FutureStateDecorator extends FutureState {

	/** @protected */
	store;

	constructor(store) {
		super();

		this.store = store;
	}

	get value() {
		return this.store.value;
	}

	get valueOrUndefined() {
		return this.store.valueOrUndefined;
	}

	get loading() {
		return this.store.loading;
	}

	get loaded() {
		return this.store.loaded;
	}

	get refreshing() {
		return this.store.refreshing;
	}

	get error() {
		return this.store.error;
	}

	clear() {
		this.store.clear();
	}

	load() {
		return this.store.load();
	}

	refresh(clear) {
		return this.store.refresh(clear);
	}

	mount() {
		return this.store.mount();
	}

}
