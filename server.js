const {app, BrowserWindow} = require('electron');
//app.disableHardwareAcceleration();
// const io = require('socket.io')();
const WebSocketServer = require('ws').Server;

class App{
    constructor(){
        app.once('ready', () => this.ready());
        this._ws = new WebSocketServer({ port: 3443 });
        this._ws.on('connection', ws=>{
            this.connected = true;
            this.client = ws;
            let socket = this.setupSocket(ws);
            ws.on('message', message=>{
                try{
                    let json = JSON.parse(message);
                    if(json&&json.path === "event"){
                        this.win.webContents.sendInputEvent(json.data);
                    }else if(json&&json.path === "load-url"){
                        if(typeof json.data === "string"){
                            if(json.data.substr(0,7)!=="http://"&&json.data.substr(0,8)!=="https://"){
                                json.data = "http://"+json.data;
                            }
                            this.win.webContents.loadURL(json.data);
                        }
                    }
                }catch(e){

                }
            });
            ws.on('error', e=>{
                this.connected = false;
                console.log(e)
            });
            ws.on('close', e=>{
                this.connected = false;
                console.log(e)
            });
            if(this.win){
                //this.sendToClient('did-navigate',this.win.webContents.getURL());
            }
            if(this.last_paint&&this.connected){
                this.sendToClient(this.last_paint);
            }
        });
        this._ws.on('error', socket=>{
            console.log('error',socket);
        });
    }
    ready(){
        this.win = new BrowserWindow({
            width: 1080,
            height: 640,
            show: false,
            frame: false,
            webPreferences: {
                offscreen: true,
                transparent: true
            }
        });
        this.setupSocket();
        this.setupWindow();

    }
    setupSocket(){
        // io.on('connection', socket=>{
        //     this.client = socket;
        //
        // });
        // io.listen(3443);
    }
    sendToClient(message,data){
        if(this.client&&this.connected){
            this.client.send(data);
        }
    }
    setupWindow(){
        this.win.loadURL('https://www.youtube.com/watch?v=JynwitCHP4E');
        this.win.webContents.setFrameRate(30);
        this.win.webContents.on('paint', (event, dirty, image) => {
            this.last_paint = image.toJPEG(75);
            this.sendToClient('frame',this.last_paint);

        });
        this.win.webContents.on('did-fail-load', () =>this.sendToClient('did-fail-load'));
        this.win.webContents.on('did-start-loading', () =>this.sendToClient('did-start-loading'));
        this.win.webContents.on('did-stop-loading', () =>this.sendToClient('did-stop-loading')&&this.resetScrollBar());
        this.win.webContents.on('did-navigate', (event,url) =>this.sendToClient('did-navigate',url)&&this.resetScrollBar());
        this.win.webContents.on('dom-ready', () =>this.resetScrollBar());
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