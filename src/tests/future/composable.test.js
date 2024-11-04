import { expect, test } from 'vitest';
import { createFakePromise } from '../utils.js';
import { AsyncableFutureState, ComposableFutureState } from '$lib';

test('composable states', async () => {
	const promiseForFirst = createFakePromise();
	const promiseForSecond = createFakePromise();

	const first = new AsyncableFutureState(() => promiseForFirst.make());
	const second = new AsyncableFutureState(() => promiseForSecond.make());
	const composable = new ComposableFutureState([first, second]);

	expect(composable.loading).toBeFalsy();
	expect(composable.loaded).toBeFalsy();
	expect(composable.refreshing).toBeFalsy();

	(async () => {
		const values = await composable.load();

		expect(values).toEqual(['first', 'second']);
	})();

	expect(composable.loading).toBeTruthy();
	expect(composable.refreshing).toBeFalsy();

	await promiseForFirst.resolve('first');

	expect(composable.loading).toBeTruthy();
	expect(composable.loaded).toBeFalsy();
	expect(composable.refreshing).toBeFalsy();

	expect(first.loading).toBeFalsy();
	expect(first.loaded).toBeTruthy();

	expect(second.loading).toBeTruthy();
	expect(second.loaded).toBeFalsy();

	await promiseForSecond.resolve('second');

	expect(composable.loading).toBeFalsy();
	expect(composable.loaded).toBeTruthy();
	expect(composable.refreshing).toBeFalsy();
	expect(composable.value).toEqual(['first', 'second']);

	expect(promiseForFirst.made).toBe(1);
	expect(promiseForSecond.made).toBe(1);
});

test('composable errors', async () => {
	const promiseForFirst = createFakePromise();
	const promiseForSecond = createFakePromise();

	const options = {
		exceptionHandler(error) {
			return error.toString();
		}
	};

	const first = new AsyncableFutureState(() => promiseForFirst.make(), options);
	const second = new AsyncableFutureState(() => promiseForSecond.make(), options);
	const composable = new ComposableFutureState([first, second]);

	expect(composable.error).toBeUndefined();

	composable.load();

	await promiseForFirst.reject('first');
	await promiseForSecond.resolve('second');

	expect(composable.loaded).toBeFalsy();
	expect(composable.valueOrUndefined).toBeUndefined();
	expect(composable.error).toBe('first');
});
