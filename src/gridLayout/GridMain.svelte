
<script>
    import {onMount, setContext} from 'svelte';
    import {writable} from 'svelte/store';
    import GridItem from './GridItem.svelte';
    import GridLayout from './GridLayout.svelte';
    import TestElement from './TestElement.svelte';
    // import CustomDragElement from './components/CustomDragElement.vue';
    import {getDocumentDir, setDocumentDir} from "./helpers/DOM";
    import TestComp from './TestComp.svelte';



    let testLayout = [
        {"x":0,"y":0,"w":2,"h":2,"i":"0", resizable: true, draggable: true, static: false, minY: 0, maxY: 2},
        {"x":2,"y":0,"w":2,"h":4,"i":"1", resizable: null, draggable: null, static: true},
        {"x":4,"y":0,"w":2,"h":5,"i":"2", resizable: false, draggable: false, static: false, minX: 4, maxX: 4, minW: 2, maxW: 2, preserveAspectRatio: true},
        {"x":6,"y":0,"w":2,"h":3,"i":"3", resizable: false, draggable: false, static: false, preserveAspectRatio: true},
        {"x":8,"y":0,"w":2,"h":3,"i":"4", resizable: false, draggable: false, static: false},
        {"x":10,"y":0,"w":2,"h":3,"i":"5", resizable: false, draggable: false, static: false},
        {"x":0,"y":5,"w":2,"h":5,"i":"6", resizable: false, draggable: false, static: false},
        {"x":2,"y":5,"w":2,"h":5,"i":"7", resizable: false, draggable: false, static: false},
        {"x":4,"y":5,"w":2,"h":5,"i":"8", resizable: false, draggable: false, static: false},
        {"x":6,"y":3,"w":2,"h":4,"i":"9", resizable: false, draggable: false, static: true},
        {"x":8,"y":4,"w":2,"h":4,"i":"10", resizable: false, draggable: false, static: false},
        {"x":10,"y":4,"w":2,"h":4,"i":"11", resizable: false, draggable: false, static: false, minY: 4},
        {"x":0,"y":10,"w":2,"h":5,"i":"12", resizable: false, draggable: false, static: false},
        {"x":2,"y":10,"w":2,"h":5,"i":"13", resizable: false, draggable: false, static: false},
        {"x":4,"y":8,"w":2,"h":4,"i":"14", resizable: false, draggable: false, static: false},
        {"x":6,"y":8,"w":2,"h":4,"i":"15", resizable: false, draggable: false, static: false},
        {"x":8,"y":10,"w":2,"h":5,"i":"16", resizable: false, draggable: false, static: false},
        {"x":10,"y":4,"w":2,"h":2,"i":"17", resizable: false, draggable: false, static: false},
        {"x":0,"y":9,"w":2,"h":3,"i":"18", resizable: false, draggable: false, static: false},
        {"x":2,"y":6,"w":2,"h":2,"i":"19", resizable: false, draggable: false, static: false}
    ];

    const data = writable({
        layout: JSON.parse(JSON.stringify(testLayout)),
        layout2: JSON.parse(JSON.stringify(testLayout)),
        draggable: true,
        resizable: true,
        mirrored: false,
        responsive: true,
        bounded: false,
        transformScale: 1,
        preventCollision: false,
        compact: true,
        restoreOnDrag: true,
        rowHeight: 30,
        colNum: 12,
        index: 0,
        marginX: 10,
        marginY: 10,
    });
    setContext('mainData', data)

    onMount(() => {
        $data.index = $data.layout.length;
    });

    function clicked() {
        window.alert("CLICK!");
    };

    function increaseWidth() {
        let width = document.getElementById("content").offsetWidth;
        width += 20;
        document.getElementById("content").style.width = width+"px";
    };
    function decreaseWidth() {
        let width = document.getElementById("content").offsetWidth;
        width -= 20;
        document.getElementById("content").style.width = width+"px";
    };
    function scaleHalf() {
        $data.transformScale = 0.5
        document.getElementById("grid-layout").style.transform = "scale(0.5)";
    };
    function scaleThreeQuarters() {
        $data.transformScale = 0.75
        document.getElementById("grid-layout").style.transform = "scale(0.75)";
    };
     function scaleIdentity() {
        $data.transformScale = 1
        document.getElementById("grid-layout").style.transform = "scale(1)";
    };
    function removeItem(e) {
        const i = e.detail.payload.text;
        const index = $data.layout.filter(item => item.i != i);
        $data.layout = index;
        // $data.layout.splice(index, 1);
    };
    function addItem() {
        let item = {"x":0,"y":0,"w":2,"h":2,"i":$data.index+"", whatever: "bbb"};
        $data.index++;
        $data.layout.push(item);
    };
    function addItemDynamically() {
        const x = ($data.layout.length * 2) % ($data.colNum || 12);
        const y = $data.layout.length + ($data.colNum || 12);
        console.log("X=" + x + " Y=" + y)
        let item = {
            x: x,
            y: y,
            w: 2,
            h: 2,
            i: $data.index+"",
        }
        $data.index++;
        $data.layout.push(item);
    };
    function move(i, newX, newY){
        console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
    };
    function resize(i, newH, newW, newHPx, newWPx){
        console.log("RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
    };
    function moved(i, newX, newY){
        console.log("### MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
    };
    function resized(i, newH, newW, newHPx, newWPx){
        console.log("### RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
    };
    function containerResized(e) {
        const {i, h: newH, w: newW, height: newHPx, width: newWPx} = e.detail.payload;   
        console.log("### CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
    };
    /**
     * Add change direction button
     */
    function changeDirection() {
        let documentDirection = getDocumentDir();
        let toggle = "";
        if (documentDirection === "rtl") {
            toggle = "ltr"
        } else {
            toggle = "rtl"
        }
        setDocumentDir(toggle);
    };

    function layoutCreatedEvent(event){
        console.log("Created layout: ", event.detail.payload)
    };
    function layoutBeforeMountEvent(event){
        console.log("beforeMount layout: ", event.detail.payload)
    };
    function layoutMountedEvent(event){
        console.log("Mounted layout: ", event.detail.payload)
    };
    function layoutReadyEvent(event){
        console.log("Ready layout: ", event.detail.payload)
    };
    function layoutUpdatedEvent(event){
        console.log("Updated layout: ", event.detail.payload)
    };
    function breakpointChangedEvent(e){
        let {newBreakpoint, layout: newLayout} = e.detail.payload;
        console.log("breakpoint changed breakpoint=", newBreakpoint, ", layout: ", newLayout );
    };

    // window.addEventListener('testEvent', (e) => console.log(e))
    window.addEventListener('layout-created', layoutCreatedEvent);
    window.addEventListener('layout-before-mount', layoutBeforeMountEvent);
    window.addEventListener('layout-mounted', layoutMountedEvent);
    window.addEventListener('layout-ready', layoutReadyEvent);
    window.addEventListener('breakpoint-changed', breakpointChangedEvent);
    window.addEventListener('resize', resize);
    window.addEventListener('move', move);
    window.addEventListener('resized', resized);
    window.addEventListener('layout-created', layoutCreatedEvent);
    window.addEventListener('container-resized', containerResized);
    window.addEventListener('moved', moved);
    window.addEventListener('removeItem', removeItem)
</script>
<!-- <svelte:window 
    on:layout-created={layoutCreatedEvent}
    on:layout-before-mount={layoutBeforeMountEvent}
    on:layout-mounted={layoutMountedEvent}
    on:layout-ready={layoutReadyEvent}
    on:layout-updated={layoutUpdatedEvent}
    on:breakpoint-changed={breakpointChangedEvent}
    on:resize={resize}
    on:move={move}
    on:resized={resized}
    on:container-resized={containerResized}
    on:moved={moved}
/> -->
<TestComp on:msg-defis={(e) => console.log(e)}/>
<div id="appWrapper">
    <h1 style="text-align: center">Vue Grid Layout</h1>
    <div>
        <div class="layoutJSON">
            Displayed as <code>[x, y, w, h]</code>:
            <div class="columns">
                {#each $data.layout as item}
                    <div class="layoutItem" >
                        <b>{item.i}</b>: [{item.x}, {item.y}, {item.w}, {item.h}]
                    </div>
                {/each}

            </div>
        </div>
    </div>
    <div id="content">
        <button on:click={decreaseWidth}>Decrease Width</button>
        <button on:click={increaseWidth}>Increase Width</button>
        <button on:click={scaleHalf}>Scale x0.5</button>
        <button on:click={scaleThreeQuarters}>Scale x0.75</button>
        <button on:click={scaleIdentity}>Scale x1.0</button>
        <button on:click={addItem}>Add an item</button>
        <button on:click={addItemDynamically}>Add an item dynamically</button>
        <!-- Add to show rtl support -->
        <button on:click={changeDirection}>Change Direction</button>
        <input type="checkbox" on:change={(e) => $data.draggable = !$data.draggable}/> Draggable
        <input type="checkbox" on:change={(e) => $data.resizable = !$data.resizable}  /> Resizable
        <input type="checkbox" on:change={(e) => $data.mirrored = !$data.mirrored}    /> Mirrored
        <input type="checkbox" on:change={(e) => $data.bounded = !$data.bounded}  /> Bounded
        <input type="checkbox" on:change={(e) => $data.responsive = !$data.responsive}    /> Responsive
        <input type="checkbox" on:change={(e) => $data.preventCollision = !$data.preventCollision}    /> Prevent Collision
        <input type="checkbox" on:change={(e) => $data.compact = !$data.compact}  /> Vertical Compact
        <div style="margin-top: 10px;margin-bottom: 10px;">
            Row Height: <input type="number" on:change={(e) => $data.rowHeight = e.target.value}/> Col nums: <input type="number" on:change={e => $data.colNum = e.target.value}/>
            Margin x: <input type="number" on:change={(e) => $data.marginX = e.target.value}/> Margin y: <input type="number" on:change={e => $data.marginY = e.target.value}/>
        </div>
        <!-- поле айди прокинул инлайн в самом компоненте grid-layout -->
        <GridLayout
            id="grid-layout"
            margin={[parseInt($data.marginX), parseInt($data.marginY)]}
            layout={$data.layout}
            testLayout.data={$data.layout}
            colNum={parseInt($data.colNum)}
            rowHeight={$data.rowHeight}
            isDraggable={$data.draggable}
            isResizable={$data.resizable}
            isMirrored={$data.mirrored}
            isBounded={$data.bounded}
            preventCollision={$data.preventCollision}
            verticalCompact={$data.compact}
            restoreOnDrag={$data.restoreOnDrag}
            useCssTransforms={true}
            responsive={$data.responsive}
            transformScale={$data.transformScale}
        >
            {#each $data.layout as item}
                <GridItem
                    _static={item.static}
                    x={item.x}
                    y={item.y}
                    w={item.w}
                    h={item.h}
                    i={item.i}
                    minW={item.minW}
                    maxW={item.maxW}
                    minX={item.minX}
                    maxX={item.maxX}
                    minY={item.minY}
                    maxY={item.maxY}
                    preserveAspectRatio={item.preserveAspectRatio}
                    >
                        <TestElement text={item.i} on:removeItem={removeItem}></TestElement>
                </GridItem>
            {/each}
        </GridLayout>
        <hr/>
    </div>
</div>


<style lang="css">
#appWrapper {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /*text-align: center;*/
  color: #2c3e50;
  /*margin-top: 60px;*/
}
</style>
