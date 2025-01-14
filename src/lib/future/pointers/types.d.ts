export abstract class Pointer {

	/**
	 * Resets the pointer to its initial state.
	 */
	abstract reset(): void;

	/**
	 * Checks if the pointer has reached the end of pagination.
	 */
	abstract get finished(): boolean;

	/**
	 * Called before a request is made. Ideal for setting the next pointer.
	 *
	 * @internal
	 */
	abstract beforeRequest(initial = false): void;

	/**
	 * Called after a request is made. Ideal for setting the `finished` state.
	 *
	 * @internal
	 */
	abstract afterRequest(values: any[], initial = false): void;

}

export class PagePointer extends Pointer {

	readonly page: number;

	constructor(page?: number);

	get finished(): boolean;

	/**
	 * If `finished` is undefined, the value will be predicted.
	 */
	setNextPage(page?: number, finished?: boolean): void;

	reset(): void;

	beforeRequest(initial = false): void;

	afterRequest(values: any[], initial = false): void;

}

/**
 * This class attempts to predict `finished` based on the length of values of the first page and the next page.
 */
export class PredictablePagePointer extends Pointer {

	readonly page: number;

	constructor(page?: number);

	get finished(): boolean;

	beforeRequest(initial = false): void;

	afterRequest(values: any[], initial = false): void;

	reset(): void;

}
