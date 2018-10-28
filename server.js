const {app, BrowserWindow, ipcMain} = require('electron');
app.disableHardwareAcceleration();
const WebSocketServer = require('ws').Server;
const KeyMapping = require('./src/keymapping');

class App{
    constructor(){
        this.keymapping = new KeyMapping();
        this.windows = {};
        this.isBrowser = true;
        app.once('ready', () => this.ready());
        this._ws = new WebSocketServer({ port: 3443 });
        this._ws.on('connection', ws=>{
            this.connected = true;
            this.client = ws;
            ws.on('message', message=>{
                try{
                    let json = JSON.parse(message);
                    if(json){
                        switch(json.path){
                            case "event":
                                if(~["char","keyup","keydown"].indexOf(json.data.type)){
                                    this.keymapping.correctKey(json.data);
                                }
                                if(this.isBrowser&&this.win){
                                    this.win.webContents.sendInputEvent(json.data);
                                }else{
                                    this.codeWin.webContents.sendInputEvent(json.data);
                                }
                                break;
                            case "load-url":
                                if(json.data.substr(0,7)!=="http://"&&json.data.substr(0,8)!=="https://"){
                                    json.data = "http://"+json.data;
                                }
                                if(this.isBrowser&&this.win) {
                                    this.win.webContents.loadURL(json.data);
                                }
                                break;
                            case "close-browser":
                                if(this.win)this.win.destroy();
                                this.isBrowser = false;
                                break;
                            case "get-browser":
                                this.win = new BrowserWindow({
                                    width: 1080,
                                    height: 640,
                                    show: false,
                                    frame: false,
                                    webPreferences: {
                                        nodeIntegration: false,
                                        offscreen: true,
                                        transparent: true
                                    }
                                });
                                this.isBrowser = true;
                                this.setupWindow();
                                if(this.last_paint)this.sendToClient(this.last_paint);
                                break;
                            case "get-ide":
                                if(this.win)this.win.destroy();
                                this.isBrowser = false;
                                this.sendToClient(this.last_ide_paint);
                                break;
                            case "go-forward":
                                if(this.isBrowser&&this.win)this.win.webContents.goForward();
                                break;
                            case "go-back":
                                if(this.isBrowser&&this.win)this.win.webContents.goBack();
                                break;
                            case "reload":
                                if(this.isBrowser&&this.win)this.win.webContents.reload();
                                break;
                            case "focus":
                                if(this.isBrowser&&this.win)this.win.focus();
                                break;
                            case "blur":
                                if(this.isBrowser&&this.win)this.win.blur();
                                break;
                            case "open-behaviour":
                                this.codeWin.webContents.send('openBehaviour',json.data);
                                break;
                            case "open-aframe":
                                this.codeWin.webContents.send('openAframe',json.data);
                                break;
                            case "save-code":
                                this.codeWin.webContents.send('saveCode');
                                break;
                        }
                    }
                }catch(e){
                    console.log(e);
                }
            });
            ws.on('error', e=>{
                this.connected = false;
                if(this.win)this.win.destroy();
                this.isBrowser = false;
                console.log('error',e)
            });
            ws.on('close', e=>{
                this.connected = false;
                if(this.win)this.win.destroy();
                this.isBrowser = false;
                //console.log('close',e)
            });
            if(this.win&&this.connected&&this.win&&this.isBrowser){
                this.sendToClient(JSON.stringify({path:'did-navigate',data:this.win.webContents.getURL()}));
            }
            if(this.last_paint&&this.connected&&this.win&&this.isBrowser){
                this.sendToClient(this.last_paint);
            }

        });
        ipcMain.on('saveBehaviour',(event, arg) => {
            this.sendToClient(JSON.stringify({path:'saveBehaviour',data:arg}))
        });
        ipcMain.on('saveAframe',(event, arg) => {
            this.sendToClient(JSON.stringify({path:'saveAframe',data:arg}))
        });
        this._ws.on('error', socket=>{
            console.log('error',socket);
        });
    }
    ready(){
        this.codeWin = new BrowserWindow({
            width: 1080,
            height: 640,
            show: false,
            frame: false,
            webPreferences: {
                offscreen: true,
                transparent: true
            }
        });
        this.setupCodeWindow();
    }
    sendToClient(message){
        if(this.client&&this.connected){
            this.client.send(message);
        }
    }
    setupCodeWindow(){
        this.codeWin.loadURL('http://localhost:8080/ide.html');
        this.codeWin.webContents.setFrameRate(20);
        this.codeWin.webContents.on('paint', (event, dirty, image) => {
            this.last_ide_paint = image.toJPEG(85);
            if(!this.isBrowser) {
                this.sendToClient(this.last_ide_paint);
            }
        });
    }
    setupWindow(){
        this.win.webContents.on('new-window', (event, url)=>{
            event.preventDefault();
            this.win.webContents.loadURL(url);
        });
        this.win.setFullScreenable(false);
        this.win.loadURL('https://www.google.com');
        this.win.webContents.setFrameRate(20);
        this.win.webContents.on('paint', (event, dirty, image) => {
            this.last_paint = image.toJPEG(85);
            if(this.isBrowser){
                this.sendToClient(this.last_paint);
            }
        });
        this.win.webContents.on('did-fail-load', () =>this.sendToClient(JSON.stringify({path:'did-fail-load'})));
        this.win.webContents.on('did-start-loading', () =>this.sendToClient(JSON.stringify({path:'did-start-loading'})));
        this.win.webContents.on('did-stop-loading', () =>this.sendToClient(JSON.stringify({path:'did-stop-loading'}))&&this.resetScrollBar());
        this.win.webContents.on('did-navigate', (event,url) =>this.sendToClient(JSON.stringify({path:'did-navigate',data:url}))&&this.resetScrollBar());
        this.win.webContents.on('dom-ready', () =>this.resetScrollBar());
        this.win.on('focus',()=>{
            console.log('focus');
        });
        this.win.on('blur',()=>{
            console.log('window blur');
        })
    }
    resetScrollBar(){
        this.win.webContents.insertCSS(`
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
    }
}
new App();