

<script>
    import {setTopLeft, setTopRight, setTransformRtl, setTransform, dispatch} from './helpers/utils';
    import {getControlPosition, createCoreData} from './helpers/draggableUtils';
    import {getColsFromBreakpoint} from './helpers/responsiveUtils';
    import {getDocumentDir} from "./helpers/DOM";
    import {setContext, getContext, onMount, createEventDispatcher, onDestroy, beforeUpdate, tick} from 'svelte';


    import '@interactjs/auto-start'
    import '@interactjs/auto-scroll'
    import '@interactjs/actions/drag'
    import '@interactjs/actions/resize'
    import '@interactjs/modifiers'
    import '@interactjs/dev-tools'
    import interact from '@interactjs/interact';

    const layoutData = getContext('layoutData');
    const layout = $layoutData

    export let isDraggable = null;
    export let isResizable = null;
    export let isBounded = null;
    export let _static = false;
    export let minX;
    export let maxX = Infinity;
    export let minY;
    export let maxY = Infinity;
    export let minH = 1;
    export let minW = 1; 
    export let maxH =  Infinity;
    export let maxW = Infinity;
    export let x;
    export let y;
    export let w;
    export let h;
    export let i;
    export let dragIgnoreFrom = 'a, button';
    export let dragAllowFrom = null;
    export let resizeIgnoreFrom = 'a, button';
    export let preserveAspectRatio = false;
    export let dragOption = () => {};
    export let resizeOption = () => {};

    const itemData = {
        layout,
        isDraggable,
        isResizable,
        isBounded,
        _static,
        minX,
        maxX,
        minY,
        maxY,
        minH,
        minW, 
        maxH,
        maxW,
        x,
        y,
        w,
        h,
        i,
        dragIgnoreFrom,
        dragAllowFrom,
        resizeIgnoreFrom,
        preserveAspectRatio,
        cols: 1,
        containerWidth: 100,
        rowHeight: 30,
        margin: [10, 10],
        maxRows: Infinity,
        draggable: null,
        resizable: null,
        transformScale: 1,
        useCssTransforms: true,
        useStyleCursor: true,

        isDragging: false,
        dragging: null,
        isResizing: false,
        resizing: null,
        lastX: NaN,
        lastY: NaN,
        lastW: NaN,
        lastH: NaN,
        style: {},
        rtl: false,

        dragEventSet: false,
        resizeEventSet: false,

        previousW: null,
        previousH: null,
        previousX: null,
        previousY: null,
        innerX: x,
        innerY: y,
        innerW: w,
        innerH: h,
        dragOption,
        resizeOption,
        createStyle: function () {
            if (itemData.x + itemData.w > itemData.cols) {
                itemData.innerX = 0;
                itemData.innerW = (itemData.w > itemData.cols) ? itemData.cols : itemData.w
            } else {
                itemData.innerX = itemData.x;
                itemData.innerW = itemData.w;
            }
            let pos = itemData.calcPosition(itemData.innerX, itemData.innerY, itemData.innerW, itemData.innerH);


            if (itemData.isDragging) {
                pos.top = itemData.dragging.top;

                if (itemData.renderRtl) {
                    pos.right = itemData.dragging.left;
                } else {
                    pos.left = itemData.dragging.left;
                }
            }
            if (itemData.isResizing) {
                pos.width = itemData.resizing.width;
                pos.height = itemData.resizing.height;
            }

            let style;
            // CSS Transforms support (default)
            if (itemData.useCssTransforms) {

                if (itemData.renderRtl) {
                    style = setTransformRtl(pos.top, pos.right, pos.width, pos.height);
                } else {
                    style = setTransform(pos.top, pos.left, pos.width, pos.height);
                }

            } else { // top,left (slow)

                if (itemData.renderRtl) {
                    style = setTopRight(pos.top, pos.right, pos.width, pos.height);
                } else {
                    style = setTopLeft(pos.top, pos.left, pos.width, pos.height);
                }
            }
            itemData.style = style;
        },
        emitContainerResized() {
            // this.style has width and height with trailing 'px'. The
            // resized event is without them
            let styleProps = {};
            for (let prop of ['width', 'height']) {
                let val = itemData.style[prop];
                let matches = val.match(/^(\d+)px$/);
                if (! matches)
                    return;
                styleProps[prop] = matches[1];
            }
            dispatch("container-resized", {i: itemData.i, h: itemData.h, w: itemData.w, height: styleProps.height, width: styleProps.width});
        },
        handleResize: function (event) {
            if (itemData._static) return;
            const position = getControlPosition(event);
            // Get the current drag point from the event. This is used as the offset.
            if (position == null) return; // not possible but satisfies flow
            const {x, y} = position;

            const newSize = {width: 0, height: 0};
            let pos;
            switch (event.type) {
                case "resizestart": {
                    itemData.tryMakeResizable()
                    itemData.previousW = itemData.innerW;
                    itemData.previousH = itemData.innerH;
                    pos = itemData.calcPosition(itemData.innerX, itemData.innerY, itemData.innerW, itemData.innerH);
                    newSize.width = pos.width;
                    newSize.height = pos.height;
                    itemData.resizing = newSize;
                    itemData.isResizing = true;
                    break;
                }
                case "resizemove": {
                    const coreEvent = createCoreData(itemData.lastW, itemData.lastH, x, y);
                    if (itemData.renderRtl) {
                        newSize.width = itemData.resizing.width - coreEvent.deltaX / itemData.transformScale;
                    } else {
                        newSize.width = itemData.resizing.width + coreEvent.deltaX / itemData.transformScale;
                    }
                    newSize.height = itemData.resizing.height + coreEvent.deltaY / itemData.transformScale;

                    ///console.log("### resize => " + event.type + ", deltaX=" + coreEvent.deltaX + ", deltaY=" + coreEvent.deltaY);
                    itemData.resizing = newSize;
                    break;
                }
                case "resizeend": {
                    //console.log("### resize end => x=" +this.innerX + " y=" + this.innerY + " w=" + this.innerW + " h=" + this.innerH);
                    pos = itemData.calcPosition(itemData.innerX, itemData.innerY, itemData.innerW, itemData.innerH);
                    newSize.width = pos.width;
                    newSize.height = pos.height;
                    itemData.resizing = null;
                    itemData.isResizing = false;
                    break;
                }
            }

            // Get new WH
            pos = itemData.calcWH(newSize.height, newSize.width);
            if (pos.w < itemData.minW) {
                pos.w = itemData.minW;
            }
            if (pos.w > itemData.maxW) {
                pos.w = itemData.maxW;
            }
            if (pos.h < itemData.minH) {
                pos.h = itemData.minH;
            }
            if (pos.h > itemData.maxH) {
                pos.h = itemData.maxH;
            }

            if (pos.h < 1) {
                pos.h = 1;
            }
            if (pos.w < 1) {
                pos.w = 1;
            }

            itemData.lastW = x;
            itemData.lastH = y;

            if (itemData.innerW !== pos.w || itemData.innerH !== pos.h) {
                dispatch("resize", {i:itemData.i, h:pos.h, w:pos.w, heigth:newSize.height, width:newSize.width});
            }
            if (event.type === "resizeend" && (itemData.previousW !== itemData.innerW || itemData.previousH !== itemData.innerH)) {
                dispatch("resized",  {i: itemData.i, h: pos.h, w: pos.w, heigth: newSize.height, width: newSize.width});
            }
            dispatch("resizeEvent", {type: event.type, i: itemData.i, innerX: itemData.innerX, innerY: itemData.innerY, h: pos.h, w: pos.w});
        },
        handleDrag(event) {
            if (itemData._static) return;
            if (itemData.isResizing) return;

            const position = getControlPosition(event);

            // Get the current drag point from the event. This is used as the offset.
            if (position === null) return; // not possible but satisfies flow
            const {x, y} = position;

            // let shouldUpdate = false;
            let newPosition = {top: 0, left: 0};
            switch (event.type) {
                case "dragstart": {
                    itemData.previousX = itemData.innerX;
                    itemData.previousY = itemData.innerY;

                    let parentRect = event.target.offsetParent.getBoundingClientRect();
                    let clientRect = event.target.getBoundingClientRect();

                    const cLeft = clientRect.left / itemData.transformScale;
                    const pLeft = parentRect.left / itemData.transformScale;
                    const cRight = clientRect.right / itemData.transformScale;
                    const pRight = parentRect.right / itemData.transformScale;
                    const cTop = clientRect.top / itemData.transformScale;
                    const pTop = parentRect.top / itemData.transformScale;

                    if (itemData.renderRtl) {
                        newPosition.left = (cRight - pRight) * -1;
                    } else {
                        newPosition.left = cLeft - pLeft;
                    }
                    newPosition.top = cTop - pTop;
                    itemData.dragging = newPosition;
                    itemData.isDragging = true;
                    break;
                }
                case "dragend": {
                    if (!itemData.isDragging) return;
                    let parentRect = event.target.offsetParent.getBoundingClientRect();
                    let clientRect = event.target.getBoundingClientRect();

                    const cLeft = clientRect.left / itemData.transformScale;
                    const pLeft = parentRect.left / itemData.transformScale;
                    const cRight = clientRect.right / itemData.transformScale;
                    const pRight = parentRect.right / itemData.transformScale;
                    const cTop = clientRect.top / itemData.transformScale;
                    const pTop = parentRect.top / itemData.transformScale;

                    if (itemData.renderRtl) {
                        newPosition.left = (cRight - pRight) * -1;
                    } else {
                        newPosition.left = cLeft - pLeft;
                    }
                    newPosition.top = cTop - pTop;
                    itemData.dragging = null;
                    itemData.isDragging = false;
                    // shouldUpdate = true;
                    break;
                }
                case "dragmove": {
                    const coreEvent = createCoreData(itemData.lastX, itemData.lastY, x, y);
                    if (itemData.renderRtl) {
                        newPosition.left = itemData.dragging.left - coreEvent.deltaX / itemData.transformScale;
                    } else {
                        newPosition.left = itemData.dragging.left + coreEvent.deltaX / itemData.transformScale;
                    }
                    newPosition.top = itemData.dragging.top + coreEvent.deltaY / itemData.transformScale;
                    if(itemData.bounded){
                        const bottomBoundary = event.target.offsetParent.clientHeight - itemData.calcGridItemWHPx(itemData.h, itemData.rowHeight, itemData.margin[1]);
                        newPosition.top = itemData.clamp(newPosition.top, 0, bottomBoundary);
                        const colWidth = itemData.calcColWidth();
                        const rightBoundary = itemData.containerWidth - itemData.calcGridItemWHPx(itemData.w, colWidth, itemData.margin[0]);
                        newPosition.left = itemData.clamp(newPosition.left, 0, rightBoundary);
                    }
                    itemData.dragging = newPosition;
                    break;
                }
            }

            // Get new XY
            let pos;
            if (itemData.renderRtl) {
                pos = itemData.calcXY(newPosition.top, newPosition.left);
            } else {
                pos = itemData.calcXY(newPosition.top, newPosition.left);
            }

            itemData.lastX = x;
            itemData.lastY = y;

            if (itemData.innerX !== pos.x || itemData.innerY !== pos.y) {
                dispatch("move", { i: itemData.i, x: pos.x, y: pos.y});
            }
            if (event.type === "dragend" && (itemData.previousX !== itemData.innerX || itemData.previousY !== itemData.innerY)) {
                dispatch("moved", {i: itemData.i, x: pos.x, y: pos.y});
            }
            // eventBuss ??? подумать
            // this.eventBus.$emit("dragEvent", event.type, itemData.i, pos.x, pos.y, itemData.innerH, itemData.innerW);
            dispatch("dragEvent", {type: event.type, i: itemData.i, x: pos.x, y: pos.y, innerH: itemData.innerH, innerW: itemData.innerW});

        },
        calcPosition: function (x, y, w, h) {
            const colWidth = itemData.calcColWidth();
            // add rtl support
            let out;
            if (itemData.renderRtl) {
                out = {
                    right: Math.round(colWidth * x + (x + 1) * itemData.margin[0]),
                    top: Math.round(itemData.rowHeight * y + (y + 1) * itemData.margin[1]),
                    // 0 * Infinity === NaN, which causes problems with resize constriants;
                    // Fix this if it occurs.
                    // Note we do it here rather than later because Math.round(Infinity) causes deopt
                    width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * itemData.margin[0]),
                    height: h === Infinity ? h : Math.round(itemData.rowHeight * h + Math.max(0, h - 1) * itemData.margin[1])
                };
            } else {
                out = {
                    left: Math.round(colWidth * x + (x + 1) * itemData.margin[0]),
                    top: Math.round(itemData.rowHeight * y + (y + 1) * itemData.margin[1]),
                    // 0 * Infinity === NaN, which causes problems with resize constriants;
                    // Fix this if it occurs.
                    // Note we do it here rather than later because Math.round(Infinity) causes deopt
                    width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * itemData.margin[0]),
                    height: h === Infinity ? h : Math.round(itemData.rowHeight * h + Math.max(0, h - 1) * itemData.margin[1])
                };
            }


            return out;
        },
        calcXY(top, left) {
            const colWidth = itemData.calcColWidth();
            let x = Math.round((left - itemData.margin[0]) / (colWidth + itemData.margin[0]));
            let y = Math.round((top - itemData.margin[1]) / (itemData.rowHeight + itemData.margin[1]));

            // Capping
            x = Math.max(Math.min(x, itemData.cols - itemData.innerW), 0);
            y = Math.max(Math.min(y, itemData.maxRows - itemData.innerH), 0);

            return {x, y};
        },
        calcColWidth() {
            const colWidth = (itemData.containerWidth - (itemData.margin[0] * (itemData.cols + 1))) / itemData.cols;
            return colWidth;
        },
        calcGridItemWHPx(gridUnits,colOrRowSize,marginPx) {
            // 0 * Infinity === NaN, which causes problems with resize contraints
            if (!Number.isFinite(gridUnits)) return gridUnits;
            return Math.round(
                colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx
            );
        },
        clamp(num, lowerBound, upperBound) {
            return Math.max(Math.min(num, upperBound), lowerBound);
        },
        calcWH(height, width, autoSizeFlag = false) {
            const colWidth = itemData.calcColWidth();

            // width = colWidth * w - (margin * (w - 1))
            // ...
            // w = (width + margin) / (colWidth + margin)
            let w = Math.round((width + itemData.margin[0]) / (colWidth + itemData.margin[0]));
            let h = 0;
            if (!autoSizeFlag) {
                h = Math.round((height + itemData.margin[1]) / (itemData.rowHeight + itemData.margin[1]));
            } else {
                h = Math.ceil((height + itemData.margin[1]) / (itemData.rowHeight + itemData.margin[1]));
            }

            // Capping
            w = Math.max(Math.min(w, itemData.cols - itemData.innerX), 0);
            h = Math.max(Math.min(h, itemData.maxRows - itemData.innerY), 0);
            return {w, h};
        },
        updateWidth: function (width, colNum) {
            itemData.containerWidth = width;
            if (colNum !== undefined && colNum !== null) {
                itemData.cols = colNum;
            }
        },
        compact: function () {
            itemData.createStyle();
        },
        tryMakeDraggable: function(){
            const self = itemData;
            if(itemData.item === undefined) return
            if (itemData.interactObj === null || itemData.interactObj === undefined) {
                console.log(itemData.item)
                itemData.interactObj = interact(itemData.item);
                if (!itemData.useStyleCursor) {
                    itemData.interactObj.styleCursor(false);
                }
            }
            if (itemData.draggable && !itemData._static) {
                const opts = {
                    ignoreFrom: itemData.dragIgnoreFrom,
                    allowFrom: itemData.dragAllowFrom,
                    ...itemData.dragOption
                };
                itemData.interactObj.draggable(opts);
                /*itemData.interactObj.draggable({allowFrom: '.vue-draggable-handle'});*/
                if (!itemData.dragEventSet) {
                    itemData.dragEventSet = true;
                    itemData.interactObj.on('dragstart dragmove dragend', function (event) {
                        self.handleDrag(event);
                    });
                }
            } else {
                itemData.interactObj.draggable({
                    enabled: false
                });
            }
        },
        tryMakeResizable: function(){
            if(itemData.item === undefined) return
            const self = itemData;
            if (itemData.interactObj === null || itemData.interactObj === undefined) {
                itemData.interactObj = interact(itemData.item);
                if (!itemData.useStyleCursor) {
                    itemData.interactObj.styleCursor(false);
                }
            }
            if (itemData.resizable && !itemData._static) {
                let maximum = itemData.calcPosition(0,0, itemData.maxW, itemData.maxH);
                let minimum = itemData.calcPosition(0,0, itemData.minW, itemData.minH);

                // console.log("### MAX " + JSON.stringify(maximum));
                // console.log("### MIN " + JSON.stringify(minimum));

                const opts = {
                    // allowFrom: "." + this.resizableHandleClass.trim().replace(" ", "."),
                    edges: {
                        left: false,
                        right: "." + itemData.resizableHandleClass().trim().replace(" ", "."),
                        bottom: "." + itemData.resizableHandleClass().trim().replace(" ", "."),
                        top: false
                    },
                    ignoreFrom: itemData.resizeIgnoreFrom,
                    restrictSize: {
                        min: {
                            height: minimum.height * itemData.transformScale,
                            width: minimum.width * itemData.transformScale
                        },
                        max: {
                            height: maximum.height * itemData.transformScale,
                            width: maximum.width * itemData.transformScale
                        }
                    },
                    ...itemData.resizeOption,
                };

                if (itemData.preserveAspectRatio) {
                    opts.modifiers = [
                        interact.modifiers.aspectRatio({
                            ratio: 'preserve'
                        }),
                    ]
                }

                itemData.interactObj.resizable(opts);
                if (!itemData.resizeEventSet) {
                    itemData.resizeEventSet = true;
                    itemData.interactObj
                        .on('resizestart resizemove resizeend', function (event) {
                            self.handleResize(event);
                        });
                }
            } else {
                itemData.interactObj.resizable({
                    enabled: false
                });
            }
        },
        autoSize: function() {
            // ok here we want to calculate if a resize is needed
            itemData.previousW = itemData.innerW;
            itemData.previousH = itemData.innerH;

            let newSize=itemData.item.getBoundingClientRect();
            let pos = itemData.calcWH(newSize.height, newSize.width, true);
            if (pos.w < itemData.minW) {
                pos.w = itemData.minW;
            }
            if (pos.w > itemData.maxW) {
                pos.w = itemData.maxW;
            }
            if (pos.h < itemData.minH) {
                pos.h = itemData.minH;
            }
            if (pos.h > itemData.maxH) {
                pos.h = itemData.maxH;
            }

            if (pos.h < 1) {
                pos.h = 1;
            }
            if (pos.w < 1) {
                pos.w = 1;
            }

            // this.lastW = x; // basically, this is copied from resizehandler, but shouldn't be needed
            // this.lastH = y;

            if (itemData.innerW !== pos.w || itemData.innerH !== pos.h) {
                dispatch("resize",  {i: itemData.i, h: pos.h, w: pos.w, heigth: newSize.height, width: newSize.width});
            }
            if (itemData.previousW !== pos.w || itemData.previousH !== pos.h) {
                dispatch("resized",  {i: itemData.i, h: pos.h, w: pos.w, height: newSize.height, width: newSize.width});
                // this.eventBus.$emit("resizeEvent", "resizeend", this.i, this.innerX, this.innerY, pos.h, pos.w);
                dispatch("resizeEvent", {type:"resizeend", i: itemData.i, innerX: itemData.innerX, innerY: itemData.innerY, h: pos.h, w: pos.w});
            }
        },

        // computed
        classObj: function() {
            let classNames = []
            itemData.resizableAndNotStatic() ? classNames.push('vue-resizable') : null;
            itemData._static ? classNames.push('static') : null;
            itemData.isResizing ? classNames.push('resizing') : null;
            itemData.isDragging ? classNames.push('vue-draggable-dragging') : null;
            itemData.useCssTransforms ? classNames.push('cssTransforms') : null;
            itemData.renderRtl() ? classNames.push('render-rtl') : null;
            itemData.isDragging ? classNames.push('nulldisable-userselect') : null;
            itemData.isAndroid && itemData.draggableOrResizableAndNotStatic ? classNames.push('no-touch') : null;

            return classNames.join('')

                // return {
                //     'vue-resizable': itemData.resizableAndNotStatic,
                //     'static': itemData._static,
                //     'resizing' : itemData.isResizing,
                //     'vue-draggable-dragging' : itemData.isDragging,
                //     'cssTransforms' : itemData.useCssTransforms,
                //     'render-rtl' : itemData.renderRtl,
                //     'disable-userselect': itemData.isDragging,
                //     'no-touch': itemData.isAndroid && itemData.draggableOrResizableAndNotStatic
                // }
            },
        resizableAndNotStatic: function(){
            return itemData.resizable && !itemData._static;
        },
        draggableOrResizableAndNotStatic: function(){
            return (itemData.draggable || itemData.resizable) && !itemData._static;
        },
        isAndroid: function() {
            return navigator.userAgent.toLowerCase().indexOf("android") !== -1;
        },
        renderRtl: function() {
            return (itemData.layout.isMirrored) ? !itemData.rtl : itemData.rtl;
        },
        resizableHandleClass: function() {
            if (itemData.renderRtl) {
                return 'vue-resizable-handle vue-rtl-resizable-handle';
            } else {
                return 'vue-resizable-handle';
            }
        }
    };

    onMount(() => {
        let self = itemData;

        // Accessible refernces of functions for removing in beforeDestroy
        self.updateWidthHandler = function (width) {
            self.updateWidth(width);
        };

        self.compactHandler = function (layout) {
            self.compact(layout);
        };

        self.setDraggableHandler = function (isDraggable) {
            if (self.isDraggable === null) {
                self.draggable = isDraggable;
            }
        };

        self.setResizableHandler = function (isResizable) {
            if (self.isResizable === null) {
                self.resizable = isResizable;
            }
        };

        self.setBoundedHandler = function (isBounded) {
            if (self.isBounded === null) {
                self.bounded = isBounded;
            }
        };

        self.setTransformScaleHandler = function (transformScale) {
            self.transformScale = transformScale
        };

        self.setRowHeightHandler = function (rowHeight) {
            self.rowHeight = rowHeight;
        };

        self.setMaxRowsHandler = function (maxRows) {
            self.maxRows = maxRows;
        };

        self.directionchangeHandler = () => {
            itemData.rtl = getDocumentDir() === 'rtl';
            itemData.compact();
        };

        self.setColNum = (colNum) => {
            self.cols = parseInt(colNum);
        }

        // this.eventBus.$on('updateWidth', self.updateWidthHandler);
        // this.eventBus.$on('compact', self.compactHandler);
        // this.eventBus.$on('setDraggable', self.setDraggableHandler);
        // this.eventBus.$on('setResizable', self.setResizableHandler);
        // this.eventBus.$on('setBounded', self.setBoundedHandler);
        // this.eventBus.$on('setTransformScale', self.setTransformScaleHandler)
        // this.eventBus.$on('setRowHeight', self.setRowHeightHandler);
        // this.eventBus.$on('setMaxRows', self.setMaxRowsHandler);
        // this.eventBus.$on('directionchange', self.directionchangeHandler);
        // this.eventBus.$on('setColNum', self.setColNum)

        itemData.rtl = getDocumentDir() === 'rtl';



        // mounted ////
        if (itemData.layout.responsive && itemData.layout.lastBreakpoint) {
                itemData.cols = getColsFromBreakpoint(itemData.layout.lastBreakpoint, itemData.layout.cols);
            } else {
                itemData.cols = itemData.layout.colNum;
            }
            itemData.rowHeight = itemData.layout.rowHeight;
            itemData.containerWidth = itemData.layout.width !== null ? itemData.layout.width : 100;
            itemData.margin = itemData.layout.margin !== undefined ? itemData.layout.margin : [10, 10];
            itemData.maxRows = itemData.layout.maxRows;

            if (itemData.isDraggable === null) {
                itemData.draggable = itemData.layout.isDraggable;
            } else {
                itemData.draggable = itemData.isDraggable;
            }
            if (itemData.isResizable === null) {
                itemData.resizable = itemData.layout.isResizable;
            } else {
                itemData.resizable = itemData.isResizable;
            }
            if (itemData.isBounded === null) {
                itemData.bounded = itemData.layout.isBounded;
            } else {
                itemData.bounded = itemData.isBounded;
            }
            itemData.transformScale = itemData.layout.transformScale
            itemData.useCssTransforms = itemData.layout.useCssTransforms;
            itemData.useStyleCursor = itemData.layout.useStyleCursor;
            itemData.createStyle();
    })

    onDestroy(() => {
        let self = itemData;
            //Remove listeners
            // this.eventBus.$off('updateWidth', self.updateWidthHandler);
            // this.eventBus.$off('compact', self.compactHandler);
            // this.eventBus.$off('setDraggable', self.setDraggableHandler);
            // this.eventBus.$off('setResizable', self.setResizableHandler);
            // this.eventBus.$off('setBounded', self.setBoundedHandler);
            // this.eventBus.$off('setTransformScale', self.setTransformScaleHandler)
            // this.eventBus.$off('setRowHeight', self.setRowHeightHandler);
            // this.eventBus.$off('setMaxRows', self.setMaxRowsHandler);
            // this.eventBus.$off('directionchange', self.directionchangeHandler);
            // this.eventBus.$off('setColNum', self.setColNum);
            if (itemData.interactObj) {
                itemData.interactObj.unset() // destroy interact intance
            }
    });

    function isDraggable_watch () {
        itemData.draggable = itemData.isDraggable;
    };
    $: isDraggable_watch(), itemData.isDraggable;

    function _static_watch () {
        itemData.tryMakeDraggable();
        itemData.tryMakeResizable();
    };
    $: _static_watch(), itemData._static;

    function draggable_watch () {
        itemData.tryMakeDraggable();
    };
    $: draggable_watch(), itemData.draggable;

    function isResizable_watch () {
        itemData.resizable = itemData.isResizable;
    };
    $: isResizable_watch(), itemData.isResizable;

    function isBounded_watch () {
        itemData.bounded = itemData.isBounded;
    };
    $: isBounded_watch(), itemData.isBounded;

    function resizable_watch () {
        itemData.tryMakeResizable();
    };
    $: resizable_watch(), itemData.resizable;

    function rowHeight_watch () {
        itemData.createStyle();
        itemData.emitContainerResized();
    };
    $: rowHeight_watch(), itemData.rowHeight;

    function cols_watch () {
        itemData.tryMakeResizable();
        itemData.createStyle();
        itemData.emitContainerResized();
    };
    $: cols_watch(), itemData.cols, itemData.item;

    function containerWidth_watch () {
        itemData.tryMakeResizable();
        itemData.createStyle();
        itemData.emitContainerResized();
    };
    $: containerWidth_watch(), itemData.containerWidth;

    function x_watch (newVal) {
        itemData.innerX = newVal;
        itemData.createStyle();
    };
    x_watch(itemData.x), itemData.x;

    function y_watch (newVal) {
        itemData.innerY = newVal;
        itemData.createStyle();
    };
    $: y_watch(itemData.y), itemData.y;

    function h_watch (newVal) {
        itemData.innerH = newVal
        itemData.createStyle();
        // this.emitContainerResized();
    };
    $:h_watch(itemData.h), itemData.h;

    function w_watch(newVal) {
        itemData.innerW = newVal;
        itemData.createStyle();
        // this.emitContainerResized();
    };
    $: w_watch(itemData.w), itemData.w;

    function renderRtl_watch () {
        // console.log("### renderRtl");
        itemData.tryMakeResizable();
        itemData.createStyle();
    };
    $: renderRtl_watch(), itemData.renderRtl;

    function minH_watch () {
        itemData.tryMakeResizable();
    };
    $: minH_watch(), itemData.minH;

    function maxH_watch() {
        itemData.tryMakeResizable();
    };
    $: maxH_watch(), itemData.maxH;

    function minW_watch() {
        itemData.tryMakeResizable();
    };
    $: minW_watch(), itemData.minW;

    function maxW_watch() {
        itemData.tryMakeResizable();
    };
    $: maxW_watch(), itemData.maxW;

    // "$parent.margin": function (margin) {
    //     if (!margin || (margin[0] == this.margin[0] && margin[1] == this.margin[1])) {
    //         return;
    //     }
    //     this.margin = margin.map(m => Number(m));
    //     this.createStyle();
    //     this.emitContainerResized();
    // }
    window.addEventListener('resizupdateWidtheEvent', itemData.updateWidthHandler);
    window.addEventListener('compact', itemData.compactHandler);
    window.addEventListener('setDraggable', itemData.setDraggableHandler);
    window.addEventListener('setResizable', itemData.setResizableHandler);
    window.addEventListener('setBounded', itemData.setBoundedHandler);
    window.addEventListener('setTransformScale', itemData.setTransformScaleHandler);
    window.addEventListener('setRowHeight', itemData.setRowHeightHandler);
    window.addEventListener('resizeEvent', itemData.setMaxRowsHandler);
    window.addEventListener('directionchange', itemData.directionchangeHandler);
    window.addEventListener('directionchange', itemData.setColNum);
    
