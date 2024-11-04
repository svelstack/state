<script>
	import { AsyncableFutureState } from '$lib';

	let store = new AsyncableFutureState(() => new Promise(resolve => {
		setTimeout(() => {
			resolve('Hello, world!');
		}, 500);
	}));

	$effect(store.effect());
</script>

{#if store.loading}
	Loading...
{:else if store.loaded}
	{store.value}
{:else if store.error}
	{store.error}
{/if}
