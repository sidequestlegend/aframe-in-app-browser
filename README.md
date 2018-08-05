# AFRAME In-App Browser
![Demo](https://raw.githubusercontent.com/shaneharris/aframe-in-app-browser/master/demo.gif)

This in-app browser uses a headless browser with off-screen rendering as a companion app to paint frames from webpages to a texture in aframe.
The companion app is based in electron ( server.js ) and recieves mouse and keyboard events from the front end. This allows for a fully
isolated browser experience inside of aframe for doing things like Oauth, or just general browsing in VR.


I will get a demo in place soon but for now here's the details to get you started.


## Getting Started

#### Installing

```
npm i aframe-in-app-browser
```

#### Running

```
npm start
```

#### Building

```
npm run build
```



## Example

```HTML
<a-scene stats>
    <a-entity id="camera" camera="near:0.1;far:1000"  look-controls > <!--wasd-controls-->
        <a-entity id="cursor" cursor="rayOrigin: mouse" ui-mouse-shim
                  raycaster="far: 30; objects: .intersectable;"></a-entity>
    </a-entity>

    <a-entity light="type: ambient; intensity: 0.5;"></a-entity>
    <a-box color="#efefef" side="back" scale="10 10 10"></a-box>

    <a-entity position="0 0 -1">
        <a-plane height="0.1" width="1.7" shader="flat" color="#009688" curved-plane position="0 0.55 0"></a-plane>
        <a-plane height="1" width="1.7" shader="flat" browser ui-double-click curved-plane class="intersectable"></a-plane>
    </a-entity>
</a-scene>
```

## TODOs:

* Need to finish the address bar to allow for navigating to other sites.
