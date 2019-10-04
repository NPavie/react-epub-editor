import React from 'react';

/**
 * Callback function interface that takes in the selection filepath
 */
interface  TitleSelectionCallback {
    (filepath:string, anchorlink:string): void
}

/**
 * Properties of the FileManager
 */
interface EpubNavigatorProps {
    navigation_tree: Array<unknown>,
    onTitleSelect: TitleSelectionCallback
}
export class EpubNavigator extends React.Component<EpubNavigatorProps, {}>{

    render(){
        return <p>epub navigation viewer</p>;
    }
}