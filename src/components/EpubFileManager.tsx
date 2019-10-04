import React from 'react';

import {FileTree} from "./FileTree";

import './Navigator.css';



/**
 * Callback function interface that takes in the selection filepath
 */
interface FileSelectionCallback {
    (filepath:string): void
}

/**
 * Properties of the FileManager
 */
interface EpubFileManagerProps {
    filetree: FileTree,
    onFileSelect:FileSelectionCallback
}

export class EpubFileManager extends React.Component<EpubFileManagerProps, {}> {

    static defaultProps:EpubFileManagerProps = {
        filetree:new FileTree("",""),
        onFileSelect:(filepath:string)=>{}
    }

    state={
        current_selected_path:""
    };

     renderTree(node:FileTree) : JSX.Element {
        let nodePath: string = node.parentPath + "/"+node.name;
        if(node.size === 0){ // current node is a leaf (a file)
            let selected_css = 
                this.state.current_selected_path === nodePath ?
                "folder-content file selected":
                "folder-content file";
            return <li key={nodePath.replace('/','-')} 
                className={selected_css}
                onClick={(event) => {
                        let newstate = this.state;
                        newstate.current_selected_path = nodePath;
                        this.props.onFileSelect(nodePath);
                        this.setState(newstate);
                    }
                }>{node.name}</li>
        } else { // current node is a tree node (a folder)
             let childrenjsx:JSX.Element[] = [];
             // Ordered display
             let orderedNodeKeys = Array.from(node.keys()).sort();
             orderedNodeKeys.forEach((key:string) => {
                 childrenjsx.push(this.renderTree(node.get(key)!));
             });
             //node.forEach((value:FileTree, key:string) => {
             //    childrenjsx.push(this.renderTree(value));
             //});
             return <li key={nodePath.replace('/','-')}
                             className="folder"
                         ><p className="folder-name">{node.name}</p>
                         <ul key={nodePath.replace('/','-')+"content"} 
                                 className="folder-content">{childrenjsx}</ul>
                    </li>;
        }
    }

    render(){
        if(this.props.filetree.name === ""){
            return <ul key="filemanager-content" className="folder-content"> 
                    <li>No files loaded</li>
                </ul>;
        }else{
            return <ul key="filemanager-content" className="folder-content">{this.renderTree(this.props.filetree)}</ul>;
        }
    }
}
