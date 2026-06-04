# 自定义提供商

扩展可以通过 `pi.registerProvider()` 注册自定义模型提供商。这可以实现：

- **代理** - 通过企业代理或 API 网关路由请求
- **自定义端点** - 使用自托管或私有模型部署
- **OAuth/SSO** - 为企业提供商添加认证流程
- **自定义 API** - 为非标准 LLM API 实现流式传输

## 示例扩展

参见这些完整的提供商示例：

- [`examples/extensions/custom-provider-anthropic/`](../examples/extensions/custom-provider-anthropic/)
- [`examples/extensions/custom-provider-gitlab-duo/`](../examples/extensions/custom-provider-gitlab-duo/)

## 目录

- [示例扩展](#示例扩展)
- [快速参考](#快速参考)
- [覆盖现有提供商](#覆盖现有提供商)
- [注册新提供商](#注册新提供商)
- [取消注册提供商](#取消注册提供商)
- [OAuth 支持](#oauth-支持)
- [自定义流式 API](#自定义流式-api)
- [上下文溢出错误](#上下文溢出错误)
- [测试你的实现](#测试你的实现)
- [配置参考](#配置参考)
- [模型定义参考](#模型定义参考)

## 快速参考

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // 覆盖现有提供商的 baseUrl
  pi.registerProvider("anthropic", {
    baseUrl: "https://proxy.example.com"
  });

  // 注册带模型的新提供商
  pi.registerProvider("my-provider", {
    name: "My Provider",
    baseUrl: "https://api.example.com",
    apiKey: "$MY_API_KEY",
    api: "openai-completions",
    models: [
      {
        id: "my-model",
        name: "My Model",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 4096
      }
    ]
  });
}
```

扩展工厂也可以是 `async`。对于动态模型发现，在工厂中获取和注册模型，而非在 `session_start` 中。pi 在启动继续之前等待工厂完成，因此提供商在交互式启动期间和 `pi --list-models` 中均可用。

## 覆盖现有提供商

最简单的用例：将现有提供商重定向到代理。

```typescript
// 所有 Anthropic 请求现在通过你的代理
pi.registerProvider("anthropic", {
  baseUrl: "https://proxy.example.com"
});

// 向 OpenAI 请求添加自定义 headers
pi.registerProvider("openai", {
  headers: {
    "X-Custom-Header": "value"
  }
});

// 同时设置 baseUrl 和 headers
pi.registerProvider("google", {
  baseUrl: "https://ai-gateway.corp.com/google",
  headers: {
    "X-Corp-Auth": "$CORP_AUTH_TOKEN"  // env 变量或字面值
  }
});
```

当仅提供 `baseUrl` 和/或 `headers`（不提供 `models`）时，该提供商的所有现有模型保留并使用新端点。

## 注册新提供商

要添加全新提供商，指定 `models` 以及所需的配置。

如果模型列表来自远程端点，使用异步扩展工厂：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function (pi: ExtensionAPI) {
  const response = await fetch("http://localhost:1234/v1/models");
  const payload = (await response.json()) as {
    data: Array<{
      id: string;
      name?: string;
      context_window?: number;
      max_tokens?: number;
    }>;
  };

  pi.registerProvider("local-openai", {
    baseUrl: "http://localhost:1234/v1",
    apiKey: "$LOCAL_OPENAI_API_KEY",
    api: "openai-completions",
    models: payload.data.map((model) => ({
      id: model.id,
      name: model.name ?? model.id,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.context_window ?? 128000,
      maxTokens: model.max_tokens ?? 4096,
    })),
  });
}
```

这会在启动完成前注册获取到的模型。

```typescript
pi.registerProvider("my-llm", {
  baseUrl: "https://api.my-llm.com/v1",
  apiKey: "$MY_LLM_API_KEY",  // 环境变量引用
  api: "openai-completions",  // 使用的流式 API
  models: [
    {
      id: "my-llm-large",
      name: "My LLM Large",
      reasoning: true,        // 支持扩展思考
      input: ["text", "image"],
      cost: {
        input: 3.0,           // $/百万 token
        output: 15.0,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 200000,
      maxTokens: 16384
    }
  ]
});
```

当提供 `models` 时，它**替换**该提供商的所有现有模型。

`apiKey` 和自定义 header 值使用与 `models.json` 相同的配置值语法：开头的 `!command` 执行命令获取整个值，`$ENV_VAR` 和 `${ENV_VAR}` 插值环境变量，`$$` 输出字面 `$`，`$!` 输出字面 `!`。

## 取消注册提供商

使用 `pi.unregisterProvider(name)` 移除之前通过 `pi.registerProvider(name, ...)` 注册的提供商：

```typescript
// 注册
pi.registerProvider("my-llm", {
  baseUrl: "https://api.my-llm.com/v1",
  apiKey: "$MY_LLM_API_KEY",
  api: "openai-completions",
  models: [
    {
      id: "my-llm-large",
      name: "My LLM Large",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
      contextWindow: 200000,
      maxTokens: 16384
    }
  ]
});

// 稍后移除
pi.unregisterProvider("my-llm");
```

取消注册会移除该提供商的动态模型、API key 后备、OAuth 提供商注册和自定义流处理器注册。被覆盖的任何内置模型或提供商行为将被恢复。

初始加载阶段之后的调用立即生效，无需 `/reload`。

### API 类型

`api` 字段决定使用哪个流式实现：

| API | 适用于 |
|-----|---------|
| `anthropic-messages` | Anthropic Claude API 和兼容服务 |
| `openai-completions` | OpenAI Chat Completions API 和兼容服务 |
| `openai-responses` | OpenAI Responses API |
| `azure-openai-responses` | Azure OpenAI Responses API |
| `openai-codex-responses` | OpenAI Codex Responses API |
| `mistral-conversations` | Mistral SDK Conversations/Chat 流式 |
| `google-generative-ai` | Google Generative AI API |
| `google-vertex` | Google Vertex AI API |
| `bedrock-converse-stream` | Amazon Bedrock Converse API |

大多数 OpenAI 兼容的提供商可使用 `openai-completions`。使用模型级别的 `thinkingLevelMap` 进行模型特定的思考级别设置，使用 `compat` 处理提供商的特殊行为：

```typescript
models: [{
  id: "custom-model",
  // ...
  reasoning: true,
  thinkingLevelMap: {              // 将 pi 级别映射到提供商值；null 隐藏不支持的级别
    minimal: null,
    low: null,
    medium: null,
    high: "default",
    xhigh: "max"
  },
  compat: {
    supportsDeveloperRole: false,   // 使用 "system" 替代 "developer"
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",   // 替代 "max_completion_tokens"
    requiresToolResultName: true,   // 工具结果需要 name 字段
    thinkingFormat: "qwen",        // 顶层 enable_thinking: true
    cacheControlFormat: "anthropic" // Anthropic 风格的 cache_control 标记
  }
}]
```

对于 OpenRouter 风格的 `reasoning: { effort }` 控制使用 `openrouter`。对于 Together 风格的 `reasoning: { enabled }` 控制使用 `together`；启用 `supportsReasoningEffort` 时也会发送 `reasoning_effort`。对于读取 `chat_template_kwargs.enable_thinking` 的本地 Qwen 兼容服务器使用 `qwen-chat-template`。
对于通过 `cache_control` 在 system prompt、最后一个工具定义以及最后的用户/assistant 文本内容上暴露 Anthropic 风格 prompt 缓存的 OpenAI 兼容提供商，使用 `cacheControlFormat: "anthropic"`。

对于使用 `api: "anthropic-messages"` 的 Anthropic 兼容提供商，在上游模型需要自适应思考的模型或提供商上设置 `compat.forceAdaptiveThinking: true`（`thinking.type: "adaptive"` + `output_config.effort`）。内置自适应 Claude 模型自动设置此项。仅对发出空思考签名并期望在重放时使用 `signature: ""` 的提供商设置 `compat.allowEmptySignature: true`。

> 迁移说明：Mistral 从 `openai-completions` 迁移到 `mistral-conversations`。
> 对原生 Mistral 模型使用 `mistral-conversations`。
> 如果你有意通过 `openai-completions` 路由 Mistral 兼容/自定义端点，按需显式设置 `compat` 标志。

### Auth Header

如果你的提供商期望 `Authorization: Bearer <key>` 但不使用标准 API，设置 `authHeader: true`：

```typescript
pi.registerProvider("custom-api", {
  baseUrl: "https://api.example.com",
  apiKey: "$MY_API_KEY",
  authHeader: true,  // 添加 Authorization: Bearer header
  api: "openai-completions",
  models: [...]
});
```

## OAuth 支持

添加与 `/login` 集成的 OAuth/SSO 认证：

```typescript
import type { OAuthCredentials, OAuthLoginCallbacks } from "@earendil-works/pi-ai";

pi.registerProvider("corporate-ai", {
  baseUrl: "https://ai.corp.com/v1",
  api: "openai-responses",
  models: [...],
  oauth: {
    name: "Corporate AI (SSO)",

    async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
      const method = await callbacks.onSelect({
        message: "选择登录方式：",
        options: [
          { id: "browser", label: "浏览器 OAuth" },
          { id: "device", label: "设备代码" }
        ]
      });
      if (!method) throw new Error("登录已取消");

      let code: string;
      if (method === "device") {
        callbacks.onDeviceCode({
          userCode: "ABCD-1234",
          verificationUri: "https://sso.corp.com/device",
          intervalSeconds: 5,
          expiresInSeconds: 900
        });
        code = await pollDeviceCodeUntilComplete();
      } else {
        callbacks.onAuth({ url: "https://sso.corp.com/authorize?..." });
        code = await callbacks.onPrompt({ message: "输入 SSO 代码：" });
      }

      // 交换 token（你的实现）
      const tokens = await exchangeCodeForTokens(code);

      return {
        refresh: tokens.refreshToken,
        access: tokens.accessToken,
        expires: Date.now() + tokens.expiresIn * 1000
      };
    },

    async refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
      const tokens = await refreshAccessToken(credentials.refresh);
      return {
        refresh: tokens.refreshToken ?? credentials.refresh,
        access: tokens.accessToken,
        expires: Date.now() + tokens.expiresIn * 1000
      };
    },

    getApiKey(credentials: OAuthCredentials): string {
      return credentials.access;
    },

    // 可选：根据用户订阅修改模型
    modifyModels(models, credentials) {
      const region = decodeRegionFromToken(credentials.access);
      return models.map(m => ({
        ...m,
        baseUrl: `https://${region}.ai.corp.com/v1`
      }));
    }
  }
});
```

注册后，用户可通过 `/login corporate-ai` 认证。

### OAuthLoginCallbacks

`callbacks` 对象提供三种认证方式：

```typescript
interface OAuthLoginCallbacks {
  // 在浏览器中打开 URL（用于 OAuth 重定向）
  onAuth(params: { url: string }): void;

  // 显示设备代码（用于设备授权流程）
  onDeviceCode(params: {
    userCode: string;
    verificationUri: string;
    intervalSeconds?: number;
    expiresInSeconds?: number;
  }): void;

  // 提示用户输入（用于手动 token 录入）
  onPrompt(params: { message: string }): Promise<string>;

  // 显示交互式选择器，如选择浏览器 OAuth 还是设备代码
  onSelect(params: {
    message: string;
    options: { id: string; label: string }[];
  }): Promise<string | undefined>;
}
```

### OAuthCredentials

凭据持久存储在 `~/.pi/agent/auth.json` 中：

```typescript
interface OAuthCredentials {
  refresh: string;   // Refresh token（用于 refreshToken()）
  access: string;    // Access token（由 getApiKey() 返回）
  expires: number;   // 过期时间戳（毫秒）
}
```

## 自定义流式 API

对于具有非标准 API 的提供商，实现 `streamSimple`。在编写自己的实现之前，先研究现有提供商的实现：

**参考实现：**
- [anthropic.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/anthropic.ts) - Anthropic Messages API
- [mistral.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/mistral.ts) - Mistral Conversations API
- [openai-completions.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/openai-completions.ts) - OpenAI Chat Completions
- [openai-responses.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/openai-responses.ts) - OpenAI Responses API
- [google.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/google.ts) - Google Generative AI
- [amazon-bedrock.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/providers/amazon-bedrock.ts) - AWS Bedrock

### 流式模式

所有提供商遵循相同的模式：

```typescript
import {
  type AssistantMessage,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type SimpleStreamOptions,
  calculateCost,
  createAssistantMessageEventStream,
} from "@earendil-works/pi-ai";

function streamMyProvider(
  model: Model<any>,
  context: Context,
  options?: SimpleStreamOptions
): AssistantMessageEventStream {
  const stream = createAssistantMessageEventStream();

  (async () => {
    // 初始化输出消息
    const output: AssistantMessage = {
      role: "assistant",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: "stop",
      timestamp: Date.now(),
    };

    try {
      // 推送开始事件
      stream.push({ type: "start", partial: output });

      // 发起 API 请求并处理响应...
      // 内容到达时推送内容事件...

      // 推送完成事件
      stream.push({
        type: "done",
        reason: output.stopReason as "stop" | "length" | "toolUse",
        message: output
      });
      stream.end();
    } catch (error) {
      output.stopReason = options?.signal?.aborted ? "aborted" : "error";
      output.errorMessage = error instanceof Error ? error.message : String(error);
      stream.push({ type: "error", reason: output.stopReason, error: output });
      stream.end();
    }
  })();

  return stream;
}
```

### 事件类型

按以下顺序通过 `stream.push()` 推送事件：

1. `{ type: "start", partial: output }` - 流开始

2. 内容事件（可重复，追踪每个块的 `contentIndex`）：
   - `{ type: "text_start", contentIndex, partial }` - 文本块开始
   - `{ type: "text_delta", contentIndex, delta, partial }` - 文本块
   - `{ type: "text_end", contentIndex, content, partial }` - 文本块结束
   - `{ type: "thinking_start", contentIndex, partial }` - 思考开始
   - `{ type: "thinking_delta", contentIndex, delta, partial }` - 思考块
   - `{ type: "thinking_end", contentIndex, content, partial }` - 思考结束
   - `{ type: "toolcall_start", contentIndex, partial }` - 工具调用开始
   - `{ type: "toolcall_delta", contentIndex, delta, partial }` - 工具调用 JSON 块
   - `{ type: "toolcall_end", contentIndex, toolCall, partial }` - 工具调用结束

3. `{ type: "done", reason, message }` 或 `{ type: "error", reason, error }` - 流结束

每个事件中的 `partial` 字段包含当前的 `AssistantMessage` 状态。

### 内容块

按到达顺序向 `output.content` 添加内容块：

```typescript
// 文本块
output.content.push({ type: "text", text: "" });
stream.push({ type: "text_start", contentIndex: output.content.length - 1, partial: output });

// 文本到达时
const block = output.content[contentIndex];
if (block.type === "text") {
  block.text += delta;
  stream.push({ type: "text_delta", contentIndex, delta, partial: output });
}

// 块完成时
stream.push({ type: "text_end", contentIndex, content: block.text, partial: output });
```

### 工具调用

工具调用需要累积 JSON 并解析：

```typescript
output.content.push({
  type: "toolCall",
  id: toolCallId,
  name: toolName,
  arguments: {}
});
stream.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });

let partialJson = "";
partialJson += jsonDelta;
try {
  block.arguments = JSON.parse(partialJson);
} catch {}
stream.push({ type: "toolcall_delta", contentIndex, delta: jsonDelta, partial: output });

stream.push({
  type: "toolcall_end",
  contentIndex,
  toolCall: { type: "toolCall", id, name, arguments: block.arguments },
  partial: output
});
```

### 用量和费用

从 API 响应更新用量并计算费用：

```typescript
output.usage.input = response.usage.input_tokens;
output.usage.output = response.usage.output_tokens;
output.usage.cacheRead = response.usage.cache_read_tokens ?? 0;
output.usage.cacheWrite = response.usage.cache_write_tokens ?? 0;
output.usage.totalTokens = output.usage.input + output.usage.output +
                           output.usage.cacheRead + output.usage.cacheWrite;
calculateCost(model, output.usage);
```

### 上下文溢出错误

当请求超出模型上下文窗口时，pi 可通过压缩对话并重试来自动恢复。

检测在最终化的 assistant 消息上运行：
- `stopReason === "error"`
- `errorMessage` 匹配 pi 已知的溢出模式（参见 [`packages/ai/src/utils/overflow.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/utils/overflow.ts)）

