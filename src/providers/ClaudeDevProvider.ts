import * as vscode from "vscode"
import { ApiConfiguration, ApiProvider } from "../shared/api"
import { ClaudeDev } from "../ClaudeDev"
import { ClaudeMessage, ExtensionMessage } from "../shared/ExtensionMessage"

const latestAnnouncementId = "1.0.0" // Replace with actual latest announcement ID

type GlobalStateKey = "apiProvider" | "awsRegion" | "maxRequestsPerTask" | "lastShownAnnouncementId" | "openRouterModel"

export class ClaudeDevProvider implements vscode.WebviewViewProvider {
    private readonly context: vscode.ExtensionContext
    private view?: vscode.WebviewView
    private claudeDev: ClaudeDev | undefined
    private readonly latestAnnouncementId = latestAnnouncementId

    static readonly sideBarId = "claude-dev-sidebar"
    static readonly tabPanelId = "claude-dev-tab"

    constructor(context: vscode.ExtensionContext) {
        this.context = context
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
        this.view = webviewView

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        }

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview)

        this.setWebviewMessageListener(webviewView.webview)
        this.postStateToWebview()
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'main.js'))
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'style.css'))

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Claude Dev</title>
            </head>
            <body>
                <div id="root"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`
    }

    async getState() {
        const [
            apiProvider,
            apiKey,
            openRouterApiKey,
            awsAccessKey,
            awsSecretKey,
            awsRegion,
            maxRequestsPerTask,
            lastShownAnnouncementId,
            openRouterModel,
        ] = await Promise.all([
            this.getGlobalState("apiProvider") as Promise<ApiProvider | undefined>,
            this.getSecret("apiKey") as Promise<string | undefined>,
            this.getSecret("openRouterApiKey") as Promise<string | undefined>,
            this.getSecret("awsAccessKey") as Promise<string | undefined>,
            this.getSecret("awsSecretKey") as Promise<string | undefined>,
            this.getGlobalState("awsRegion") as Promise<string | undefined>,
            this.getGlobalState("maxRequestsPerTask") as Promise<number | undefined>,
            this.getGlobalState("lastShownAnnouncementId") as Promise<string | undefined>,
            this.getGlobalState("openRouterModel") as Promise<string | undefined>,
        ])
        return {
            apiProvider: apiProvider || "anthropic", // for legacy users that were using Anthropic by default
            apiKey,
            openRouterApiKey,
            awsAccessKey,
            awsSecretKey,
            awsRegion,
            maxRequestsPerTask,
            lastShownAnnouncementId,
            openRouterModel,
        }
    }

    async postStateToWebview() {
        if (!this.view) return

        const {
            apiProvider,
            apiKey,
            openRouterApiKey,
            awsAccessKey,
            awsSecretKey,
            awsRegion,
            maxRequestsPerTask,
            lastShownAnnouncementId,
            openRouterModel,
        } = await this.getState()
        this.postMessageToWebview({
            type: "state",
            state: {
                apiConfiguration: { 
                    apiProvider, 
                    apiKey, 
                    openRouterApiKey, 
                    awsAccessKey, 
                    awsSecretKey, 
                    awsRegion,
                    openRouterModel,
                },
                maxRequestsPerTask,
                themeName: vscode.workspace.getConfiguration("workbench").get<string>("colorTheme"),
                claudeMessages: this.claudeDev?.claudeMessages || [],
                shouldShowAnnouncement: lastShownAnnouncementId !== this.latestAnnouncementId,
            },
        })
    }

    async initClaudeDevWithTask(task: string) {
        await this.clearTask()
        const { 
            apiProvider, 
            apiKey, 
            openRouterApiKey, 
            awsAccessKey, 
            awsSecretKey, 
            awsRegion, 
            maxRequestsPerTask,
            openRouterModel,
        } = await this.getState()
        this.claudeDev = new ClaudeDev(
            this,
            task,
            { 
                apiProvider, 
                apiKey, 
                openRouterApiKey, 
                awsAccessKey, 
                awsSecretKey, 
                awsRegion,
                openRouterModel,
            },
            maxRequestsPerTask
        )
    }

    private setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.type) {
                    case "task":
                        await this.initClaudeDevWithTask(message.task)
                        break
                    case "cancel":
                        this.claudeDev?.cancel()
                        break
                    case "clearTask":
                        await this.clearTask()
                        break
                    case "apiConfiguration":
                        if (message.apiConfiguration) {
                            const { 
                                apiProvider, 
                                apiKey, 
                                openRouterApiKey, 
                                awsAccessKey, 
                                awsSecretKey, 
                                awsRegion,
                                openRouterModel,
                            } = message.apiConfiguration
                            await this.updateGlobalState("apiProvider", apiProvider)
                            await this.storeSecret("apiKey", apiKey)
                            await this.storeSecret("openRouterApiKey", openRouterApiKey)
                            await this.storeSecret("awsAccessKey", awsAccessKey)
                            await this.storeSecret("awsSecretKey", awsSecretKey)
                            await this.updateGlobalState("awsRegion", awsRegion)
                            await this.updateGlobalState("openRouterModel", openRouterModel)
                            this.claudeDev?.updateApi(message.apiConfiguration)
                        }
                        await this.postStateToWebview()
                        break
                    case "maxRequestsPerTask":
                        await this.updateGlobalState("maxRequestsPerTask", message.maxRequestsPerTask)
                        await this.postStateToWebview()
                        break
                    case "hideAnnouncement":
                        await this.updateGlobalState("lastShownAnnouncementId", this.latestAnnouncementId)
                        await this.postStateToWebview()
                        break
                }
            },
            undefined,
            this.context.subscriptions
        )
    }

    async clearTask() {
        this.claudeDev?.cancel()
        this.claudeDev = undefined
        await this.postStateToWebview()
    }

    postMessageToWebview(message: ExtensionMessage) {
        if (this.view) {
            this.view.webview.postMessage(message)
        }
    }

    async getGlobalState(key: GlobalStateKey) {
        return this.context.globalState.get(key)
    }

    async updateGlobalState(key: GlobalStateKey, value: any) {
        await this.context.globalState.update(key, value)
    }

    // TODO: Use a more secure way to store secrets
    async getSecret(key: string) {
        return this.context.secrets.get(key)
    }

    // TODO: Use a more secure way to store secrets
    async storeSecret(key: string, value: string) {
        await this.context.secrets.store(key, value)
    }

    postClaudeMessage(claudeMessage: ClaudeMessage) {
        this.postMessageToWebview({
            type: "state",
            state: {
                claudeMessages: [...(this.claudeDev?.claudeMessages || []), claudeMessage],
            },
        })
    }

    postError(error: string) {
        this.postMessageToWebview({
            type: "state",
            state: {
                error,
                claudeMessages: this.claudeDev?.claudeMessages || [],
            },
        })
    }
}
