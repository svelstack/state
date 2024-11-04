export abstract class Cursor {

	/**
	 * Resets the cursor to its initial state.
	 */
	abstract reset(): void;

	/**
	 * Checks if the cursor has reached the end of pagination.
	 */
	abstract get finished(): boolean;

	/**
	 * Called before a request is made. Ideal for setting the next cursor.
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

export class PageCursor extends Cursor {

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
export class PredictablePageCursor extends Cursor {

	readonly page: number;

	constructor(page?: number);

	get finished(): boolean;

	beforeRequest(initial = false): void;

	afterRequest(values: any[], initial = false): void;

	reset(): void;

}
