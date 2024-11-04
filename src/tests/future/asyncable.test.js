import { expect, test } from 'vitest';
import { createFakePromise } from '../utils.js';
import { AsyncableFutureState, FutureManualInvoker, UninitializedStateError } from '$lib';

test('asyncable default states', () => {
	const future = new AsyncableFutureState(() => Promise.resolve('foo'));

	expect(future.error).toBeUndefined();
	expect(future.loading).toBeFalsy();
	expect(future.loaded).toBeFalsy();
	expect(future.refreshing).toBeFalsy();
	expect(() => future.value).toThrowError(UninitializedStateError);
	expect(future.valueOrUndefined).toBeUndefined();
});

test('asyncable load method with manual invoker', async () => {
	const promise = createFakePromise();
	const future = new AsyncableFutureState(() => promise.make());

	future.load().then((val) => {
		expect(val).toBe('foo');
	});

	expect(future.loading).toBeTruthy();
	expect(future.refreshing).toBeFalsy();
	expect(future.loaded).toBeFalsy();

	await promise.resolve('foo');

	expect(future.loading).toBeFalsy();
	expect(future.loaded).toBeTruthy();
	expect(future.refreshing).toBeFalsy();
	expect(future.value).toBe('foo');
});

test('asyncable load method with manual invoker', async () => {
	const promise = createFakePromise();
	const future = new AsyncableFutureState(new FutureManualInvoker(() => promise.make()));

	future.load().then((val) => {
		expect(val).toBe('foo');
	});

	expect(future.loading).toBeTruthy();
	expect(future.refreshing).toBeFalsy();
	expect(future.loaded).toBeFalsy();

	await promise.resolve('foo');

	expect(future.loading).toBeFalsy();
	expect(future.loaded).toBeTruthy();
	expect(future.refreshing).toBeFalsy();
	expect(future.value).toBe('foo');
});

test('asyncable errors', async () => {
	const promise = createFakePromise();
	const future = new AsyncableFutureState(() => promise.make(), {
		exceptionHandler(error) {
			return error.toString();
		}
	});

	expect(future.error).toBeUndefined();

	future.load().then((val) => {
		expect(val).toBeUndefined();
	});

	await promise.reject('foo');

	expect(future.error).toBe('foo');
	expect(future.valueOrUndefined).toBeUndefined();
});

test('asyncable keep old value when error occurred', async () => {
	const promise = createFakePromise();
	const future = new AsyncableFutureState(() => promise.make(), {
		exceptionHandler(error) {
			return error.toString();
		}
	});

	expect(future.error).toBeUndefined();

	future.load();

	await promise.resolve('foo');

	expect(future.loaded).toBeTruthy();
	expect(future.valueOrUndefined).toBe('foo');

	future.refresh();

	expect(future.refreshing).toBeTruthy();

	await promise.reject('bar');

	expect(future.error).toBe('bar');
	expect(future.loaded).toBeTruthy();
	expect(future.valueOrUndefined).toBe('foo');
});

test('asyncable clean error', async () => {
	const promise = createFakePromise();
	const future = new AsyncableFutureState(() => promise.make(), {
		exceptionHandler(error) {
			return error.toString();
		}
	});

	expect(future.error).toBeUndefined();

	future.load();

	await promise.reject('foo');

	expect(future.error).toBe('foo');

	future.refresh();

	await promise.resolve('bar');

	expect(future.error).toBeUndefined();
});
