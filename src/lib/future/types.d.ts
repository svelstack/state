import { Cursor } from '$lib/future/cursors/types.d.ts';

export type FutureStateExceptionHandler = (error: any) => string;
export type FutureStateOptions = {
	exceptionHandler: FutureStateExceptionHandler;
	indicatorsDelay?: number;
	deepReactivity?: boolean;
};

export abstract class FutureState<TValue = any> {
	/**
	 * The current value of the state.
	 *
	 * @throws UninitializedStateError if the state has not yet loaded or is undefined.
	 */
	abstract readonly value: TValue;

	/** The current value of the state, or `undefined` if not yet loaded. */
	abstract readonly valueOrUndefined: TValue | undefined;

	/** Indicates if the state is currently in the loading process. */
	abstract readonly loading: boolean;

	/** Indicates if the value has successfully loaded and is not undefined. */
	abstract readonly loaded: boolean;

	/** Indicates if the state is currently in the refreshing process. */
	abstract readonly refreshing: boolean;

	/**
	 * Holds an error message if an error occurred during loading or refreshing, otherwise `undefined`.
	 * Errors are safe to display to the user.
	 */
	abstract readonly error: string | undefined;

	protected options: FutureStateOptions;

	constructor(options?: Partial<FutureStateOptions>);

	/**
	 * Clears the current states. Resetting `value`, `error`, and indicators.
	 */
	abstract clear(): void;

	/**
	 * Initiates the loading process to retrieve the state value.
	 * @returns A promise that resolves with the loaded value.
	 */
	abstract load(): Promise<TValue>;

	/**
	 * Refreshes the state. If `clear` is true, the state will be cleared and
	 * loading will start instead of refreshing.
	 *
	 * Default value is `false` if not provided.
	 * @param clear If true, clears the state before starting the loading process.
	 */
	abstract refresh(clear?: boolean): Promise<void>;

	/**
	 * Effect handler, replacing `load()`, `mount()`, and `unmount()` methods in a Svelte component.
	 *
	 * Usage: `$effect(state.effect())`
	 * Usage: `$effect(state.effect(() => mounted))`
	 *
	 * @param conditionFn Optional condition function; if provided, the effect will only execute if this function returns true.
	 * @returns A function that can be called to stop the effect.
	 */
	effect(conditionFn?: () => boolean): () => void;

	/**
	 * Starts listening to subscribers, such as an invoker, and manages state updates in response.
	 * In Svelte components, call the `effect()` method instead.
	 * @returns A function to stop listening to subscribers.
	 */
	abstract mount(): () => void;

	/**
	 * Configures global options for all instances of `FutureState`.
	 * @param options Partial options to set or override default settings.
	 */
	static configure(options: Partial<FutureStateOptions>): void;
}

export class FutureStateMountInternals {

	onMount(fn: () => (() => void) | void): void;

	autoSubscribe(fn: () => (() => void) | void, refreshOnChange = false): void;

	mounted(load?: () => void, refresh?: () => void): () => void;

}

export class FutureStateInternals<T> {
	value: T | undefined;
	loading: boolean;
	loaded: boolean;
	refreshing: boolean;
	error: string | undefined;

	constructor(
		invoker: (() => Promise<T>) | FutureInvoker<T>,
		options: FutureStateOptions,
	);

	raiseError(error: any): void;

	invoke<TRet>(
		invoker: () => Promise<TRet>,
		before?: () => void,
		after?: () => void,
		onValue?: (newValue: TRet, oldValue: TRet) => TRet
	): Promise<TRet | undefined>;
	defaultInvoke(
		before?: () => void,
		after?: () => void,
		onValue?: (newValue: T, oldValue: T) => T
	): Promise<T | undefined>;

	get invoker(): FutureInvoker<T>;
}

export class AsyncableFutureState<TValue = any> extends FutureState<TValue> {
	constructor(
		invoker: (() => Promise<TValue>) | FutureInvoker<TValue>,
		options?: Partial<FutureStateOptions>
	);

	setValue(value: TValue): this;

