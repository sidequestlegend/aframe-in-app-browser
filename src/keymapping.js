module.exports  = class KeyMapping{
    constructor(){}
    correctKey(key){
        switch(key.keyCode) {
            case "Tab":
                key.keyCode = '\u0009';
                key.charCode = 9;
                break;
            case "Delete":
                key.keyCode = '\u007f';
               // key.charCode = 8;
                break;
            case "Enter":
                key.keyCode = '\u000d';
                key.charCode = 13;
                break;
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
                key.keyCode = key.keyCode.replace('Arrow','');
                break;
        }
    }
};