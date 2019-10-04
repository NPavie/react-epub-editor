import React from 'react';
import './App.css';

import { EpubFileManager } from './components/EpubFileManager';
import { FileInput } from './components/FileInput';
import { FileTree } from './components/FileTree';
import { EpubViewer } from './components/EpubViewer';
import jszip from 'jszip';

// react-toastify for notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import AceEditor from 'react-ace';
import 'brace/mode/javascript';
import 'brace/mode/xml';
import 'brace/mode/html';
import 'brace/mode/css';
import 'brace/mode/text';
import 'brace/mode/plain_text';

import 'brace/theme/github';
import 'brace/theme/monokai';


const modeMap:{[key:string]:string} = {
    "xhtml":"xml",
    "xml":"xml",
    "ncx":"xml",
    "opf":"xml",
    "html" : "html",
    "htm" : "html",
    "css" : "css",
    "raw":"plain_text"
}

const imgMimetype:{[key:string]:string} = {
    "png":"image/png",
    "jpe":"image/jpeg",
    "jpg":"image/jpeg",
    "jpeg":"image/jpeg",
    "gif":"image/gif",
    "svg":"image/svg+xml"
}


function getMode(filepath:string){
    let temp = filepath.split('.');
    if(temp.length > 1){
        let mode = modeMap[temp.pop()!];
        return mode !== undefined ? mode : modeMap["raw"];
    } else {
        return modeMap["raw"];
    }
}

function isAnImage(filepath:string){
    return filepath.endsWith("png") ||
        filepath.endsWith("jpg") 
}

interface BinaryFile{
    fileName:string,
    content:Uint8Array
}


const base64abc = (() => {
    let abc = [],
        A = "A".charCodeAt(0),
        a = "a".charCodeAt(0),
        n = "0".charCodeAt(0);
    for (let i = 0; i < 26; ++i) {
        abc.push(String.fromCharCode(A + i));
    }
    for (let i = 0; i < 26; ++i) {
        abc.push(String.fromCharCode(a + i));
    }
    for (let i = 0; i < 10; ++i) {
        abc.push(String.fromCharCode(n + i));
    }
    abc.push("+");
    abc.push("/");
    return abc;
})();

function uint8ArrayToBase64(bytes:Uint8Array){
    let result = '', i, l = bytes.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3F];
    }
    if (i === l + 1) { // 1 octet missing
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) { // 2 octets missing
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0F) << 2];
        result += "=";
    }
    return result;
}


class App extends React.Component{



    state = {
        raw_mode:true,
        drawer_css:["App-drawer"],
        drawer_button_css:["App-button"],
        editor_css:["App-editor"],
        editor_width:"auto",
        cursor_position_begin:0,
        cursor_position_end:0,
        epub_loaded:new jszip(),
        filetree_loaded: new FileTree("",""),
        navigation_tree_loaded:{},
        last_rawfile_selected:"",
        last_html_selected:"",
        value_to_display:new Uint8Array()
    };


    fileInput:any;
    rawEditor:any;
    epubViewer:any;

    constructor(props:any){
        super(props);
        this.epubViewer = React.createRef();
        this.fileInput = React.createRef();
        this.rawEditor = React.createRef();
        this.handleEpubSubmit.bind(this);
        this.onFileSelect.bind(this);
    }


    loadingToastId:React.ReactText = "";
    /**
     * Actions done when an epub is uploaded
     * @param  {[type]} event:any [description]
     * @return {[type]}           [description]
     */
    handleEpubSubmit(event:any) {
        event.preventDefault();
        if(this.fileInput.current.files.length > 0){
            for (var i = this.fileInput.current.files.length - 1; i >= 0; i--) {
                let fileObject = this.fileInput.current.files[i];
                var zip:jszip = new jszip();
                this.loadingToastId = toast("Loading the epub " + fileObject, {autoClose:false});
                zip.loadAsync(fileObject)
                    .then( (ziploaded)=>{
                        let newstate = this.state;
                        newstate.epub_loaded = ziploaded;
                        newstate.filetree_loaded = new FileTree(fileObject.name,"");
                        for(var zippedfile in ziploaded.files){
                            // get data and load it to the file tree
                            newstate.filetree_loaded.addFile(zippedfile,ziploaded.file(zippedfile).async("uint8array"));
                        }
                        // load the navigation tree from the navigation file of the epub
                        if(newstate.drawer_css.length === 1){
                            newstate.drawer_css.push("show");
                        }
                        this.setState(newstate);
                        toast.dismiss(this.loadingToastId);
                    },()=>{
                        toast.dismiss(this.loadingToastId);
                        alert("Cannot unzip the epub");
                    });
            }
        } else {
          alert("No epub selected");
        }
    }

