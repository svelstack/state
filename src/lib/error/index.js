export class UninitializedStateError extends Error {
	constructor(message = 'The state has not been initialized yet.') {
		super(message);
	}
}