</script>

<!-- <svelte:window
    on:updateWidth={itemData.updateWidthHandler}
    on:compact={itemData.compactHandler}
    on:setDraggable={itemData.setDraggableHandler}
    on:setResizable={itemData.setResizableHandler}
    on:setBounded={itemData.setBoundedHandler}
    on:setTransformScale={itemData.setTransformScaleHandler}
    on:setRowHeight={itemData.setRsetMaxRowsowHeightHandler}
    on:setMaxRows={itemData.setMaxRowsHandler}
    on:directionchange={itemData.directionchangeHandler}
    on:directionchange={itemData.setColNum}
/> -->
<div 
    bind:this={itemData.item}
    class={"vue-grid-item" + ' ' + 'vue-grid-placeholder' + ' ' + itemData.classObj()}
    >
    <!-- :style="style" -->
    <slot></slot>
    <!-- <span v-if="resizableAndNotStatic" ref="handle" :class="resizableHandleClass"></span> -->
</div>


<style>
    .vue-grid-item {
        transition: all 200ms ease;
        transition-property: left, top, right;
        /* add right for rtl */
        width: 100px;
        height: 100px;
        background-color: red;
    }

    .vue-grid-item.no-touch {
        -ms-touch-action: none;
        touch-action: none;
    }

    .vue-grid-item.cssTransforms {
        transition-property: transform;
        left: 0;
        right: auto;
    }

    .vue-grid-item.cssTransforms.render-rtl {
        left: auto;
        right: 0;
    }

    .vue-grid-item.resizing {
        opacity: 0.6;
        z-index: 3;
    }

    .vue-grid-item.vue-draggable-dragging {
        transition:none;
        z-index: 3;
    }

    .vue-grid-item.vue-grid-placeholder {
        background: red;
        opacity: 0.2;
        transition-duration: 100ms;
        z-index: 2;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -o-user-select: none;
        user-select: none;
    }

    .vue-grid-item > .vue-resizable-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        bottom: 0;
        right: 0;
        background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');
        background-position: bottom right;
        padding: 0 3px 3px 0;
        background-repeat: no-repeat;
        background-origin: content-box;
        box-sizing: border-box;
        cursor: se-resize;
    }

    .vue-grid-item > .vue-rtl-resizable-handle {
        bottom: 0;
        left: 0;
        background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAuMDAwMDAwMDAwMDAwMDAyIiBoZWlnaHQ9IjEwLjAwMDAwMDAwMDAwMDAwMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDwhLS0gQ3JlYXRlZCB3aXRoIE1ldGhvZCBEcmF3IC0gaHR0cDovL2dpdGh1Yi5jb20vZHVvcGl4ZWwvTWV0aG9kLURyYXcvIC0tPgogPGc+CiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPgogIDxyZWN0IGZpbGw9Im5vbmUiIGlkPSJjYW52YXNfYmFja2dyb3VuZCIgaGVpZ2h0PSIxMiIgd2lkdGg9IjEyIiB5PSItMSIgeD0iLTEiLz4KICA8ZyBkaXNwbGF5PSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgeT0iMCIgeD0iMCIgaGVpZ2h0PSIxMDAlIiB3aWR0aD0iMTAwJSIgaWQ9ImNhbnZhc0dyaWQiPgogICA8cmVjdCBmaWxsPSJ1cmwoI2dyaWRwYXR0ZXJuKSIgc3Ryb2tlLXdpZHRoPSIwIiB5PSIwIiB4PSIwIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+CiAgPC9nPgogPC9nPgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxsaW5lIGNhbnZhcz0iI2ZmZmZmZiIgY2FudmFzLW9wYWNpdHk9IjEiIHN0cm9rZS1saW5lY2FwPSJ1bmRlZmluZWQiIHN0cm9rZS1saW5lam9pbj0idW5kZWZpbmVkIiBpZD0ic3ZnXzEiIHkyPSItNzAuMTc4NDA3IiB4Mj0iMTI0LjQ2NDE3NSIgeTE9Ii0zOC4zOTI3MzciIHgxPSIxNDQuODIxMjg5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIi8+CiAgPGxpbmUgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z181IiB5Mj0iOS4xMDY5NTciIHgyPSIwLjk0NzI0NyIgeTE9Ii0wLjAxODEyOCIgeDE9IjAuOTQ3MjQ3IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICA8bGluZSBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z183IiB5Mj0iOSIgeDI9IjEwLjA3MzUyOSIgeTE9IjkiIHgxPSItMC42NTU2NCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiM2NjY2NjYiIGZpbGw9Im5vbmUiLz4KIDwvZz4KPC9zdmc+);
        background-position: bottom left;
        padding-left: 3px;
        background-repeat: no-repeat;
        background-origin: content-box;
        cursor: sw-resize;
        right: auto;
    }

    .vue-grid-item.disable-userselect {
        user-select: none;
    }
</style>