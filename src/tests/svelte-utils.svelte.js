export async function effectRootAsync(fn) {
	let promise;

	const cleanup = $effect.root(() => {
		promise = fn();
	});

	const promiseCleanup = await promise;

	cleanup();

	if (promiseCleanup) {
		promiseCleanup();
	}
}
