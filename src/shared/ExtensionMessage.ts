import { ApiConfiguration } from "./api"

export interface ExtensionMessage {
	type: "action" | "state"
	text?: string
	action?: "plusButtonTapped" | "settingsButtonTapped" | "didBecomeVisible"
	state?: ExtensionState
}

export interface ExtensionState {
	apiConfiguration?: ApiConfiguration
	maxRequestsPerTask?: number
	themeName?: string
	claudeMessages: ClaudeMessage[]
	shouldShowAnnouncement?: boolean
	error?: string
}

export interface ClaudeMessage {
	ts: number
	type: "ask" | "say"
	role: "user" | "assistant"
	ask?: ClaudeAsk
	say?: ClaudeSay
	text?: string
	content?: string | ContentBlock[]
}

export type ClaudeAsk =
	| "request_limit_reached"
	| "followup"
	| "command"
	| "command_output"
	| "completion_result"
	| "tool"
	| "api_req_failed"

export type ClaudeSay =
	| "task"
	| "error"
	| "api_req_started"
	| "api_req_finished"
	| "text"
	| "completion_result"
	| "user_feedback"
	| "api_req_retried"
	| "command_output"

export interface ClaudeSayTool {
	tool:
		| "editedExistingFile"
		| "newFileCreated"
		| "readFile"
		| "listFilesTopLevel"
		| "listFilesRecursive"
		| "viewSourceCodeDefinitionsTopLevel"
	path?: string
	diff?: string
	content?: string
}

export interface ContentBlock {
	type: string
	text?: string
	[key: string]: any
}
