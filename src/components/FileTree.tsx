//export interface FileTree { [key: string]: Array<string|FileTree> };

export class FileTree extends Map<string,FileTree>{
    name:string = "";
    parentPath:string ="";
    data?:Promise<Uint8Array>;
    
    /**
     * Create a new node with specified name
     * @param  {[type]} name:string [description]
     * @return {[type]}                 [description]
     */
    constructor(name:string, parentPath:string = ""){
        super();
        this.name = name;
        if(parentPath.startsWith("/")){
            // remove first slash
            this.parentPath = parentPath.substring(1)
        } else this.parentPath = parentPath;

    }

    addFile(path:string, dataPromised?:Promise<Uint8Array>){

        if(path.startsWith("/")) path = path.substring(1);
        var splittedPath = path.split('/');
        if(splittedPath.length > 0){
            var fileOrfolder = splittedPath.shift()!;
            if(this.get(fileOrfolder) === undefined) 
                this.set(fileOrfolder, 
                    new FileTree(fileOrfolder,this.parentPath +"/"+ this.name));
            if(splittedPath.length > 0){
                this.get(fileOrfolder)!
                    .addFile(splittedPath.join('/'),dataPromised);
            } else this.get(fileOrfolder)!.data = dataPromised;
        }
    }
    /**
     * Retrieve either the data from the current calling node or from a subnode noted by a path from the calling node.
     * If their is no such node or data found, undefined is returned
     * @argument
     * @argument {[pathFromNode]} if defined, subnode from which the data should be retrieved
     */
    fetchData(pathFromNode?:string): Promise<Uint8Array> | undefined {
        if(pathFromNode === undefined){
            return this.data;
        } else {
            if(pathFromNode.startsWith("/")) pathFromNode = pathFromNode.substring(1);
            var splittedPath = pathFromNode.split('/');
            if(splittedPath.length > 0){
                var fileOrfolder = splittedPath.shift()!;
                if(this.get(fileOrfolder) === undefined) return undefined;
                else if (splittedPath.length === 0) return this.get(fileOrfolder)!.fetchData();
                else return this.get(fileOrfolder)!.fetchData(splittedPath.join('/'));
            } else if(this.name === pathFromNode) return this.data;
            else return undefined;
        }
    }
}