如果你的提供商返回 pi 不认识的溢出错误消息，从注册该提供商的相同扩展中规范化错误。使用 `message_end` 处理器重写 assistant 消息，使其 `errorMessage` 以 pi 可识别的短语开头。通用回退 `context_length_exceeded` 是最安全的选择。

```typescript
const MY_PROVIDER_OVERFLOW_PATTERN = /your provider's overflow phrase/i;

export default function (pi: ExtensionAPI) {
  pi.registerProvider("my-provider", { /* ... */ });

  pi.on("message_end", (event, ctx) => {
    const message = event.message;
    if (message.role !== "assistant") return;
    if (message.stopReason !== "error") return;
    if (
      message.provider !== "my-provider" &&
      ctx.model?.provider !== "my-provider"
    )
      return;

    const errorMessage = message.errorMessage ?? "";
    if (errorMessage.includes("context_length_exceeded")) return;
    if (!MY_PROVIDER_OVERFLOW_PATTERN.test(errorMessage)) return;

    return {
      message: {
        ...message,
        errorMessage: `context_length_exceeded: ${errorMessage}`,
      },
    };
  });
}
```

## 测试你的实现

针对与内置提供商相同的测试套件测试你的提供商。从 [packages/ai/test/](https://github.com/earendil-works/pi-mono/tree/main/packages/ai/test) 复制并适配这些测试文件：

| 测试 | 用途 |
|------|---------|
| `stream.test.ts` | 基本流式、文本输出 |
| `tokens.test.ts` | Token 计数和用量 |
| `abort.test.ts` | AbortSignal 处理 |
| `empty.test.ts` | 空/最小响应 |
| `context-overflow.test.ts` | 上下文窗口限制 |
| `image-limits.test.ts` | 图片输入处理 |
| `unicode-surrogate.test.ts` | Unicode 边界情况 |
| `tool-call-without-result.test.ts` | 工具调用边界情况 |
| `image-tool-result.test.ts` | 工具结果中的图片 |
| `total-tokens.test.ts` | 总 token 计算 |
| `cross-provider-handoff.test.ts` | 提供商间上下文传递 |

用你的提供商/模型对运行测试以验证兼容性。

## 配置参考

```typescript
interface ProviderConfig {
  /** 提供商在 UI 中的显示名称，如 /login。 */
  name?: string;

  /** API 端点 URL。定义模型时必需。 */
  baseUrl?: string;

  /** API key 字面值、env 插值（$ENV_VAR 或 ${ENV_VAR}）或前导 !command。定义模型时必需（除非提供 oauth）。 */
  apiKey?: string;

  /** 流式 API 类型。定义模型时在提供商或模型级别必需。 */
  api?: Api;

  /** 非标准 API 的自定义流式实现。 */
  streamSimple?: (
    model: Model<Api>,
    context: Context,
    options?: SimpleStreamOptions
  ) => AssistantMessageEventStream;

  /** 请求中包含的自定义 headers。值使用与 apiKey 相同的解析语法。 */
  headers?: Record<string, string>;

  /** 如果为 true，自动添加 Authorization: Bearer header（含解析后的 API key）。 */
  authHeader?: boolean;

  /** 要注册的模型。如果提供，替换该提供商的所有现有模型。 */
  models?: ProviderModelConfig[];

  /** 用于 /login 支持的 OAuth 提供商。 */
  oauth?: {
    name: string;
    login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials>;
    refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials>;
    getApiKey(credentials: OAuthCredentials): string;
    modifyModels?(models: Model<Api>[], credentials: OAuthCredentials): Model<Api>[];
  };
}
```

## 模型定义参考

```typescript
interface ProviderModelConfig {
  /** 模型 ID（如 "claude-sonnet-4-20250514"）。 */
  id: string;

  /** 显示名称（如 "Claude 4 Sonnet"）。 */
  name: string;

  /** 此特定模型的 API 类型覆盖。 */
  api?: Api;

  /** 此特定模型的 API 端点 URL 覆盖。 */
  baseUrl?: string;

  /** 模型是否支持扩展思考。 */
  reasoning: boolean;

  /** 将 pi 思考级别映射到提供商/模型特定值；null 标记级别不受支持。 */
  thinkingLevelMap?: Partial<Record<"off" | "minimal" | "low" | "medium" | "high" | "xhigh", string | null>>;

  /** 支持的输入类型。 */
  input: ("text" | "image")[];

  /** 每百万 token 费用（用于用量追踪）。 */
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };

  /** 最大上下文窗口大小（token）。 */
  contextWindow: number;

  /** 最大输出 token 数。 */
  maxTokens: number;

  /** 此特定模型的自定义 headers。 */
  headers?: Record<string, string>;

  /** 所选 API 的兼容性设置。 */
  compat?: {
    // openai-completions
    supportsStore?: boolean;
    supportsDeveloperRole?: boolean;
    supportsReasoningEffort?: boolean;
    supportsUsageInStreaming?: boolean;
    maxTokensField?: "max_completion_tokens" | "max_tokens";
    requiresToolResultName?: boolean;
    requiresAssistantAfterToolResult?: boolean;
    requiresThinkingAsText?: boolean;
    requiresReasoningContentOnAssistantMessages?: boolean;
    thinkingFormat?: "openai" | "openrouter" | "deepseek" | "together" | "zai" | "qwen" | "qwen-chat-template";
    cacheControlFormat?: "anthropic";

    // anthropic-messages
    supportsEagerToolInputStreaming?: boolean;
    supportsLongCacheRetention?: boolean;
    sendSessionAffinityHeaders?: boolean;
    supportsCacheControlOnTools?: boolean;
    forceAdaptiveThinking?: boolean;
    allowEmptySignature?: boolean;
  };
}
```
