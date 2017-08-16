
import {window, commands, Range, Position,Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

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
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;
        let currentLine = editor.selections[0].active.line;

        // Only update status if an Sass file
        if (doc.languageId === "scss") {
            let wordCount = this._getNestedRules(doc, currentLine);

            // Update the status bar
            this._statusBarItem.text = `${wordCount}`;
            // this._statusBarItem.color = "#fff";
            this._statusBarItem.command = "";
            this._statusBarItem.show();
        } else { 
            this._statusBarItem.hide();
        }
    }

    

    public _getNestedRules(doc: TextDocument, currentLine): string {

        let startPos = new Position(0, 0);
        let endPos = new Position(currentLine, 0);
        let docContent = doc.getText(new Range(startPos,endPos));

        let _removeSpaces = docContent.replace(/\s{2,}|\s(?={)|\n/g, "");
        let _removeProp = _removeSpaces.replace(/\w+-|\w+:{1}\s?\w+;/g, "");
        let _filterCache = _removeProp;
        let _filter;

        // Remove rules that have closing brackets
        while (_filterCache.length > 0) {
            let _currentFilter = _filterCache.replace(/([^\s{}]|[\s])+{}/g, "");
            if (_currentFilter === _filterCache) {
                _filterCache = ""; 
                _filter = _currentFilter
            } else {
                _filterCache = _currentFilter;
            }
        }

        let finalString = _filter.replace(/{/g, " » ") ;

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