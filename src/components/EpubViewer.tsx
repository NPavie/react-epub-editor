import React from 'react';
import jszip from 'jszip';

import {FileTree} from './FileTree';

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

const imgMimetype = {
    "png":"image/png",
    "jpe":"image/jpeg",
    "jpg":"image/jpeg",
    "jpeg":"image/jpeg",
    "gif":"image/gif",
    "svg":"image/svg+xml"
}


interface EpubViewerProps{
    epubToRender:FileTree
}

export class EpubViewer extends React.Component<EpubViewerProps, {}>{
    state={
        
    }

    constructor(props:any){
        super(props);
    }

    renderEpub(node:FileTree){
        
        if(this.props.epubToRender.size > 0){
            // read the META-INF/container.xml file to retrieve the opf
            let containerDataPromise = node.fetchData("META-INF/container.xml");
            if(containerDataPromise) containerDataPromise.then((containerData) =>{
                    let data = new TextDecoder("utf-8").decode(containerData);
                    var fullpathRegex = /.*full-path="([^\"]*)"/g
                    var matched = fullpathRegex.exec(data);
                    if(matched){
                        var packageFile = matched[1];

                        let packagePromise = node.fetchData(packageFile);
                        if(packagePromise) return packagePromise;

                    }

                }).then((packageData)=>{
                    let data = new TextDecoder("utf-8").decode(packageData);
                    console.log(data);
                });
            // From the opf file, get the spine
            // For each "itemref" of the spine
            //  create a <section id="file.xhtml"> itemref body content </section>
        }
    }

    render(){
        this.renderEpub(this.props.epubToRender);
        return <p>Please load an epub using the button in the top bar</p>;
    }
}