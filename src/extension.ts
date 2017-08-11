
// https://code.visualstudio.com/docs/extensionAPI/vscode-api

import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

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

    public updateWordCount() {

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        // Get the current text editor
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
            this._statusBarItem.text = wordCount !== 1 ? `${currentLine + 1} line` : '1 line';
            this._statusBarItem.color = "#fff";
            this._statusBarItem.command = "";
            this._statusBarItem.show();
        } else { 
            this._statusBarItem.hide();
        }
    }

    public _getNestedRules(doc: TextDocument, currentLine): number {

        let docContent = doc.getText();

        console.log(currentLine);
        console.log(doc.lineAt(currentLine).text);

        // ([^\n\t,]+)(,|{)
        // ([a-zA-Z].*)((,)|({))
        // (\S.*)((,)|({))

        // Parse out unwanted whitespace so the split is accurate
        var ciccio = docContent.match(/(\S.*)((,)|({))/g);
        // console.log(ciccio);

        let wordCount = 0;
        if (docContent != "") {
            wordCount = docContent.length;
        }

        return wordCount;
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
        this._wordCounter.updateWordCount();

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }
}