import React from "react"
import {
  VSCodeDropdown,
  VSCodeOption,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react"
import "../App.css"
import { ApiConfiguration } from "../../../src/shared/api"

interface ApiOptionsProps {
  apiConfiguration?: ApiConfiguration
  onApiConfigurationChange: (configuration: ApiConfiguration) => void
}

export function ApiOptions({
  apiConfiguration,
  onApiConfigurationChange,
}: ApiOptionsProps) {
  const handleInputChange =
    (key: keyof ApiConfiguration) =>
    (event: any) => {
      const value = event.target.value
      onApiConfigurationChange({ ...apiConfiguration, [key]: value } as ApiConfiguration)
    }

  return (
    <div className="api-options">
      <div className="dropdown-container">
        <label htmlFor="api-provider">API Provider</label>
        <VSCodeDropdown
          id="api-provider"
          value={apiConfiguration?.apiProvider || "anthropic"}
          onChange={handleInputChange("apiProvider")}>
          <VSCodeOption value="anthropic">Anthropic</VSCodeOption>
          <VSCodeOption value="openrouter">OpenRouter</VSCodeOption>
          <VSCodeOption value="bedrock">AWS Bedrock</VSCodeOption>
        </VSCodeDropdown>
      </div>

      {(apiConfiguration?.apiProvider === "anthropic" || !apiConfiguration?.apiProvider) && (
        <div>
          <VSCodeTextField
            value={apiConfiguration?.apiKey || ""}
            style={{ width: "100%" }}
            onInput={handleInputChange("apiKey")}
            placeholder="Enter API Key...">
            <span style={{ fontWeight: 500 }}>API Key</span>
          </VSCodeTextField>
          <div style={{ marginTop: 8 }}>
            You can get an API key from{" "}
            <a
              href="https://www.anthropic.com"
              target="_blank"
              rel="noopener noreferrer">
              anthropic.com
            </a>
          </div>
        </div>
      )}

      {apiConfiguration?.apiProvider === "openrouter" && (
        <div>
          <VSCodeTextField
            value={apiConfiguration?.openRouterApiKey || ""}
            style={{ width: "100%" }}
            onInput={handleInputChange("openRouterApiKey")}
            placeholder="Enter API Key...">
            <span style={{ fontWeight: 500 }}>OpenRouter API Key</span>
          </VSCodeTextField>
          
          <div className="dropdown-container" style={{ marginTop: 16 }}>
            <label htmlFor="openrouter-model">
              <span style={{ fontWeight: 500 }}>OpenRouter Model</span>
            </label>
            <VSCodeDropdown
              id="openrouter-model"
              value={apiConfiguration?.openRouterModel || ""}
              onChange={handleInputChange("openRouterModel")}>
              <VSCodeOption value="">Select a model...</VSCodeOption>
              <VSCodeOption value="anthropic/claude-3-opus-20240229">Claude 3 Opus</VSCodeOption>
              <VSCodeOption value="anthropic/claude-3-sonnet-20240229">Claude 3 Sonnet</VSCodeOption>
              <VSCodeOption value="anthropic/claude-2.1">Claude 2.1</VSCodeOption>
              <VSCodeOption value="openai/gpt-4-turbo-preview">GPT-4 Turbo</VSCodeOption>
              <VSCodeOption value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</VSCodeOption>
            </VSCodeDropdown>
          </div>
          
          <div style={{ marginTop: 8 }}>
            You can get an API key from{" "}
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer">
              openrouter.ai
            </a>
          </div>
        </div>
      )}

      {apiConfiguration?.apiProvider === "bedrock" && (
        <div>
          <VSCodeTextField
            value={apiConfiguration?.awsAccessKey || ""}
            style={{ width: "100%" }}
            onInput={handleInputChange("awsAccessKey")}
            placeholder="Enter Access Key...">
            <span style={{ fontWeight: 500 }}>Access Key</span>
          </VSCodeTextField>
          <VSCodeTextField
            value={apiConfiguration?.awsSecretKey || ""}
            style={{ width: "100%" }}
            onInput={handleInputChange("awsSecretKey")}
            placeholder="Enter Secret Key...">
            <span style={{ fontWeight: 500 }}>Secret Key</span>
          </VSCodeTextField>
          <VSCodeTextField
            value={apiConfiguration?.awsRegion || ""}
            style={{ width: "100%" }}
            onInput={handleInputChange("awsRegion")}
            placeholder="Enter Region...">
            <span style={{ fontWeight: 500 }}>Region</span>
          </VSCodeTextField>
          <div style={{ marginTop: 8 }}>
            You can get your AWS credentials from the{" "}
            <a
              href="https://aws.amazon.com/console/"
              target="_blank"
              rel="noopener noreferrer">
              AWS Management Console
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