    onFileSelect(filepath:string){
        let newState = this.state;
        newState.last_rawfile_selected = filepath.substring(filepath.indexOf("/")+1);
        if(filepath.endsWith(".xhtml") ||
                filepath.endsWith(".html")||
                filepath.endsWith(".htm")){
            newState.last_html_selected = filepath.substring(filepath.indexOf("/")+1);
        }
        this.setState(newState);
        // realpath without the epub name
        let realPath = filepath.substring(filepath.indexOf("/")+1);
        // Test to retrieve and transform data from uint8 to text with the
        let dataPromise = newState.filetree_loaded.fetchData(realPath);
        if(dataPromise){
            dataPromise.then((data)=>{

                this.setState({
                    value_to_display:data
                });
            },(error)=>{alert(error)});
        }
    }

    showOrHideDrawer(){
        let newstate = this.state;
        if(newstate.drawer_css.length > 1){
            newstate.drawer_css.pop();
            newstate.drawer_button_css.pop();
            newstate.editor_css.pop();
        } else {
            newstate.drawer_button_css.push("rotate");
            newstate.drawer_css.push("show");
            newstate.editor_css.push("with-drawer");
        }
        this.setState(newstate);
    }

    changeEditorView(){
        var newstate = this.state; 
        if(newstate.raw_mode === true){
            newstate.raw_mode = false;
        } else newstate.raw_mode = true;
        this.setState(newstate);
    };

    // ACE EDITOR callbacks
    onChange(newValue:any) {
        //console.log("change", newValue);
        this.setState({
          value: newValue
        });
    }

    onSelectionChange(newValue:any, event:any) {
        //console.log("select-change", newValue);
        //console.log("select-change-event", event);
    }

    onCursorChange(newValue:any, event:any) {
        //console.log("cursor-change", newValue);
        //console.log("cursor-change-event", event);
    }

    onValidate(annotations:any) {
        //console.log("onValidate", annotations);
    }

    
    render(){
        var switchingView:String = 
            this.state.raw_mode === true ? 
                "Switch to EPub viewer" : 
                "Switch to Raw source viewer";
        let editor;
        let navigator;
        let displayedFileName = ""
        if(this.state.raw_mode === true){
            displayedFileName = this.state.last_rawfile_selected;
            let fileExtension = displayedFileName.substring(displayedFileName.lastIndexOf('.') + 1);
            if(imgMimetype[fileExtension]){ // mimetype exists in extention map
                editor = <div className="image-view">
                    <img src={"data:"+imgMimetype[fileExtension]+";base64, " + uint8ArrayToBase64(this.state.value_to_display)}/>
                </div>;
            } else {
                // TODO + FIXME : the height cannot set a 100% height on this
                editor =
                    <AceEditor
                        width="auto"
                        mode={getMode(this.state.last_rawfile_selected)}
                        defaultValue="Please upload an epub and select a file to start using the editor"
                        value={new TextDecoder("utf-8").decode(this.state.value_to_display)}
                        theme="monokai"
                        onChange={(value)=>this.onChange(value)}
                        onValidate={this.onValidate}
                        onCursorChange={this.onCursorChange}
                        onSelectionChange={this.onSelectionChange}
                        name="ace_editor"
                        editorProps={{$blockScrolling: true}}
                    />;
            }
            navigator = <EpubFileManager 
                filetree={this.state.filetree_loaded}
                onFileSelect={(filepath)=>this.onFileSelect(filepath)}
            />;
        } else {
            editor = <EpubViewer epubToRender={this.state.filetree_loaded} />;
            navigator = <p>epub navigation viewer</p>;
        }

        return (
        <div className="App">
            <ToastContainer />
            <header className="App-header">
                <button className={this.state.drawer_button_css.join(" ")}
                        onClick={(event:any) => {this.showOrHideDrawer()}} 
                    >&#9776;</button>

                <FileInput className="App-button" 
                        mimetype="application/epub+zip"
                        onFileSubmit={(event:any)=>{this.handleEpubSubmit(event)}}
                        eventRef={this.fileInput}
                    />
                
                <button className="App-button"></button>
                <button className="App-button" 
                        onClick={(event:any) => {this.changeEditorView()}}
                    >{switchingView}</button>
            </header>
            <main className="App-frame">
                <aside className={this.state.drawer_css.join(' ')}>
                    {navigator}
                </aside>
                <div className={this.state.editor_css.join(' ')}>
                    <p className="displayed-file">{displayedFileName}</p>
                    {editor}
                </div>
                <aside className="App-actions"></aside>
            </main>
            <footer className="App-footer" />
        </div>
        );
    }
}

export default App;
