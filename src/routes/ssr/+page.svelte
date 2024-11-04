<script>
	import { AsyncableFutureState } from '$lib';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	let store = new AsyncableFutureState(() => new Promise(resolve => {
		console.log('Fetching data...');

		setTimeout(() => {
			resolve('Hello, world!');
		}, 500);
	}))
		.setValue(data.value);

	$effect(store.effect());
</script>

{#if store.refreshing}
	Refreshing...
{/if}

{#if store.loading}
	Loading...
{:else if store.loaded}
	{store.value}
{:else if store.error}
	{store.error}
{/if}

<button type="button" onclick={() => store.refresh()}>Refresh</button>
