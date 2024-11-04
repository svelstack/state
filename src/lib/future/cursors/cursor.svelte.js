export class Cursor {

	constructor() {
		if (new.target === Cursor) {
			throw new Error('Cannot instantiate abstract class');
		}
	}

}

export class PageCursor extends Cursor {

	#next;
	#page;
	#firstPage;
	#finished = $state(false);

	constructor(page) {
		super();

		this.#firstPage = this.#page = page ?? 1;
	}

	reset() {
		this.#page = this.#firstPage;
		this.#finished = false;
		this.#next = undefined;
	}

	setNextPage(page, finished) {
		this.#next = [page, finished];
	}

	get page() {
		return this.#page;
	}

	get finished() {
		return this.#finished;
	}

	beforeRequest(initial = false) {
		if (initial) {
			return;
		}

		if (this.#next !== undefined) {
			const [page] = this.#next;

			this.#next = undefined;

			if (page !== undefined) {
				this.#page = page;

				return;
			}
		}

		this.#page++;
	}

	afterRequest(values, initial = false) {
		if (initial) {
			this.#finished = values.length === 0;

			return;
		}

		if (this.#next !== undefined) {
			const [,finished] = this.#next;

			if (typeof finished === 'boolean') {
				this.#finished = finished;

				return;
			}
		}

		this.#finished = values.length === 0;

		if (this.#finished) {
			this.#page--;
		}
	}

}

export class PredictablePageCursor extends Cursor {

	#previous;
	#firstPage;
	#page;
	#finished = $state(false);

	constructor(page) {
		super();

		this.#firstPage = this.#page = page ?? 1;
	}

	reset() {
		this.#page = this.#firstPage;
		this.#finished = false;
	}

	get page() {
		return this.#page;
	}

	get finished() {
		return this.#finished;
	}

	beforeRequest(initial = false) {
		if (!initial) {
			this.#page++;
		}
	}

	afterRequest(values, initial = false) {
		const length = values.length;

		if (initial) {
			this.#previous = length;
			this.#finished = length === 0;

			return;
		}

		this.#finished = length !== this.#previous;

		if (this.#finished && length === 0) {
			this.#page--;
		}
	}

}
