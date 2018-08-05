const {app, BrowserWindow} = require('electron');
//app.disableHardwareAcceleration();
const io = require('socket.io')();
class App{
    constructor(){
        app.once('ready', () => this.ready());
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
        io.on('connection', socket=>{
            this.client = socket;
            if(this.win){
                this.sendToClient('did-navigate',this.win.webContents.getURL());
            }
            if(this.last_paint){
                this.sendToClient('frame',this.last_paint);
            }
            socket.on('event',event=>{
                this.win.webContents.sendInputEvent(event);
            });
            socket.on('load-url',url_string=>{
                if(typeof url_string === "string"){
                    if(url_string.substr(0,7)!=="http://"&&url_string.substr(0,8)!=="https://"){
                        url_string = "http://"+url_string;
                    }
                    this.win.webContents.loadURL(url_string);
                }
            });
        });
        io.listen(3443);
    }
    sendToClient(message,data){
        if(this.client){
            this.client.emit(message,data);
        }
    }
    setupWindow(){
        this.win.loadURL('https://github.com');
        this.win.webContents.setFrameRate(15);
        this.win.webContents.on('paint', (event, dirty, image) => {
            this.last_paint = image.toJPEG(65);
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