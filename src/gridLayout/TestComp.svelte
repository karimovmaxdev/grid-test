<script>
  import {getContext, createEventDispatcher } from 'svelte';
  const data = getContext('mainData');
  const dispatch = createEventDispatcher()
    

</script>
  
<div>
    <button on:click={() => data}>CLICK ME</button>
</div>
  
  <style>
    button {
        pointer-events: all;
        width: 300px;
        height: 50px;
    }
  </style>
  