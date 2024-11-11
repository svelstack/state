import { FutureStateInternals, UninitializedStateError } from '$lib';
import { FutureState } from './abstract.svelte.js';

export class AsyncableFutureState extends FutureState {
	constructor(invoker, options) {
		super(options);

		this.internals = new FutureStateInternals(invoker, this.options);
		this.internals.onMount(() => {
			if (this.internals.isFirstRequest) {
				this.load();
			}
		});
		this.internals.onExternalChange(this.refresh.bind(this));

		this.constructed();
	}

	setValue(value) {
		this.internals.value = value;

		return this;
	}

	constructed() {}

	get value() {
		if (this.internals.value === undefined) {
			throw new UninitializedStateError();
		}

		return this.internals.value;
	}

	get valueOrUndefined() {
		return this.internals.value;
	}

	get loading() {
		return this.internals.loading;
	}

	get loaded() {
		return this.internals.loaded;
	}

	get refreshing() {
		return this.internals.refreshing;
	}

	get error() {
		return this.internals.error;
	}

	load() {
		if (!this.internals.isFirstRequest) {
			return this.value;
		}

		return this.internals.defaultInvoke();
	}

	clear() {
		this.internals.clear();
	}

	refresh(clear) {
		if (clear === true) {
			this.clear();
		}

		if (this.internals.isFirstRequest) {
			return this.load();
		}

		return this.internals.defaultInvoke();
	}

	mount() {
		if ($effect.tracking()) {
			throw new Error(
				'mount() method should not be called inside a reactive statement. Use effect() method instead.'
			);
		}

		return this.internals.mounted();
	}
}
