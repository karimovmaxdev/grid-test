<script>
    // import GridItem from './components/GridItem.vue';
    import GridLayout from './GridLayout.svelte';
    // import ResponsiveGridLayout from './components/ResponsiveGridLayout.vue';
    // import CustomDragElement from './components/CustomDragElement.vue';
    import {getDocumentDir, setDocumentDir} from "../helpers/DOM";
    import {onMount} from 'svelte'
    //var eventBus = require('./eventBus');

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

    /*let testLayout = [
        { x: 0, y: 0, w: 2, h: 2, i: "0" },
        { x: 2, y: 0, w: 2, h: 2, i: "1" },
        { x: 4, y: 0, w: 2, h: 2, i: "2" },
        { x: 6, y: 0, w: 2, h: 2, i: "3" },
        { x: 8, y: 0, w: 2, h: 2, i: "4" },
    ];*/

    let 
        layout = JSON.parse(JSON.stringify(testLayout)),
        layout2 = JSON.parse(JSON.stringify(testLayout)),
        draggable = true,
        resizable = true,
        mirrored = false,
        responsive = true,
        bounded = false,
        transformScale = 1,
        preventCollision = false,
        compact = true,
        restoreOnDrag = true,
        rowHeight = 30,
        colNum = 12,
        index = 0,
        marginX = 10,
        marginY = 10;

    onMount(() => {
        index = layout.length;
    });

    function clicked () {
        window.alert("CLICK!");
    };

    function increaseWidth () {
        let width = document.getElementById("content").offsetWidth;
        width += 20;
        document.getElementById("content").style.width = width+"px";
    };

    function decreaseWidth () {
        let width = document.getElementById("content").offsetWidth;
        width -= 20;
        document.getElementById("content").style.width = width+"px";
    };

    function scaleHalf () {
        transformScale = 0.5
        document.getElementById("grid-layout").style.transform = "scale(0.5)";
    };

    function scaleThreeQuarters () {
        transformScale = 0.75
        document.getElementById("grid-layout").style.transform = "scale(0.75)";
    };

    function scaleIdentity () {
        transformScale = 1
        document.getElementById("grid-layout").style.transform = "scale(1)";
    };

    function removeItem (i) {
        console.log("### REMOVE " + i);
        const index = layout.map(item => item.i).indexOf(i);
        layout.splice(index, 1);
    };

    function addItem () {
        // let self = this;
        //console.log("### LENGTH: " + this.layout.length);
        let item = {"x":0,"y":0,"w":2,"h":2,"i":index+"", whatever: "bbb"};
        index++;
        layout.push(item);
    };

    function addItemDynamically () {
        const x = (layout.length * 2) % (colNum || 12);
        const y = layout.length + (colNum || 12);
        console.log("X=" + x + " Y=" + y)
        let item = {
            x: x,
            y: y,
            w: 2,
            h: 2,
            i: index+"",
        }
        index++;
        layout.push(item);
    };

    function move (i, newX, newY){
        console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
    };

    function resize (i, newH, newW, newHPx, newWPx){
        console.log("RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
    };

    function moved (i, newX, newY){
        console.log("### MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
    };

    function resized (i, newH, newW, newHPx, newWPx){
        console.log("### RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
    };
    function containerResized (i, newH, newW, newHPx, newWPx){
        console.log("### CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
    };

    function changeDirection () {
        let documentDirection = getDocumentDir();
        let toggle = "";
        if (documentDirection === "rtl") {
            toggle = "ltr"
        } else {
            toggle = "rtl"
        }
        setDocumentDir(toggle);
        //eventBus.$emit('directionchange');
    };

    function layoutCreatedEvent (newLayout){
        console.log("Created layout: ", newLayout)
    };
    function layoutBeforeMountEvent (newLayout){
        console.log("beforeMount layout: ", newLayout)
    };
    function layoutMountedEvent (newLayout){
        console.log("Mounted layout: ", newLayout)
    };
    function layoutReadyEvent (newLayout){
        console.log("Ready layout: ", newLayout)
    };
    function layoutUpdatedEvent (newLayout){
        console.log("Updated layout: ", newLayout)
    };
    function breakpointChangedEvent (newBreakpoint, newLayout){
        console.log("breakpoint changed breakpoint=", newBreakpoint, ", layout: ", newLayout );
    };
    

</script>

<div id="app">
    <h1 style="text-align: center">Vue Grid Layout</h1>
    <div>
        <div class="layoutJSON">
            Displayed as [x, y, w, h]:
            <div class="columns">
                {#each layout as item}
                    <div class="layoutItem">
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
        <input type="checkbox" on:input={(e) => draggable = !draggable} /> Draggable
        <input type="checkbox" on:input={(e) => resizable = !resizable } /> Resizable
        <input type="checkbox" on:input={(e) => mirrored = !mirrored} /> Mirrored
        <input type="checkbox" on:input={(e) => bounded = !bounded } /> Bounded
        <input type="checkbox" on:input={(e) => responsive = !responsive } /> Responsive
        <input type="checkbox" on:input={(e) => preventCollision = !preventCollision } /> Prevent Collision
        <input type="checkbox" on:input={(e) => compact = !compact } /> Vertical Compact
        <div style="margin-top: 10px;margin-bottom: 10px;">
            Row Height: <input type="number" on:input={(e) => rowHeight = e.target.value } /> Col nums: <input type="number" on:input={(e) => colNum = e.target.value } />
            Margin x: <input type="number" on:input={(e) => marginX = e.target.value } /> Margin y: <input type="number" on:input={(e) => marginY = e.target.value } />
        </div>
        <GridLayout
            id="grid-layout"
            data.margin={[parseInt(marginX), parseInt(marginY)]}
            data.layout.sync={layout}
            data.colNum={parseInt(colNum)}
            data.rowHeight={rowHeight}
            data.isDraggable={draggable}
            data.isResizable={resizable}
            data.isMirrored={mirrored}
            data.isBounded={bounded}
            data.preventCollision={preventCollision}
            data.verticalCompact={compact}
            data.restoreOnDrag={restoreOnDrag}
            data.useCssTransforms={true}
            data.responsive={responsive}
            data.transformScale={transformScale}
            on:layout-created={layoutCreatedEvent}
            on:layout-before-mount={layoutBeforeMountEvent}
            on:layout-mounted={layoutMountedEvent}
            on:layout-ready={layoutReadyEvent}
            on:layout-updated={layoutUpdatedEvent}
            on:breakpoint-changed={breakpointChangedEvent}
        >
            <!-- <grid-item v-for="item in layout" :key="item.i"
                        :static="item.static"
                        :x="item.x"
                        :y="item.y"
                        :w="item.w"
                        :h="item.h"
                        :i="item.i"
                        :min-w="item.minW"
                        :max-w="item.maxW"
                        :min-x="item.minX"
                        :max-x="item.maxX"
                        :min-y="item.minY"
                        :max-y="item.maxY"
                        :preserve-aspect-ratio="item.preserveAspectRatio"
                        @resize="resize"
                        @move="move"
                        @resized="resized"
                        @container-resized="containerResized"
                        @moved="moved"
            > -->
                <!--<custom-drag-element :text="item.i"></custom-drag-element>-->
                <!-- <test-element :text="item.i" @removeItem="removeItem($event)"></test-element> -->
                <!--<button @click="clicked">CLICK ME!</button>-->
            <!-- </grid-item> -->
        </GridLayout>
        <hr/>
        <!--<grid-layout
                :layout="layout2"
                :col-num="12"
                :row-height="rowHeight"
                :is-draggable="draggable"
                :is-resizable="resizable"
                :vertical-compact="true"
                :use-css-transforms="true"
        >
            <grid-item v-for="item in layout2" :key="item.i"
                        :x="item.x"
                        :y="item.y"
                        :w="item.w"
                        :h="item.h"
                        :min-w="2"
                        :min-h="2"
                        :i="item.i"
                        :is-draggable="item.draggable"
                        :is-resizable="item.resizable"
            >
                <test-element :text="item.i"></test-element>
            </grid-item>
        </grid-layout>-->
    </div>
</div>

<style lang="css">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /*text-align: center;*/
  color: #2c3e50;
  /*margin-top: 60px;*/
}
</style>
