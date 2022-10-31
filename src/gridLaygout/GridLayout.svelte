<script>
    // import Vue from 'vue';
    import {onDestroy, onMount, tick, createEventDispatcher, } from 'svelte';
    import elementResizeDetectorMaker from "element-resize-detector";
   

    import {bottom, compact, getLayoutItem, moveElement, validateLayout, cloneLayout, getAllCollisions} from '../helpers/utils';
    import {getBreakpointFromWidth, getColsFromBreakpoint, findOrGenerateResponsiveLayout} from "../helpers/responsiveUtils";
    //var eventBus = require('./eventBus');

    // import GridItem from './GridItem.svelte'
    import {addWindowEventListener, removeWindowEventListener} from "../helpers/DOM";
    import App from '../App.svelte';

    const dispatch = createEventDispatcher();
    export let data = {
        item: null,
        autoSize: true,
        colNum: 12,
        rowHeight: 150,
        maxRows: Infinity,
        margin: function () {
            return [10, 10];
        },
        isDraggable: true,
        isResizable: true,
        isMirrored: false,
        isBounded: false,
        useCssTransforms: true,
        verticalCompact: true,
        restoreOnDrag: false,
        layout: true,
        responsive: false,
        responsiveLayouts: function() {
            return {};
        },
        transformScale: 1,
        breakpoints: function(){return{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }},
        cols: function(){return{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }},
        preventCollision: false,
        useStyleCursor: true,
    
        width: null,
        mergedStyle: {},
        lastLayoutLength: 0,
        isDragging: false,
        placeholder: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            i: -1
        },
        layouts: {}, // array to store all layouts from different breakpoints
        lastBreakpoint: null, // store last active breakpoint
        originalLayout: null
    } // store original Layout
    
    $: console.log(this)
    function created () {
        const self = data;

        // Accessible refernces of functions for removing in beforeDestroy
        self.resizeEventHandler = function(eventType, i, x, y, h, w) {
            resizeEvent(eventType, i, x, y, h, w);
        };

        self.dragEventHandler = function(eventType, i, x, y, h, w) {
            dragEvent(eventType, i, x, y, h, w);
        };

        // self._provided.eventBus = new Vue();
        // self.eventBus = self._provided.eventBus;
        // self.eventBus.$on('resizeEvent', self.resizeEventHandler);
        dispatch('resizeEvent', self.resizeEventHandler)
        dispatch('dragEvent', self.dragEventHandler)
        dispatch('layout-created', self.layout)
        
        // self.eventBus.$on('dragEvent', self.dragEventHandler);
        // self.$emit('layout-created', self.layout);
    };
    $: created();

    function beforeMount() {
        dispatch('layout-before-mount', data.layout);
    }
    $: beforeMount();



    onMount(async() => {
        dispatch('layout-mounted', data.layout);
        await tick()
        validateLayout(data.layout);

        data.originalLayout = data.layout;
        const self = data;
        await tick()
        initResponsiveFeatures();

        onWindowResize();


        //self.width = self.$el.offsetWidth;
        addWindowEventListener('resize', onWindowResize);

        compact(self.layout, self.verticalCompact);

        dispatch('layout-updated',self.layout)

        updateHeight();
        await tick()
        data.erd = elementResizeDetectorMaker({
            strategy: "scroll", //<- For ultra performance.
            // See https://github.com/wnr/element-resize-detector/issues/110 about callOnAdd.
            callOnAdd: false,
        });
        data.erd.listenTo(data.item, function () {
            onWindowResize();
        });


    });

    async function width (newval, oldval) {
        const self = data;
        await tick()
            //this.$broadcast("updateWidth", this.width);
        dispatch("updateWidth", data.width);
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
            await tick()
            dispatch('layout-ready', data.layout);
        }
        updateHeight();
    };
    $: width(data.width)

    function layout () {
        layoutUpdate();
    };
    $: layout(), data

    function colNum (val) {
        dispatch("setColNum", val);
    };
    $: colNum(data.colNum);

    function rowHeight() {
        dispatch("setRowHeight", data.rowHeight);
    };
    $: rowHeight(), data.rowHeight;

    function isDraggable() {
        dispatch("setDraggable", data.isDraggable);
    };
    $: isDraggable(), data.isDraggable;

    function isResizable() {
        dispatch("setResizable", data.isResizable);
    };
    $: isResizable(), data.isResizable;

    function isBounded() {
        dispatch("setBounded", data.isBounded);
    };
    $: isBounded(), data.isBounded

    function transformScale() {
        dispatch("setTransformScale", data.transformScale);
    };
    $: transformScale(), data.transformScale;

    function responsive() {
        if (!data.responsive) {
            dispatch('update:layout', data.originalLayout);
            dispatch("setColNum", data.colNum);
        }
        onWindowResize();
    };
    $: responsive(), data.originalLayout, data.colNum;

    function maxRows() {
        dispatch("setMaxRows", data.maxRows);
    };
    $: maxRows(), data.maxRows

    function margin() {
        updateHeight();
    };
    $: margin(), data.mergedStyle;


    function layoutUpdate() {
        if (data.layout !== undefined && data.originalLayout !== null) {
            if (data.layout.length !== data.originalLayout.length) {
                // console.log("### LAYOUT UPDATE!", this.layout.length, this.originalLayout.length);

                let diff = findDifference(data.layout, data.originalLayout);
                if (diff.length > 0){
                    // console.log(diff);
                    if (data.layout.length > data.originalLayout.length) {
                        data.originalLayout = data.originalLayout.concat(diff);
                    } else {
                        data.originalLayout = data.originalLayout.filter(obj => {
                            return !diff.some(obj2 => {
                                return obj.i === obj2.i;
                            });
                        });
                    }
                }

                data.lastLayoutLength = data.layout.length;
                initResponsiveFeatures();
            }
            compact(data.layout, data.verticalCompact);
            dispatch("updateWidth", data.width);
            updateHeight();

            dispatch('layout-updated',data.layout)
        }
    };
    function updateHeight () {
        // data.mergedStyle = {
        //     height: containerHeight()
        // };
    };
    function onWindowResize () {
        if (data !== null && data.item !== null && data.item !== undefined) {
            data.width = data.item.offsetWidth;
        }
        // data.eventBus.$emit("resizeEvent");
        dispatch("resizeEvent")
    };
    function containerHeight () {
        if (!data.autoSize) return;
        // console.log("bottom: " + bottom(this.layout))
        // console.log("rowHeight + margins: " + (this.rowHeight + this.margin[1]) + this.margin[1])
        const containerHeight =  bottom(data.layout) * (data.rowHeight + data.margin[1]) + data.margin[1] + 'px';
        return containerHeight;
    };
    async function dragEvent (eventName, id, x, y, h, w) {
        //console.log(eventName + " id=" + id + ", x=" + x + ", y=" + y);
        let l = getLayoutItem(data.layout, id);
        //GetLayoutItem sometimes returns null object
        if (l === undefined || l === null){
            l = {x:0, y:0}
        }

        if (eventName === "dragstart" && !data.verticalCompact) {
            data.positionsBeforeDrag = data.layout.reduce((result, {i, x, y}) => ({
                ...result,
                [i]: {x, y}
            }), {});
        }

        if (eventName === "dragmove" || eventName === "dragstart") {
            data.placeholder.i = id;
            data.placeholder.x = l.x;
            data.placeholder.y = l.y;
            data.placeholder.w = w;
            data.placeholder.h = h;
            await tick()
            data.isDragging = true;
            //this.$broadcast("updateWidth", this.width);
            data.eventBus.$emit("updateWidth", data.width);
        } else {
            await tick()
            data.isDragging = false;
        }

        // Move the element to the dragged location.
        data.layout = moveElement(data.layout, l, x, y, true, data.preventCollision);

        if (data.restoreOnDrag) {
            // Do not compact items more than in layout before drag
            // Set moved item as static to avoid to compact it
            l.static = true;
            compact(data.layout, data.verticalCompact, data.positionsBeforeDrag);
            l.static = false;
        } else {
            compact(data.layout, data.verticalCompact);
        }

        // needed because vue can't detect changes on array element properties
        // this.eventBus.$emit("compact");
        dispatch("compact")
        updateHeight();
        if (eventName === 'dragend') {
            delete data.positionsBeforeDrag;
            // this.$emit('layout-updated', this.layout);
            dispatch('layout-updated', data.layout)
        }
    };
    async function resizeEvent (eventName, id, x, y, h, w) {
        let l = getLayoutItem(data.layout, id);
        //GetLayoutItem sometimes return null object
        if (l === undefined || l === null){
            l = {h:0, w:0}
        }

        let hasCollisions;
        if (data.preventCollision) {
            const collisions = getAllCollisions(data.layout, { ...l, w, h }).filter(
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
            data.placeholder.i = id;
            data.placeholder.x = x;
            data.placeholder.y = y;
            data.placeholder.w = l.w;
            data.placeholder.h = l.h;
            await tick()
            data.isDragging = true;
            //this.$broadcast("updateWidth", this.width);
            // this.eventBus.$emit("updateWidth", this.width);
            dispatch("updateWidth", data.width)

        } else {
            await tick()
            data.isDragging = false;
        }

        if (data.responsive) responsiveGridLayout();

        compact(data.layout, data.verticalCompact);
        // data.eventBus.$emit("compact");
        dispatch("compact")
        updateHeight();

        if (eventName === 'resizeend') dispatch('layout-updated', data.layout);
    };

    // finds or generates new layouts for set breakpoints
    function responsiveGridLayout(){
        let newBreakpoint = getBreakpointFromWidth(data.breakpoints, data.width);
        let newCols = getColsFromBreakpoint(newBreakpoint, data.cols);

        // save actual layout in layouts
        if(data.lastBreakpoint != null && !data.layouts[data.lastBreakpoint])
            data.layouts[data.lastBreakpoint] = cloneLayout(data.layout);

        // Find or generate a new layout.
        let layout = findOrGenerateResponsiveLayout(
            data.originalLayout,
            data.layouts,
            data.breakpoints,
            newBreakpoint,
            data.lastBreakpoint,
            newCols,
            data.verticalCompact
        );

        // Store the new layout.
        data.layouts[newBreakpoint] = layout;

        if (data.lastBreakpoint !== newBreakpoint) {
            dispatch('breakpoint-changed', newBreakpoint, layout);
        }

        // new prop sync
        dispatch('update:layout', layout);

        data.lastBreakpoint = newBreakpoint;
        dispatch("setColNum", getColsFromBreakpoint(newBreakpoint, data.cols));
    };

    // clear all responsive layouts
    function initResponsiveFeatures(){
        // clear layouts
        data.layouts = Object.assign({}, data.responsiveLayouts);
    };

    // find difference in layouts
    function findDifference(layout, originalLayout){

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
    };
</script>

<div bind:this={data.item} class="vue-grid-layout" >
    <slot></slot>
    <!-- <grid-item class="vue-grid-placeholder"
                v-show="isDragging"
                :x="placeholder.x"
                :y="placeholder.y"
                :w="placeholder.w"
                :h="placeholder.h"
                :i="placeholder.i"></grid-item> -->
</div>

<style>
    .vue-grid-layout {
        position: relative;
        transition: height 200ms ease;
    }
</style>
