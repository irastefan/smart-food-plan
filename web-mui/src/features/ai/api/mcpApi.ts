import { ApiError, getAccessToken } from "../../../shared/api/http";
import { getApiBaseUrl } from "../../../shared/config/env";

export type McpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  tags?: string[];
  auth?: string;
  public?: boolean;
};

type McpListResponse = {
  result?: {
    tools?: McpTool[];
  };
};

type McpCallResponse = {
  result?: unknown;
  error?: {
    message?: string;
  };
};

async function mcpRequest<T>(body: Record<string, unknown>): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new ApiError(`MCP request failed (${response.status})`, response.status, payload);
  }

  return payload as T;
}

export async function listMcpTools(): Promise<McpTool[]> {
  const response = await mcpRequest<McpListResponse>({
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "tools/list",
    params: {}
  });

  return response.result?.tools ?? [];
}

export async function callMcpTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const response = await mcpRequest<McpCallResponse>({
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "tools/call",
    params: {
      name,
      arguments: args
    }
  });

  if (response.error?.message) {
    throw new Error(response.error.message);
  }

  return response.result ?? null;
}
