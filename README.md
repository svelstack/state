# The only Svelte Promise/Future states you will need 

```shell
npm i @svelstack/state
```

## FutureState

Base class for all future states.

```typescript
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
```

`AsyncableFutureState` is likely the most frequently used class, and you will use it to create custom future states.
Other classes are provided for more specific use cases.

`AppendableFutureState` allows you to append new values to the existing value.
`ComposableFutureState` is a more advanced class that allows you to compose multiple future states into a single state.
`ExtendableFutureState` allows you to create a future state with custom actions.

### Basic usage

```sveltehtml
<script lang="ts">
	const store = new AsyncableFutureState(() => fetch('...'));
    
	$effect(store.effect());
</script>

{#if store.loading}
    <p>Loading...</p>
{:else if store.error}
    <p>{store.error}</p>
{:else}
    <p>{store.value}</p>
{/if}
```

### Is $effect() calling safe and fast?

Absolutely! Technically speaking, the effect method automatically subscribes to the explicitly defined subscribers, 
tracks state changes, and automatically unsubscribes them.

It's the same as using this:

```typescript
if (!ssrEnabled) {
	const umnount = store.mount();

    // ...

	unmount();
}
```

No side effects!

```sveltehtml

<script lang="ts">
    let id = $state(0);
	const store = new AsyncableFutureState(
		() => fetch(`${id}`) // <--- notice
    );
        
    $effect(store.effect());
</script>
```

This can be like shooting yourself in the foot if not used properly, so side effects are disabled. The method is called only once, no matter how many times the variable `id` changes. If you need to use side effects, read the section `Invokers`.


### Lazy loading

Sometimes you want to load the state only when it's needed. You can use the condition function in the `effect()` method to achieve this.

```sveltehtml
<script lang="ts">
    const mounted = $state(false);
	const store = new AsyncableFutureState(() => fetch('...'));
    
	$effect(store.effect(() => mounted)); // <--- notice
</script>
```
The state will be loaded/refreshed only when `mounted` is `true`.

### Server side rendering

If you want to load a state on the server side, you can use the `setValue(...)` method.

```sveltehtml
<script lang="ts">
	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

    const store = new AsyncableFutureState(() => fetch('...'))
      .setValue(data.valueForStore);
    
    $effect(store.effect());
</script>
```

### Side effects

If you need to use side effects, you can use the `FutureRunesInvoker`

```sveltehtml
<script lang="ts">
    let variableWithoutSideEffect = $state(0);
	let id = $state(1);
	let page = $state(1);
	
    const store = new AsyncableFutureState(new FutureRunesInvoker(
        (id, page) => fetch(`${id}/${page}/${variableWithoutSideEffect}`),
        () => [id, page],
    ));
    $effect(store.effect());
</script>
```

The state will be refreshed every time `id` or `page` changes. The `variableWithoutSideEffect` will not trigger a refresh.

### Deep reactivity

By default, values are not deeply reactive for performance reasons.

```sveltehtml
<script>
	import { AsyncableFutureState } from '$lib';

	let store = new AsyncableFutureState(
		() => Promise.resolve([{ label: 'foo', checked: false }, { label: 'bar', checked: false }])
	);
	$effect(store.effect());
</script>

{#if store.loaded}
	{#each store.value as item}
		<div>
			Checked: {item.checked} <!-- Always false -->
			<input type="checkbox" bind:checked={item.checked}>
			{item.label}
		</div>
	{/each}
{/if}
```

If you want to make them deeply reactive

```sveltehtml
<script>
	import { AsyncableFutureState } from '$lib';

	let store = new AsyncableFutureState(
		() => Promise.resolve([{ label: 'foo', checked: false }, { label: 'bar', checked: false }]),
		{ deepReactivity: true }, // <--- notice
	);
	$effect(store.effect());
</script>

{#if store.loaded}
	{#each store.value as item}
		<div>
			Checked: {item.checked} <!-- Changing -->
			<input type="checkbox" bind:checked={item.checked}>
			{item.label}
		</div>
	{/each}
{/if}
```

### Load everything or nothing

If you have multiple states that need to be loaded before rendering, you can use the `ComposableFutureState` class.

```sveltehtml

<script lang="ts">
	const store = new ComposableFutureState([
        new AsyncableFutureState(() => fetch('...')),
        new AsyncableFutureState(() => fetch('...')),
    ]);
	$effect(store.effect());
</script>

{#if store.loaded}
    <p>{store.value[0]}</p> <!-- First store -->
    <p>{store.value[1]}</p> <!-- Second store -->
{/if}
```

### My API is very fast and I want to avoid flickering

Solution is very simple, look at the example below:

```typescript
const store = new AsyncableFutureState(() => fetch('...'), {
	indicatorsDelay: 300, // <--- notice
});
```

or globally:

```typescript
FutureState.configure({
    indicatorsDelay: 300,
});
```

### I want to display more helpful error messages to the user

You can use the `exceptionHandler` option to handle errors.

```typescript
function myExceptionHandler(error: any) {
	if (error instanceof ClientSafeError) {
		return error.message;
    }

    return 'An error occurred';
}
```

```typescript
const store = new AsyncableFutureState(() => fetch('...'), {
	exceptionHandler: myExceptionHandler,
});
```

or globally:

