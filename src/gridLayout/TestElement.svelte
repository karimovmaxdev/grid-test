<script>
    import {onMount, createEventDispatcher} from 'svelte';
    import {dispatch} from './helpers/utils';

    export let text = 'x';


    onMount(() => {
        console.log("### " + text + " ready!");
    })

</script>

<div>
    <span class="text">
        {text}
    </span>
    <span class="remove" 
        on:click={() => {
        dispatch('removeItem', {text})
        }}>
        x
    </span>
</div>

<style>
    .remove {
        position: absolute;
        right: 2px;
        top: 0;
        cursor: pointer;
    }
</style>