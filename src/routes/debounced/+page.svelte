<script>
	import { AsyncableFutureState, DebouncedFutureInvoker, FutureRunesInvoker } from '$lib';

	let mounted = $state(true);
	let value = $state('');
	let called = $state(0);
	let requests = $state(0);
	let validateInEffect = $state(true);
	let slow = $state(false);
	let normalizedValue = $derived(value.trim().toLowerCase());

	function wait(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	let store = new AsyncableFutureState(
		new DebouncedFutureInvoker(
			new FutureRunesInvoker(
				(value) => search(
					() => fetch('https://dummyjson.com/recipes').then(response => response.json()),
					value
				),
				() => [normalizedValue],
			),
			300
		)
	);
	$effect(store.effect(() => {
		if (!mounted) { return false; }
		if (!validateInEffect) { return true; }

		return normalizedValue.length > 0;
	}));

	async function search(fetcher, value) {
		called++;

		if (!value.length) {
			return undefined;
		}

		requests++;

		const recipes = (await fetcher()).recipes;

		if (slow) {
			await wait(500);
		}

		return recipes.filter((recipe) => {
			return recipe.name.toLowerCase().includes(value);
		}).slice(0, 5);
	}
</script>

<button onclick={() => mounted = !mounted}>Mount</button>
<button onclick={() => slow = !slow}>Slow</button>
<button onclick={() => validateInEffect = !validateInEffect}>Validate in $effect</button>

<input type="search" placeholder="Recipe..." bind:value={value}>

<b>Called</b>: {called} <b>Requests</b>: {requests} <b>Mounted</b>: {mounted} <b>Slow</b>: {slow}
<b>Validate in $effect</b>: {validateInEffect}

{#if mounted}
	<div>
		{#if store.loading}
			Loading...
		{:else if store.loaded}
			{#if store.refreshing}
				Refreshing...
			{/if}

			{#if store.value !== null}
				{#each store.value as val}
					<div>
						{val.name}
					</div>
				{:else}
					No results found.
				{/each}
			{/if}
		{:else if store.error}
			{store.error}
		{/if}
	</div>
{/if}
