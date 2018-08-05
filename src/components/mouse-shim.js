/* global AFRAME */
/**
 * A component shim the mouse move event for the AFRAME cursor raycaster.
 * @namespace aframe-material-collection
 * @component ui-mouse-shim
 * @author Shane Harris
 */
module.exports = AFRAME.registerComponent('ui-mouse-shim', {
    init(){
        if (!this.el.components.raycaster) {
            throw 'ui-mouse-move component needs the raycaster component to be added.'
        }
        // Add support for mouse wheel
        this.el.sceneEl.renderer.domElement.addEventListener( 'mousewheel', this.onMouseWheel.bind(this), false);
    },
    onMouseWheel(e){
        this.emitMouseEvent('ui-mousewheel',e);
    },
    tick() {
       this.emitMouseEvent('ui-mousemove');
    },
    emitMouseEvent(eventType,event){
        // Get current intersections from raycaster component.
        this.el.components.raycaster.intersections.forEach(intersection=>{
            if(intersection.object.el){
                // Emit custom mouse move event ont he intersected element.
                intersection.object.el.emit(eventType,{cursorEl:this.el,intersection:intersection,evt:event})
            }
        });
    }
});