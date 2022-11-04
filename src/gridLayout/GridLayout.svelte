<script>
    // import Vue from 'vue';
    // const elementResizeDetectorMaker = require("element-resize-detector");
    import {setContext, onMount, createEventDispatcher, onDestroy, beforeUpdate, tick, getContext} from 'svelte';
    import {writable} from 'svelte/store';
    import GridItem from './GridItem.svelte';
    
    


    import elementResizeDetectorMaker from 'element-resize-detector';


    import {bottom, compact, getLayoutItem, moveElement, validateLayout, cloneLayout, getAllCollisions, dispatch} from './helpers/utils';
    import {getBreakpointFromWidth, getColsFromBreakpoint, findOrGenerateResponsiveLayout} from "./helpers/responsiveUtils";

    // import GridItem from './GridItem.vue' 
    import {addWindowEventListener, removeWindowEventListener} from "./helpers/DOM";

    // const dispatch = createEventDispatcher()
    const mainData = getContext('mainData')
    $: console.log($mainData.layout)
    export let autoSize = true;
    export let colNum = 12;
    export let rowHeight = 150;
    export let maxRows = Infinity;
    export let margin = function () {
        return [10, 10]
    };
    export let isDraggable = true;
    export let isResizable = true;
    export let isMirrored = false;
    export let isBounded = false;
    export let useCssTransforms = true;
    export let verticalCompact = true;
    export let restoreOnDrag = false;
    export let layout = true;
    export let responsive = false;
    export let responsiveLayouts = function() {
        return {}
    };
    export let transformScale = 1;
    export let breakpoints = function() {return{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }};
    export let cols = function() {return{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }};
    export let preventCollision = false;
    export let useStyleCursor = true;
    export let width = 1920;
    export let mergedStyle = {};
    export let lastLayoutLength = 0;
    export let isDragging = false;
    export let placeholder = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        i: -1
    };
    export let layouts = {}; // array to store all layouts from different breakpoints
    export let lastBreakpoint = null; // store last active breakpoint
    export let originalLayout = null; // store original Layout
    let item = undefined;

    const eventBus = writable(null);
    const layoutData = writable({
        autoSize,
        colNum,
        rowHeight,
        maxRows,
        margin,
        isDraggable,
        isResizable,
        isMirrored,
        isBounded,
        useCssTransforms,
        verticalCompact,
        restoreOnDrag,
        layout,
        responsive,
        responsiveLayouts,
        transformScale,
        breakpoints,
        cols,
        preventCollision,
        useStyleCursor,
        width,
        mergedStyle,
        lastLayoutLength,
        isDragging,
        placeholder,
        layouts,
        lastBreakpoint,
        originalLayout,
        positionsBeforeDrag: undefined,
        item,
        layoutUpdate: function() {
            if ($layoutData.layout !== undefined && this.originalLayout !== null && Array.isArray($layoutData.layout)) {
                if ($layoutData.layout.length !== $layoutData.originalLayout.length) {
                    // console.log("### LAYOUT UPDATE!", this.layout.length, this.originalLayout.length);

                    let diff = $layoutData.findDifference($layoutData.layout, $layoutData.originalLayout);
                    if (diff.length > 0){
                        // console.log(diff);
                        if ($layoutData.layout.length > $layoutData.originalLayout.length) {
                            $layoutData.originalLayout = $layoutData.originalLayout.concat(diff);
                        } else {
                            $layoutData.originalLayout = $layoutData.originalLayout.filter(obj => {
                                return !diff.some(obj2 => {
                                    return obj.i === obj2.i;
                                });
                            });
                        }
                    }

                    $layoutData.lastLayoutLength = $layoutData.layout.length;
                    $layoutData.initResponsiveFeatures();
                }

                compact($layoutData.layout, $layoutData.verticalCompact);
                dispatch("updateWidth", $layoutData.width);
                $layoutData.updateHeight();

                dispatch('layout-updated',$layoutData.layout)
            }
        },
        updateHeight: function () {
            $layoutData.mergedStyle = {
                height: $layoutData.containerHeight()
            };
        },
        onWindowResize: function () {
            if ($layoutData.item !== null && $layoutData.item !== null && $layoutData.item !== undefined) {
                $layoutData.width = $layoutData.item.offsetWidth;
            }
            dispatch("resizeEvent");
        },
        containerHeight: function () {
            if (!$layoutData.autoSize) return;
            // console.log("bottom: " + bottom(this.layout))
            // console.log("rowHeight + margins: " + (this.rowHeight + this.margin[1]) + this.margin[1])
            const containerHeight =  bottom($layoutData.layout) * ($layoutData.rowHeight + $layoutData.margin[1]) + $layoutData.margin[1] + 'px';
            return containerHeight;
        },
        dragEvent: function (eventName, id, x, y, h, w) {
            //console.log(eventName + " id=" + id + ", x=" + x + ", y=" + y);
            let l = getLayoutItem($layoutData.layout, id);
            //GetLayoutItem sometimes returns null object
            if (l === undefined || l === null){
                l = {x:0, y:0}
            }

            if (eventName === "dragstart" && !$layoutData.verticalCompact && Array.isArray($layoutData.layout)) {
                $layoutData.positionsBeforeDrag = $layoutData.layout.reduce((result, {i, x, y}) => ({
                    ...result,
                    [i]: {x, y}
                }), {});
            }

            if (eventName === "dragmove" || eventName === "dragstart") {
                $layoutData.placeholder.i = id;
                $layoutData.placeholder.x = l.x;
                $layoutData.placeholder.y = l.y;
                $layoutData.placeholder.w = w;
                $layoutData.placeholder.h = h;

                $layoutData.isDragging = true;
                //$layoutData.$broadcast("updateWidth", $layoutData.width);
                dispatch("updateWidth", $layoutData.width);
            } else {
                $layoutData.isDragging = false;
            }

            // Move the element to the dragged location.
            $layoutData.layout = moveElement($layoutData.layout, l, x, y, true, $layoutData.preventCollision);

            if ($layoutData.restoreOnDrag) {
                // Do not compact items more than in layout before drag
                // Set moved item as static to avoid to compact it
                l.static = true;
                compact($layoutData.layout, $layoutData.verticalCompact, $layoutData.positionsBeforeDrag);
                l.static = false;
            } else {
                compact($layoutData.layout, $layoutData.verticalCompact);
            }

            // needed because vue can't detect changes on array element properties
            dispatch("compact");
            $layoutData.updateHeight();
            if (eventName === 'dragend') {
                delete $layoutData.positionsBeforeDrag;
                dispatch('layout-updated', $layoutData.layout);
            }
        },
        resizeEvent: function (eventName, id, x, y, h, w) {
            let l = getLayoutItem($layoutData, id);
            //GetLayoutItem sometimes return null object
            if (l === undefined || l === null){
                l = {h:0, w:0}
            }

            let hasCollisions;
            if ($layoutData.preventCollision) {
                const collisions = getAllCollisions($layoutData.layout, { ...l, w, h }).filter(
                    layoutItem => layoutItem.i !== l.i
                );
                hasCollisions = collisions.length > 0;

                // If we're colliding, we need adjust the placeholder.
                if (hasCollisions) {
                    // adjust w && h to maximum allowed space
                    let leastX = Infinity,
                    leastY = Infinity;
                    collisions.forEach(layoutItem => {
                    if (layoutItem.x > l.x) leastX = Math.min(leastX, layoutItem.x);
                    if (layoutItem.y > l.y) leastY = Math.min(leastY, layoutItem.y);
                    });

                    if (Number.isFinite(leastX)) l.w = leastX - l.x;
                    if (Number.isFinite(leastY)) l.h = leastY - l.y;
                }
            }

            if (!hasCollisions) {
                // Set new width and height.
                l.w = w;
                l.h = h;
            }

            if (eventName === "resizestart" || eventName === "resizemove") {
                $layoutData.placeholder.i = id;
                $layoutData.placeholder.x = x;
                $layoutData.placeholder.y = y;
                $layoutData.placeholder.w = l.w;
                $layoutData.placeholder.h = l.h;
                $layoutData.isDragging = true;
                //this.$broadcast("updateWidth", this.width);
                dispatch("updateWidth", $layoutData.width);

            } else {
                $layoutData.isDragging = false;
            }

            if ($layoutData.responsive) $layoutData.responsiveGridLayout();

            compact($layoutData.layout, $layoutData.verticalCompact);
            dispatch("compact");
            $layoutData.updateHeight();

            if (eventName === 'resizeend') dispatch('layout-updated', $layoutData.layout);
        },
        responsiveGridLayout(){
            let newBreakpoint = getBreakpointFromWidth($layoutData.breakpoints(), $layoutData.width);
            let newCols = getColsFromBreakpoint(newBreakpoint, $layoutData.cols());

            // save actual layout in layouts
            if($layoutData.lastBreakpoint != null && !$layoutData.layouts[$layoutData.lastBreakpoint])
                $layoutData.layouts[$layoutData.lastBreakpoint] = cloneLayout($layoutData.layout);

            // Find or generate a new layout.
            let layout = findOrGenerateResponsiveLayout(
                $layoutData.originalLayout,
                $layoutData.layouts,
                $layoutData.breakpoints(),
                newBreakpoint,
                $layoutData.lastBreakpoint,
                newCols,
                $layoutData.verticalCompact
            );
            console.log("$layoutData.originalLayout,- ", $layoutData.originalLayout)
            console.log("$layoutData.layouts,,- ", $layoutData.layouts,)
            console.log("$layoutData.breakpoints(),- ", $layoutData.breakpoints())
            console.log("newBreakpoint, ", newBreakpoint,)
            console.log("$layoutData.lastBreakpoint,", $layoutData.lastBreakpoint,)
            console.log("newCols", newCols,)
            console.log("$layoutData.verticalCompact", $layoutData.verticalCompact,)
            // Store the new layout.
            $layoutData.layouts[newBreakpoint] = layout;

            if ($layoutData.lastBreakpoint !== newBreakpoint) {
                dispatch('breakpoint-changed', {newBreakpoint, layout});
            }

            // new prop sync
            dispatch('update:layout', layout);

            $layoutData.lastBreakpoint = newBreakpoint;
            dispatch("setColNum", getColsFromBreakpoint(newBreakpoint, $layoutData.cols()));
        },
        initResponsiveFeatures(){
            // clear layouts
            $layoutData.layouts = Object.assign({}, $layoutData.responsiveLayouts);
        },
        findDifference(layout, originalLayout){

            //Find values that are in result1 but not in result2
            let uniqueResultOne = layout.filter(function(obj) {
                return !originalLayout.some(function(obj2) {
                    return obj.i === obj2.i;
                });
            });

            //Find values that are in result2 but not in result1
            let uniqueResultTwo = originalLayout.filter(function(obj) {
                return !layout.some(function(obj2) {
                    return obj.i === obj2.i;
                });
            });

            //Combine the two arrays of unique entries#
            return uniqueResultOne.concat(uniqueResultTwo);
        }
    });

    setContext('eventBus', eventBus);
    setContext('layoutData', layoutData);

    // let resizeEventHandler;
    // let dragEventHandler;
    let resizeEventHandler;
    let dragEventHandler;
    onMount(async() => {
        // creation()
        dispatch('layout-before-mount', $layoutData.layout);
        const self = $layoutData;
        self.resizeEvent()
        // Accessible refernces of functions for removing in beforeDestroy
        resizeEventHandler = function (eventType, i, x, y, h, w) {
            self.resizeEvent(eventType, i, x, y, h, w);
        };

        dragEventHandler = function (eventType, i, x, y, h, w) {
            self.dragEvent(eventType, i, x, y, h, w);
        };
        // Эти события создаются в gridItem. переделать в будущем по аналогии с TestComp 
        // проверить чтобы в eventType передалось корректное значение

        // self._provided.eventBus = new Vue();
        // self.eventBus = self._provided.eventBus;
        // self.eventBus.$on('resizeEvent', self.resizeEventHandler);
        // self.eventBus.$on('dragEvent', self.dragEventHandler);
        // self.$emit('layout-created', self.layout);
        dispatch('layout-created', self.layout);
        // /creation() end//


        // mounted во vue
        dispatch('layout-mounted', self.layout);
        // было завернуто в tick
        validateLayout(self.layout);
        self.originalLayout = self.layout;
        // const self = this;
        self.initResponsiveFeatures();

        self.onWindowResize();


        //self.width = self.$el.offsetWidth;
        addWindowEventListener('resize', self.onWindowResize);

        compact(self.layout, self.verticalCompact);

        dispatch('layout-updated',self.layout)

        self.updateHeight();
        // возможно придется раскоментить

        // self.erd = elementResizeDetectorMaker({
        //     strategy: "scroll", //<- For ultra performance.
        //     // See https://github.com/wnr/element-resize-detector/issues/110 about callOnAdd.
        //     callOnAdd: false,
        // });
        // self.erd.listenTo(self.$refs.item, function () {
        //     self.onWindowResize();
        // });

        // /end было завернуто в tick


    });


    onDestroy(() => {
        // this.eventBus.$off('resizeEvent', this.resizeEventHandler);
        // this.eventBus.$off('dragEvent', this.dragEventHandler);
        // this.eventBus.$destroy();
        removeWindowEventListener("resize", $layoutData.onWindowResize);
        if ($layoutData.erd) {
            $layoutData.erd.uninstall($layoutData.item);
        }
    });

    function width_watch (newval, oldval) {
        const self = $layoutData;
        //this.$broadcast("updateWidth", this.width);
        dispatch("updateWidth", self.width);
        if (oldval === null) {
            /*
                If oldval == null is when the width has never been
                set before. That only occurs when mouting is
                finished, and onWindowResize has been called and
                this.width has been changed the first time after it
                got set to null in the constructor. It is now time
                to issue layout-ready events as the GridItems have
                their sizes configured properly.

                The reason for emitting the layout-ready events on
                the next tick is to allow for the newly-emitted
                updateWidth event (above) to have reached the
                children GridItem-s and had their effect, so we're
                sure that they have the final size before we emit
                layout-ready (for this GridLayout) and
                item-layout-ready (for the GridItem-s).

                This way any client event handlers can reliably
                invistigate stable sizes of GridItem-s.
            */
            dispatch('layout-ready', self.layout);
        }
        self.updateHeight();
    };
    $: width_watch(), $layoutData.width;

    function layout_watch () {
        $layoutData.layoutUpdate();
    };
    $: layout_watch(), $layoutData.layout;

    function colNum_watch (val) {
        dispatch("setColNum", val);
    };
    $: colNum_watch($layoutData.colNum), $layoutData.colNum;

    function rowHeight_watch() {
        dispatch("setRowHeight", $layoutData.rowHeight);
    };
    $: rowHeight_watch(), $layoutData.rowHeight;

    function isDraggable_watch() {
        dispatch("setDraggable", $layoutData.isDraggable);
    };
    $: isDraggable_watch(),  $layoutData.isDraggable;

    function isResizable_watch() {
        dispatch("setResizable", $layoutData.isResizable);
    };
    $: isResizable_watch(), $layoutData.isResizable;

    function isBounded_watch() {
        dispatch("setBounded", $layoutData.isBounded);
    };
    $: isBounded_watch(), $layoutData.isBounded;

    function transformScale_watch() {
        dispatch("setTransformScale", $layoutData.transformScale);
    };
    $: transformScale_watch(), $layoutData.transformScale;

    function responsive_watch() {
        if (!$layoutData.responsive) {
            dispatch('update:layout', $layoutData.originalLayout);
            dispatch("setColNum", $layoutData.colNum);
        }
        $layoutData.onWindowResize();
    };
    $: responsive_watch(), $layoutData.responsive;

    function maxRows_watch() {
        dispatch("setMaxRows", $layoutData.maxRows);
    };
    $: maxRows_watch(), $layoutData.maxRows;

    function margin_watch() {
        $layoutData.updateHeight();
    };
    $: margin_watch(), $layoutData.margin;

    window.addEventListener('resizeEvent', resizeEventHandler);
    window.addEventListener('dragEvent', dragEventHandler);

    $: console.log($layoutData.layout)
</script>

<!-- <svelte:window 
on:resizeEvent={resizeEventHandler}
on:dragEvent={dragEventHandler}
/> -->

<div id="grid-layout" bind:this={$layoutData.item} class="vue-grid-layout" >
    <slot/>
    {#if $layoutData.isDragging}
        <GridItem
            x={$layoutData.placeholder.x}
            y={$layoutData.placeholder.y}
            w={$layoutData.placeholder.w}
            h={$layoutData.placeholder.h}
            i={$layoutData.placeholder.i}>
        </GridItem>
    {/if}

</div>

<style>
    .vue-grid-layout {
        position: relative;
        transition: height 200ms ease;
    }
</style>
