import * as vscode from "vscode"
import { ClaudeDevProvider } from "./providers/ClaudeDevProvider"

let outputChannel: vscode.OutputChannel

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("Claude Dev")
    context.subscriptions.push(outputChannel)

    outputChannel.appendLine("Claude Dev extension activated")

    const sidebarProvider = new ClaudeDevProvider(context)

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ClaudeDevProvider.sideBarId, sidebarProvider, {
            webviewOptions: { retainContextWhenHidden: true },
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand("claude-dev.plusButtonTapped", async () => {
            outputChannel.appendLine("Plus button tapped")
            await sidebarProvider.clearTask()
            await sidebarProvider.postStateToWebview()
            sidebarProvider.postMessageToWebview({ type: "action", action: "plusButtonTapped" })
        })
    )

    const openClaudeDevInNewTab = () => {
        outputChannel.appendLine("Opening Claude Dev in new tab")
        const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))
        const targetCol = Math.max(lastCol + 1, 1)
        const panel = vscode.window.createWebviewPanel(
            ClaudeDevProvider.tabPanelId,
            "Claude Dev",
            targetCol,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [context.extensionUri],
            }
        )
        panel.iconPath = vscode.Uri.joinPath(context.extensionUri, "icon.png")
        const tabProvider = new ClaudeDevProvider(context)
        tabProvider.resolveWebviewView(panel.webview as any as vscode.WebviewView)

        // Lock the editor group so clicking on files doesn't open them over the panel
        new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
            vscode.commands.executeCommand("workbench.action.lockEditorGroup")
        })
    }

    context.subscriptions.push(vscode.commands.registerCommand("claude-dev.popoutButtonTapped", openClaudeDevInNewTab))
    context.subscriptions.push(vscode.commands.registerCommand("claude-dev.openInNewTab", openClaudeDevInNewTab))

    context.subscriptions.push(
        vscode.commands.registerCommand("claude-dev.settingsButtonTapped", () => {
            sidebarProvider.postMessageToWebview({ type: "action", action: "settingsButtonTapped" })
        })
    )

    const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
        provideTextDocumentContent(uri: vscode.Uri): string {
            return Buffer.from(uri.query, "base64").toString("utf-8")
        }
    })()
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider("claude-dev-diff", diffContentProvider)
    )
}

export function deactivate() {
    outputChannel.appendLine("Claude Dev extension deactivated")
}