```typescript
FutureState.configure({
    exceptionHandler: myExceptionHandler,
});
```

### Extending functionality of FutureState

If you need to add custom actions to a state, you can use the `ExtendableFutureState` class. For advanced use cases, you can extend `FutureState` or `AsyncableFutureState` class.

```typescript
class FavoriteArticlesState extends ExtendableFutureState<number[]> {
	
	constructor(
        private articleRepository: ArticleRepository,
    ) {
		super(() => this.articleRepository.getFavoriteArticles());
    }
		
	async toggle(id: number) {
        if (!this.loaded) {
            return;
        }

        if (this.has(id)) {
            await this.articleRepository.removeFromFavourites(id);

            this.remove(id);
        } else {
            await this.articleRepository.addToFavorites(id);

            this.add(id);
        }
    }

	add(id: string) {
		this.modify((favorites) => {
			return [...favorites, id];
		});
	}

	remove(id: string) {
		this.modify((favorites) => {
			const index = favorites.indexOf(id);

			if (index !== -1) {
				favorites.splice(index, 1);
			}

			return [...favorites];
		});
	}

	has(id: string) {
		return this.valueOrUndefined?.includes(id) ?? false;
	}
		
}
```

The `modify()` method is used to update the state value. It runs only if the state is loaded. Always return a new array or object to trigger a state update.

# Best Practices

## Await as component

AwaitAsyncable.svelte
```sveltehtml
<script lang="ts" generics="T extends FutureState">
	import { AppendableFutureState, FutureState } from '@svelstack/state';
	import { type Snippet } from 'svelte';

	interface Props {
		store: T;
		children: Snippet<[ T extends FutureState<infer U> ? U : never ]>;
		indicators?: boolean;
	}

	let { store, children, indicators = true }: Props = $props();

	let appending = $derived(store instanceof AppendableFutureState ? store.appending : false);
</script>

{#if indicators && store.refreshing}
	Refreshing...
{/if}

{#if indicators && store.loading}
	Loading...
{:else if store.loaded}
	{@render children(store.value)}
{:else if store.error}
	{store.error}
{/if}

{#if appending}
	Appending...
{/if}
```

Usage:
    
```sveltehtml
<script lang="ts">
	const store = new AsyncableFutureState(() => fetch('...'));
    
	$effect(store.effect());
</script>

<AwaitAsyncable {store}>
    {store.value}
</AwaitAsyncable>

<!-- or -->

<AwaitAsyncable {store}>
	{#snippet children(item)}
        {item} 
    {/snippet}
</AwaitAsyncable>
```

# Examples

## Search

For search functionality we need to debounce the input value. We can use the `DebouncedFutureInvoker` to achieve this.

```sveltehtml

<script lang="ts">
	let term = $state('');
	let normalizedTerm = $derived(term.trim());

	const debounceTime = 300;
	const invoker = new DebouncedFutureInvoker(new FutureRunesInvoker(
		(term) => fetch(`${ term }`),
		() => [normalizedTerm],
	), debounceTime);
	const store = new AsyncableFutureState(invoker);
    
	$effect(store.effect(() => {
		return normalizedTerm.length > 0; // Send request only when the term is not empty
    }));
</script>

<AwaitAsyncable {store}>
  <!-- Render the results -->
</AwaitAsyncable>
```

## Infinite scroll

For infinite scroll functionality we need to know when the user has reached the bottom of the page. We can use the `IntersectionObserver` to achieve this.

```sveltehtml
<script lang="ts" generics="T extends any[]">
	import type { AppendableFutureState } from '@svelstack/state';
	import { untrack } from 'svelte';

	interface Props {
		store: AppendableFutureState<T>;
		/**
		 * The threshold in pixels from the bottom of the container at which the loadMore event is triggered.
		 */
		threshold?: number;
	}

	let { store, threshold = 400 }: Props = $props();

	let anchor: HTMLElement;

	function loadMore() {
		store.next();
	}

	function observe(threshold: number, anchor: HTMLElement, finished: boolean) {
		return untrack(() => {
			if (finished) return () => {};

			const observer = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			}, {
				root: getScrollParent(anchor.parentElement),
				rootMargin: `${threshold}px`,
				threshold: 0,
			});

			observer.observe(anchor);

			return () => {
				observer.disconnect();
			};
		});
	}

	function getScrollParent(node: Element | null) {
		if (node == null) {
			return null;
		}

		if (node.scrollHeight > node.clientHeight) {
			return node;
		} else {
			return getScrollParent(node.parentElement);
		}
	}

	$effect(() => {
		return observe(threshold, anchor, store.finished);
	});
</script>

<div bind:this={anchor}></div>
```

And the usage:

```sveltehtml
<script lang="ts">
	const store = new AppendableFutureState(
		(cursor) => {
            const data = getData(cursor.page);
			// With CursorPage you can manually set the page and finished state (optional)
            cursor.setNextPage(data.page || cursor.page + 1, data.isLastPage);
          
			return data.values;
        },
		new PageCursor(), // or use new PredictablePageCursor() for better predictability if each page has the same number of items.
	);
	$effect(store.effect());
</script>

<AwaitAsyncable {store}>
    {#each store.value as item}
        <!-- Render the item -->
    {/each}
  
	<InfiniteScroll {store} />
</AwaitAsyncable>
```
