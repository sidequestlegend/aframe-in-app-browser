/* global AFRAME */
/**
 * A address-bar component using a companion app based in electron.
 * @namespace aframe-in-app-browser
 * @component address-bar
 * @author Shane Harris
 */

module.exports = AFRAME.registerComponent('address-bar', {
    schema: {
    },
    init() {
        this.setupAddressTexture();
    },
    setupAddressTexture(){
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 512;
        this.addressTexture = new THREE.Texture(this.canvas);
    },
});