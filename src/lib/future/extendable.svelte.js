import { AsyncableFutureState } from './asyncable.svelte.js';

export class ExtendableFutureState extends AsyncableFutureState {
	modify(fn) {
		const value = this.valueOrUndefined;

		if (value === undefined) {
			return;
		}

		this.internals.value = fn(value);
	}
}
