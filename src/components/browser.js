/* global AFRAME,TWEEN,io */
/**
 * A browser component using a companion app based in electron.
 * @namespace aframe-in-app-browser
 * @component browser
 * @author Shane Harris
 */

module.exports = AFRAME.registerComponent('browser', {
    schema: {
    },
    init(){
        this.open();
        this.setupSurfaceTexture();
        // Set the material texture to the canvas used for images from the browser
        this.el.getObject3D('mesh').material.map = this.surfaceTexture;
        // Store binded handlers for registering/unregistering events.
        this.mousemove = this.onMouseMove.bind(this);
        this.mousedown = this.onMouseDown.bind(this);
        this.mouseup = this.onMouseUp.bind(this);
        this.dblclick = this.onDoubleClick.bind(this);
        this.mousewheel = this.onMouseWheel.bind(this);

        this.keyup = this.onKeyup.bind(this);
        this.keydown = this.onKeydown.bind(this);

        this.camera = document.getElementById('camera');
    },
    play(){
        // Register event listeners for mouse and keyboard.
        this.el.addEventListener( 'ui-mousemove', this.mousemove, false );
        this.el.addEventListener( 'mousedown', this.mousedown, false );
        this.el.addEventListener( 'mouseup', this.mouseup, false );
        this.el.addEventListener( 'touchstart', this.mousedown, false );
        this.el.addEventListener( 'touchend', this.mouseup, false );
        this.el.addEventListener( 'dblclick', this.dblclick, false);
        this.el.addEventListener( 'ui-mousewheel', this.mousewheel, false);
        document.addEventListener('keyup', this.keyup, false);
        document.addEventListener('keydown', this.keydown, false);
    },
    pause(){
        // Unregister event listeners for mouse and keyboard.
        this.el.removeEventListener('ui-mousemove',this.mousemove);
        this.el.removeEventListener('mousedown',this.mousedown);
        this.el.removeEventListener('mouseup',this.mouseup);
        this.el.removeEventListener('touchstart',this.mousedown);
        this.el.removeEventListener('touchend',this.mouseup);
        this.el.removeEventListener( 'dblclick', this.dblclick);
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
        if(e.shiftKey){
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
        if(this.socket){
            this.socket.emit('event',{
                type:type,
                keyCode:e.key,
                modifiers:modifiers
            });
            // If is an alphanumeric key then send the char event also to get the text to show up in the input fields
            // Do not send if this is a modified keypress i.e. Ctrl+A, Ctrl+V
            if (e.which <= 90 && e.which >= 48&&type==="keyup"&&!modifiers.length){
                this.socket.emit('event',{
                    type:'char',
                    keyCode:e.key,
                    //modifiers:modifiers
                });
            }
        }
    },
    onMouseMove(e){
        // Store the last point of the mouse movement. Mousedown/mouseup events don't appear to update
        // the intersection point from the raycaster.
        // TODO: file a PR with aframe to fix this issue and add mousemove, mousewheel and doubleclick events.
        if(e.detail.intersection){
            this.last_move_point = e.detail.intersection.point;
        }
        //Throttle the mouse move events to only fire every 50 ms.
        if(new Date().getTime()-this.lastMoveTime<50)return;
        this.mouseEvent('mousemove',e);
        this.lastMoveTime = new Date().getTime();
    },
    onMouseUp(e){
        this.mouseEvent('mouseup',e);
    },
    onMouseDown(e){
        this.mouseEvent('mousedown',e);
    },
    onDoubleClick(e){
        // Handle doubleclick??
        console.log('onDoubleClick',e);
    },
    onMouseWheel(e){
        this.mouseEvent('mousewheel',e);
    },
    mouseEvent(type,e){
        let mouse = {x:0,y:0};
        if(e.detail.intersection){
            // Convert the intersection point from world to local coordinates.
            let localPoint = this.el.object3D.worldToLocal(this.last_move_point||e.detail.intersection.point);
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
        if(event.detail.evt){
            // Convert the mouse button value to a string for electron webcontents.
            switch(event.detail.evt.button){
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
        if(_event&&this.socket){
            // Send the event to electron over the websocket.
            this.socket.emit('event',_event);
        }
    },
    open(){
        this.openSocket();
    },
    close(){
        this.closeSocket()
    },
    setupSurfaceTexture(){
        // Setup a POT canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 512;
        this.surfaceTexture = new THREE.Texture(this.canvas);
    },
    openSocket(){
        // Connect to the websocket
        this.socket = io.connect('http://localhost:3443');
        this.is_disconnected = false;
        this.setupSocket();
    },
    setupSocket(){
        let mesh = this.el.getObject3D('mesh');
        this.socket.on('connect_error', ()=>{
            // Show message to download companion app if connection fails
            // TODO: Use a custom protocol for opening the companion if already installed.
            this.showDownloadMessage();
        });
        this.socket.on('frame', buffer=>{
            // Receive a jpeg buffer frame from the websocket server in the companion app.
            let blob = new Blob([buffer], {type: "image/jpeg"});
            let ctx = this.canvas.getContext('2d');
            // Create an image to show the frame and copy to the canvas
            let img = new Image();
            img.onload = ()=>{
                // Draw the frame to the temp canvas.
                ctx.drawImage(img, 0, 0, 1080, 640, 0, 0, 1024, 512);
                // Set the update flag
                this.surfaceTexture.needsUpdate = true;
            };
            // Creat url from the image blob
            img.src = URL.createObjectURL(blob);
        });
    },
    closeSocket(){
        if(this.socket){
            // Disconnect and delete the socket.
            this.socket.disconnect();
            this.is_disconnected = true;
            this.socket = null;
        }
    },
    showDownloadMessage(){
        // TODO: Show message to download companion app.
    }
});