<script>
  import {getContext, createEventDispatcher } from 'svelte';
  const data = getContext('mainData');
  // const dispatch = createEventDispatcher()


  
  function disp() {
    window.dispatchEvent(
			new CustomEvent("myEve", { detail: {} }),
		)
  };

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
  