	protected internals: FutureStateInternals<TValue>;

	/**
	 * Called when the class is constructed.
	 */
	protected constructed(): void;

	// Abstract stuff
	readonly value: TValue;
	readonly valueOrUndefined: TValue | undefined;
	readonly loading: boolean;
	readonly loaded: boolean;
	readonly refreshing: boolean;
	readonly error: string | undefined;

	clear(): void;
	load(): Promise<TValue>;
	refresh(clear?: boolean): Promise<void>;
	effect(conditionFn?: () => boolean): () => void;
	mount(): () => void;
	// End of abstract stuff
}

export class ExtendableFutureState<TValue = any> extends AsyncableFutureState<TValue> {
	constructor(
		invoker: (() => Promise<TValue>) | FutureInvoker<TValue>,
		options?: Partial<FutureStateOptions>
	);

	protected modify(fn: (value: TValue) => TValue): void;
}

export class AppendableFutureState<
	TValue extends any[] = any[],
	TCursor extends Cursor = Cursor,
> extends AsyncableFutureState<TValue> {
	readonly appending: boolean;
	/**
	 * Indicates if the state has finished loading all available values.
	 */
	readonly finished: boolean;
	readonly cursor: TCursor;

	constructor(
		factory: (cursor: TCursor) => Promise<TValue> | FutureInvoker<TValue>,
		cursor: TCursor,
		options?: Partial<FutureStateOptions>
	);

	next(): Promise<TValue | undefined>;
}

export class ComposableFutureState<const TStates extends FutureState[]> extends FutureState<{
	[K in keyof TStates]: TStates[K] extends FutureState<infer U> ? U : never;
}> {
	constructor(states: TStates);

	// Abstract stuff
	readonly value: {
		[K in keyof TStates]: TStates[K] extends FutureState<infer U> ? U : never;
	};
	readonly valueOrUndefined:
		| {
				[K in keyof TStates]: TStates[K] extends FutureState<infer U> ? U : never;
		  }
		| undefined;
	readonly loading: boolean;
	readonly loaded: boolean;
	readonly refreshing: boolean;
	readonly error: string | undefined;

	clear(): void;
	load(): Promise<{
		[K in keyof TStates]: TStates[K] extends FutureState<infer U> ? U : never;
	}>;
	refresh(clear?: boolean): Promise<void>;
	effect(conditionFn?: () => boolean): () => void;
	mount(): () => void;
	// End of abstract stuff
}

export abstract class FutureInvoker<TValue = any> {
	abstract run(): Promise<TValue>;

	abstract subscribe(fn: (invoker: this) => void): () => void;

	protected abstract notify(): void;
}

export abstract class BaseFutureInvoker<TValue = any> extends FutureInvoker<TValue> {
	abstract run(): Promise<TValue>;

	subscribe(fn: (invoker: this) => void): () => void;

	protected notify(): void;
	protected mounted(): void;
	protected unmounted(): void;
}

export class FutureManualInvoker<
	TValue = any,
	const TArgs extends any[] = any[]
> extends BaseFutureInvoker<TValue> {
	constructor(factory: (...args: TArgs) => Promise<TValue>, args: TArgs);

	update(...args: TArgs): void;
}

export class DebouncedFutureInvoker<TValue = any> extends BaseFutureInvoker<TValue> {

	constructor(invoker: (() => Promise<TValue>) | FutureInvoker<TValue>, timeoutInMs: number);

	run(): Promise<TValue>;

	protected mounted(): void;
	protected unmounted(): void;

}

export class FutureRunesInvoker<
	TValue,
	const TArgs extends any[] = any[]
> extends BaseFutureInvoker<TValue> {
	constructor(factory: (...args: TArgs) => Promise<TValue>, deps: () => TArgs);

	run(): Promise<TValue>;
}

export class FuturePlainInvoker<TValue = any> extends FutureInvoker<TValue> {
	constructor(factory: () => Promise<TValue>);

	run(): Promise<TValue>;

	subscribe(fn: (invoker: this) => void): () => void;

	protected notify(): void;
}
