import React from 'react';

import jszip from 'jszip';


interface FileInputCallback {
    (event:any): void
}

interface FileInputProps {
    onFileSubmit:FileInputCallback,
    mimetype:string,
    className:string,
    eventRef:React.RefObject<HTMLInputElement>
}
/**
 * @property onFileSubmit:FileInputCallback 
 */
export class FileInput extends React.Component<FileInputProps, {}> {


  static defaultProps:FileInputProps = {
        onFileSubmit:(event:any)=>{},
        mimetype:"",
        className:"",
        eventRef:React.createRef()
    }

    formRef:any;
    constructor(props:any) {
      super(props);
      this.formRef = React.createRef();
      this.launchSubmit = this.launchSubmit.bind(this);
    }

    launchSubmit(event:any){
      this.formRef.current.dispatchEvent(new Event("submit"));
    }

  render() {
    return (
      <form className={this.props.className} onSubmit={this.props.onFileSubmit} ref={this.formRef}>
        <label className={this.props.className}>Load an epub : </label>
        <input type="file" ref={this.props.eventRef} accept={this.props.mimetype}/>
        <button type="submit">Load</button>
      </form>
    );
  }
}