/* global AFRAME,TWEEN,io */
/**
 * A browser component using a companion app based in electron.
 * @namespace aframe-in-app-browser
 * @component browser
 * @author Shane Harris
 */

module.exports = AFRAME.registerComponent('browser', {
    schema: {
        cameraEl:{type:'selector'}
    },
    init(){
        this.isExokit = false;//!!~window.navigator.userAgent.indexOf('Exokit');
        this.open();
        this.setupSurfaceTexture();
        // Set the material texture to the canvas used for images from the browser
        this.el.getObject3D('mesh').material.map = this.surfaceTexture;
        this.el.emit('texture-ready');
        // Store binded handlers for registering/unregistering events.
        this.click = this.mouseEvent.bind(this,'click');
        this.mousemove = this.onMouseMove.bind(this);
        this.mousedown = this.mouseEvent.bind(this,'mousedown');
        this.mouseup = this.mouseEvent.bind(this,'mouseup');
        this.mousewheel = this.mouseEvent.bind(this,'mousewheel');

        this.keyup = this.onKeyup.bind(this);
        this.keydown = this.onKeydown.bind(this);
        this.el.sendMessage = this.sendMessage.bind(this);
        this.camera = this.data.cameraEl;
    },
    play(){
        // Register event listeners for mouse and keyboard.
        this.el.addEventListener( 'ui-mousemove', this.mousemove, false );
        this.el.addEventListener( 'click', this.click, false );
        this.el.addEventListener( 'mousedown', this.mousedown, false );
        this.el.addEventListener( 'mouseup', this.mouseup, false );
        this.el.addEventListener( 'touchstart', this.mousedown, false );
        this.el.addEventListener( 'touchend', this.mouseup, false );
        this.el.addEventListener( 'ui-mousewheel', this.mousewheel, false);
        document.addEventListener('keyup', this.keyup, false);
        document.addEventListener('keydown', this.keydown, false);
    },
    sendMessage(message){
        if(this.isExokit&&this.browserWindow) {

        }else if(!this.is_disconnected){
            this.emit(message);
        }
    },
    pause(){
        // Unregister event listeners for mouse and keyboard.
        this.el.removeEventListener('ui-mousemove',this.mousemove);
        this.el.removeEventListener('click',this.click);
        this.el.removeEventListener('mousedown',this.mousedown);
        this.el.removeEventListener('mouseup',this.mouseup);
        this.el.removeEventListener('touchstart',this.mousedown);
        this.el.removeEventListener('touchend',this.mouseup);
        this.el.removeEventListener( 'ui-mousewheel', this.mousewheel);
        document.removeEventListener('keyup', this.keyup);
        document.removeEventListener('keydown', this.keydown);
    },
    onKeyup(e){
        this.keyEvent('keyup',e);
    },
    onKeydown(e){
        this.keyEvent('keydown',e);
    },
    keyEvent(type,e){
        // Skip key events for modifier keys
        if(~[16,17,18].indexOf(e.which)){
            return e.preventDefault();
        }
        // Setup modifiers array and populate form the key events.
        let modifiers = [];
        if(e.ctrlKey){
            modifiers.push('control');
        }
        if(e.altKey){
            modifiers.push('alt');
        }
        if(e.metaKey){
            modifiers.push('meta');
        }
        if(e.shiftKey&&~[9,33,34,37,38,39,40].indexOf(e.which)){
            modifiers.push('shift');
        }
        if(e.repeat){
            modifiers.push('isAutoRepeat');
        }
        // if(e.key === 'CapsLock'){
        //     modifiers.push('capsLock');
        // }
        // let s = String.fromCharCode( e.which );
        // if ( s.toUpperCase() === s && s.toLowerCase() !== s && !e.shiftKey ) {
        //     alert('caps is on');
        //     modifiers.push('capsLock');
        // }
        if(this.isExokit&&this.browserWindow) {
            this.browserWindow.sendInputEvent({
                type:type,
                keyCode:e.key,
                modifiers:[]//modifiers
            });
            // If is an alphanumeric key then send the char event also to get the text to show up in the input fields
            // Do not send if this is a modified keypress i.e. Ctrl+A, Ctrl+V
            if (e.which <= 90 && e.which >= 48&&type==="keyup"&&!modifiers.length){
                this.browserWindow.sendInputEvent({
                    type:'char',
                    keyCode:e.key
                });
            }
        }else if(!this.is_disconnected){
            this.emit({path:'event',data:{
                    type:type,
                    keyCode:e.key,
                    modifiers:modifiers
                }});
            // If is an alphanumeric key then send the char event also to get the text to show up in the input fields
            // Do not send if this is a modified keypress i.e. Ctrl+A, Ctrl+V
            //e.which <= 90 && e.which >= 48&&
            if (type==="keyup"&&!modifiers.length&&!~[9,20,33,34,37,38,39,40].indexOf(e.which)){
                this.emit({path:'event',data:{
                        type:'char',
                        keyCode:e.key,
                        modifiers:modifiers
                    }});
            }
        }
        e.preventDefault();
    },
    onMouseMove(e){
        // Store the last point of the mouse movement. Mousedown/mouseup events don't appear to update
        // the intersection point from the raycaster.
        // TODO: file a PR with aframe to fix this issue and add mousemove, mousewheel and doubleclick events.
        if(e.detail.intersection){
            this.last_move_point = e.detail.intersection.point.clone();
        }
        this.mouseEvent('mousemove',e);
    },
    mouseEvent(type,e){
        let mouse = {x:0,y:0};
        if(this.last_move_point){
            // Convert the intersection point from world to local coordinates.
            let localPoint = this.el.object3D.worldToLocal(this.last_move_point.clone());
            // console.log(localPoint);
            // Normalise the point in the range of the companion app resolution 1080X640
            mouse = {
                x:((localPoint.x+(this.el.getAttribute('width')/2))/this.el.getAttribute('width'))*1080,
                // Invert the Y coordinate for top down orientation of the browser coordinates.
                y:640-(((localPoint.y+(this.el.getAttribute('height')/2))/this.el.getAttribute('height'))*640)
            };
        }
        // Store the delta for mousewheel events.
        if(type==='mousewheel'&&e.detail.evt){
            mouse.deltaY = e.detail.evt.deltaY;
            mouse.deltaX = e.detail.evt.deltaX;
        }
        // Pause the look controls for mousemove events in betweenmousedown and mouseup
        if(type==='mousedown'&&this.camera&&this.camera.components['look-controls']){
            this.camera.components['look-controls'].pause()
        }
        if(type==='mouseup'&&this.camera&&this.camera.components['look-controls']){
            this.camera.components['look-controls'].play()
        }
        this.sendMouseEvent(type,e,mouse);
    },
    sendMouseEvent(type,e,mouse){
        let _event;
        let _button;
        if(e.detail.evt){
            // Convert the mouse button value to a string for electron webcontents.
            switch(e.detail.evt.button){
                case 0:
                    _button = 'left';
                    break;
                case 1:
                    _button = 'middle';
                    break;
                case 2:
                    _button = 'right';
                    break;
            }
        }
        switch(type){
            case 'mousemove':
            case 'mouseup':
            case 'mousedown':
                // Set minimum options for mouse events.
                _event = {
                    type:type,
                    x:mouse.x,
                    y:mouse.y,
                    button:_button||'left',
                    globalX:mouse.x,
                    globalY:mouse.y,
                    movementX:0,
                    movementY:0,
                    clickCount:1
                };
                break;
            case 'mousewheel':
                // Set minimum options for mousewheel events.
                _event = {
                    type:type,
                    x:mouse.x,
                    y:mouse.y,
                    button:3,
                    globalX:mouse.x,
                    globalY:mouse.y,
                    movementX:0,
                    movementY:0,
                    clickCount:1,
                    deltaX:-mouse.deltaX,
                    deltaY:-mouse.deltaY,
                    wheelTicksX:0,
                    wheelTicksY:0,
                    accelerationRatioX:1,
                    accelerationRatioY:1,
                    hasPreciseScrollingDeltas:true,
                    canScroll:true
                };
                break;
        }
        if(_event&&this.isExokit&&this.browserWindow) {
            this.browserWindow.sendInputEvent(_event);
        }else if(_event&&!this.is_disconnected) {
            // Send the event to electron over the websocket.
            //this.socket.emit('event',_event);
            //console.log(_event);
            this.emit({path:'event',data:_event});
        }
    },
    tick(){
        // console.timeEnd('render');
        // console.time('render');
    },
    open(){
        if(this.isExokit){
            this.setupElectron();
        }else{
            this.is_disconnected = true;
            this.openSocket();
        }
    },
    async setupElectron(){
        const elctrn = await browser.electron.createElectron();
        this.browserWindow = await elctrn.createBrowserWindow({
            width:1024,
            height:512,
            show: false,
            frame: false,
            webPreferences: {
                offscreen: true,
                transparent: true,
            },
        });

        this.canvas.width = this.browserWindow.width;
        this.canvas.height = this.browserWindow.height;
        this.browserWindow.loadURL('https://www.youtube.com/watch?v=JynwitCHP4E');
        this.browserWindow.setFrameRate(30);

        let ctx = this.canvas.getContext('2d');
        this.browserWindow.on('paint', o => {
            // console.time('putImageData');
            // ctx.putImageData(new ImageData(o.data, o.width, o.height), o.x, o.y );
            // console.timeEnd('putImageData');
            // this.surfaceTexture.needsUpdate = true;
            try{
                console.time('putImageData');
                let blob = new Blob([o.data], {type: "image/jpeg"});

                let ctx = this.canvas.getContext('2d');
                // Create an image to show the frame and copy to the canvas
                let img = new Image();
                img.onload = ()=>{
                    // Draw the frame to the temp canvas.
                    ctx.drawImage(img, 0, 0, 1080, 640, 0, 0, 1024, 512);
                    // Set the update flag
                    this.surfaceTexture.needsUpdate = true;
                    console.timeEnd('putImageData');
                };
                // Create url from the image blob
                if(blob.size){
                    img.src = URL.createObjectURL(blob);
                }
            }catch(e){
                console.warn(e);
            }
        });

        this.browserWindow.on('dom-ready', async () => {
            await this.browserWindow.insertCSS(`
                ::-webkit-scrollbar {
                  height: 30px;
                  width: 30px;
                  background: #e0e0e0;
                }
                ::-webkit-scrollbar-thumb {
                  background: #4db6ac;
                }
                ::-webkit-scrollbar-corner {
                  background: #cfcfcf;
                }
        `);
        });
        this.browserWindow.on('did-fail-load', () => {
            console.log('failed to load!');
            // browserWindow.destroy();
            // elctrn.destroy();
        });
    },
    close(){
        this.closeSocket()
    },
    setupSurfaceTexture(){
        // Setup a POT canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 512;
        this.surfaceTexture = new THREE.Texture(this.canvas/*,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter,
            THREE.RGBAFormat,
            THREE.UnsignedByteType,
            1*/);
    },
    openSocket(){
        // Connect to the websocket
        this.url = 'ws://localhost:3443';
        this.openResolves = [];
        this.setupWebsocket();
    },
    constructor(){
        this.setupWebsocket();
    },
    async emit(msg){
        if(!this.is_disconnected){
            this.ws.send(JSON.stringify(msg));
        }

    },
    setupWebsocket(){
        this.ws = new WebSocket(this.url);
        this.ws.onopen = evt=>this.onOpen(evt);
        this.ws.onclose = evt=>this.onClose(evt);
        this.ws.onmessage = evt=>this.onMessage(evt);
        this.ws.onerror = evt=>console.error(evt);
    },
    onOpen(){
        this.openResolves.forEach(fn=>fn());
        console.log('Connected to Expanse Browser');
        //this.emit('state');
        this.is_disconnected = false;
    },
    onClose(evt){
        console.log('Connection to Expanse Browser closed. Reconnecting in 2s ...',evt);
        this.is_disconnected = true;
        setTimeout(()=>this.setupWebsocket(this.url),2000);
    },
    onMessage(evt){
        if(typeof evt.data === "string"){
            try{
                let json = JSON.parse(evt.data);
                this.el.emit('browserMessage',json);
            }catch(e){
                console.warn(e);
            }
        }else{
            try{
                let blob = new Blob([evt.data], {type: "image/jpeg"});

                let ctx = this.canvas.getContext('2d');
                // Create an image to show the frame and copy to the canvas
                let img = new Image();
                img.onload = ()=>{
                    // Draw the frame to the temp canvas.
                    ctx.drawImage(img, 0, 0, 1080, 640, 0, 0, 1024, 512);
                    // Set the update flag
                    this.surfaceTexture.needsUpdate = true;
                };
                // Create url from the image blob
                if(blob.size){
                    img.src = URL.createObjectURL(blob);
                }
            }catch(e){
                console.warn(e);
            }
        }

    },
    closeSocket(){
        // if(this.socket){
        //     // Disconnect and delete the socket.
        //     this.socket.disconnect();
        //     this.is_disconnected = true;
        //     this.socket = null;
        // }
    },
    showDownloadMessage(){
        // TODO: Show message to download companion app.
    }
});