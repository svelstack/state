import { expect, test } from 'vitest';
import { createFakePromise } from '../utils.js';
import { AppendableFutureState, PagePointer, PredictablePagePointer, UninitializedStateError } from '$lib';

test('appendable default states', () => {
	const future = new AppendableFutureState(
		() => Promise.resolve([]),
		new PagePointer(),
	);

	expect(future.error).toBeUndefined();
	expect(future.loading).toBeFalsy();
	expect(future.loaded).toBeFalsy();
	expect(future.refreshing).toBeFalsy();
	expect(future.finished).toBeFalsy();
	expect(future.pointer.page).toBe(1);
	expect(() => future.value).toThrowError(UninitializedStateError);
	expect(future.valueOrUndefined).toBeUndefined();
});

test('appendable load method with page pointer', async () => {
	let lastPage;
	const promise = createFakePromise();
	const future = new AppendableFutureState((pointer) => {
		lastPage = pointer.page;

		return promise.make();
	}, new PagePointer());

	expect(lastPage).toBeUndefined();

	future.load().then((val) => {
		expect(val).toEqual(['foo']);
	});

	expect(future.loading).toBeTruthy();
	expect(future.refreshing).toBeFalsy();
	expect(future.loaded).toBeFalsy();
	expect(future.appending).toBeFalsy();
	expect(lastPage).toBe(1);

	await promise.resolve(['foo']);

	expect(future.loading).toBeFalsy();
	expect(future.loaded).toBeTruthy();
	expect(future.refreshing).toBeFalsy();
	expect(future.value).toEqual(['foo']);
	expect(lastPage).toBe(1);
	expect(future.finished).toBeFalsy();

	future.next().then((val) => {
		expect(val).toEqual(['foo', 'bar']);
	});

	expect(future.loading).toBeFalsy();
	expect(future.refreshing).toBeFalsy();
	expect(future.appending).toBeTruthy();

	await promise.resolve(['bar']);

	expect(future.appending).toBeFalsy();
	expect(future.finished).toBeFalsy();
	expect(lastPage).toBe(2);
	expect(future.value).toEqual(['foo', 'bar']);

	future.next();

	await promise.resolve([]);

	expect(future.finished).toBeTruthy();
	expect(future.value).toEqual(['foo', 'bar']);
	expect(lastPage).toBe(3);
	expect(future.pointer.page).toBe(2);
});

test('appendable with predictable page pointer', async () => {
	let lastPage;
	const promise = createFakePromise();
	const future = new AppendableFutureState((pointer) => {
		lastPage = pointer.page;

		return promise.make();
	}, new PredictablePagePointer());

	await makeRequests(future, [
		['one', 'two'],
		['three', 'four'],
		[],
	], promise);

	expect(future.value.length).toBe(4);
	expect(lastPage).toBe(3);
	expect(future.pointer.page).toBe(2);
});

test('appendable with predictable page pointer 2', async () => {
	let lastPage;
	const promise = createFakePromise();
	const future = new AppendableFutureState((pointer) => {
		lastPage = pointer.page;

		return promise.make();
	}, new PredictablePagePointer());

	await makeRequests(future, [
		['one', 'two'],
		['three', 'four'],
		['five'],
	], promise);

	expect(future.value.length).toBe(5);
	expect(lastPage).toBe(3);
	expect(future.pointer.page).toBe(3);
	expect(future.finished).toBeTruthy();
});

test('appendable clear method', async () => {
	const promise = createFakePromise();
	const future = new AppendableFutureState(
		() => promise.make(),
		new PagePointer(),
	);

	await makeRequests(future, [
		['foo', 'bar'],
		['foo', 'bar'],
		[],
	], promise);

	expect(future.finished).toBeTruthy();
	expect(future.pointer.page).toBe(2);

	future.clear();

	expect(future.pointer.page).toBe(1);
	expect(future.finished).toBeFalsy();
});

test('appendable refresh method', async () => {
	const promise = createFakePromise();
	const future = new AppendableFutureState(
		() => promise.make(),
		new PagePointer(),
	);

	await makeRequests(future, [
		['foo', 'bar'],
		['foo', 'bar'],
		[],
	], promise);

	expect(future.finished).toBeTruthy();
	expect(future.pointer.page).toBe(2);

	future.refresh();

	await promise.resolve(['new']);

	expect(future.value).toEqual(['new']);
	expect(future.pointer.page).toBe(1);
	expect(future.finished).toBeFalsy();
});

test('page pointer with empty response', async () => {
	const promise = createFakePromise();
	const future = new AppendableFutureState(
		() => promise.make(),
		new PagePointer(),
	);

	await makeRequests(future, [
		[],
	], promise);

	expect(future.loaded).toBeTruthy();
	expect(future.finished).toBeTruthy();
	expect(future.pointer.page).toBe(1);
});

test('predictable page pointer with empty response', async () => {
	const promise = createFakePromise();
	const future = new AppendableFutureState(
		() => promise.make(),
		new PredictablePagePointer(),
	);

	await makeRequests(future, [
		[],
	], promise);

	expect(future.loaded).toBeTruthy();
	expect(future.finished).toBeTruthy();
	expect(future.pointer.page).toBe(1);
});

test('pointer page setNextPage()', async () => {
	const future = new AppendableFutureState(
		(pointer) => {
			pointer.setNextPage(pointer.page + 10, pointer.page > 30);

			return Promise.resolve(['foo']);
		},
		new PagePointer(),
	);

	await future.next();

	expect(future.pointer.page).toBe(1);
	expect(future.finished).toBeFalsy();

	await future.next();

	expect(future.pointer.page).toBe(11);
	expect(future.finished).toBeFalsy();

	await future.next();

	expect(future.pointer.page).toBe(21);
	expect(future.finished).toBeFalsy();

	await future.next();

	expect(future.pointer.page).toBe(31);
	expect(future.finished).toBeTruthy();
});

async function makeRequests(future, values, promise) {
	let pos = 0;

	for (const value of values) {
		let lastPromise;
		if (pos === 0) {
			lastPromise = future.load();
		} else {
			lastPromise = future.next();
		}

		await promise.resolve(value);
		await lastPromise;

		pos++;
	}
}
