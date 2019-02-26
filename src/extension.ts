
import {
    window,
    commands,
    Range,
    Position,
    Disposable,
    ExtensionContext,
    StatusBarAlignment,
    StatusBarItem,
    TextDocument
} from 'vscode';

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {
    // create a new word counter
    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);
    

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(controller);
    context.subscriptions.push(wordCounter);
}

class WordCounter {

    private _statusBarItem: StatusBarItem;

    public updateNestedRules() {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }
        
        let editor = window.activeTextEditor;
        let doc = editor.document;
        let currentLine = editor.selections[0].active.line;

        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        if (doc.languageId === "scss") {
            const wordCount = this.getNestedRules(doc, currentLine);

            // Update the status bar
            this._statusBarItem.text = `${wordCount}`;
            this._statusBarItem.command = "";
            this._statusBarItem.show();
        } else { 
            this._statusBarItem.hide();
        }
    }

    private retriveCleanedText(docTxt:string): string {
        if(!docTxt) return;
        return docTxt
            .match(/([^;]+{)|(})/g).join("") // remove properties
            .replace(/\/\/.*/g, "") // remove inline comments
            .replace(/\s{2,}|\s(?={)|\n/g, "") // trim spaces
            .replace(/(#{)(.*?)(})/g, "%7B$2%7D") // fix sass placeholder aka '#{}'
            .replace(/(\/\*.*?\*\/)|\/\*.*/g, "") // remove multiline comments
    }

    /**
     * @description Remove open/closing brackets of the definitive path
     * @param docTxt Document text before the cursor
     */
    private retriveCurrentPath(cleanedText:string): string {
        let currentPath:string = cleanedText;

        while (currentPath.length > 0) {
            let currentFilter = currentPath.replace(/([^\s{}]|[\s])+{}/g, "");
            if (currentFilter === currentPath) {
                return currentFilter;
            } else {
                currentPath = currentFilter;
            }
        }
    }

    private getNestedRules(doc: TextDocument, currentLine): string {

        const startPos = new Position(0, 0);
        const endPos = new Position(currentLine, 0);
        const docContent = doc.getText(new Range(startPos,endPos));
        
        const cleanedText:string = this.retriveCleanedText(docContent);
        const cleanedPath:string = this.retriveCurrentPath(cleanedText);
        
        
        if (cleanedPath && cleanedPath.length > 1 ) {
            let _sobstituteBrakets = cleanedPath.replace(/([^#](?={))(.)/g, "$1  »  ") ;
            let _service = _sobstituteBrakets.replace(/%7B/g, "#{");
            var finalString:string = _service.replace(/%7D/g, "}");
        } else {
            var finalString = "";
        }

        return finalString;
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // update the counter for the current file
        this._wordCounter.updateNestedRules();

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._wordCounter.updateNestedRules();
    }
}