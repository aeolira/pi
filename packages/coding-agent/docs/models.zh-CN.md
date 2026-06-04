# 自定义模型

通过 `~/.pi/agent/models.json` 添加自定义提供商和模型（Ollama、vLLM、LM Studio、代理）。

## 目录

- [最简示例](#最简示例)
- [完整示例](#完整示例)
- [支持的 API](#支持的-api)
- [提供商配置](#提供商配置)
- [模型配置](#模型配置)
- [覆盖内置提供商](#覆盖内置提供商)
- [按模型覆盖](#按模型覆盖)
- [Anthropic Messages 兼容性](#anthropic-messages-兼容性)
- [OpenAI 兼容性](#openai-兼容性)

## 最简示例

对于本地模型（Ollama、LM Studio、vLLM），每个模型只需要 `id`：

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "llama3.1:8b" },
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

`apiKey` 是必需的，但 Ollama 忽略它，因此任何值都可以。

一些 OpenAI 兼容服务器不理解用于推理能力模型的 `developer` 角色。对于这些提供商，将 `compat.supportsDeveloperRole` 设为 `false`，以便 pi 将 system prompt 作为 `system` 消息发送。如果服务器也不支持 `reasoning_effort`，同样将 `compat.supportsReasoningEffort` 设为 `false`。

可以在提供商级别设置 `compat` 以应用于所有模型，或在模型级别覆盖特定模型。这通常适用于 Ollama、vLLM、SGLang 和类似的 OpenAI 兼容服务器。

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        {
          "id": "gpt-oss:20b",
          "reasoning": true
        }
      ]
    }
  }
}
```

## 完整示例

在需要特定值时覆盖默认值：

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        {
          "id": "llama3.1:8b",
          "name": "Llama 3.1 8B (Local)",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    }
  }
}
```

每次打开 `/model` 时文件会重新加载。会话期间编辑即可，无需重启。

## Google AI Studio 示例

使用带有 `baseUrl` 的 `google-generative-ai` 添加来自 Google AI Studio 的模型，包括自定义 Gemma 4 条目：

```json
{
  "providers": {
    "my-google": {
      "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
      "api": "google-generative-ai",
      "apiKey": "$GEMINI_API_KEY",
      "models": [
        {
          "id": "gemma-4-31b-it",
          "name": "Gemma 4 31B",
          "input": ["text", "image"],
          "contextWindow": 262144,
          "reasoning": true
        }
      ]
    }
  }
}
```

向 `google-generative-ai` API 类型添加自定义模型时需要 `baseUrl`。

## 支持的 API

| API | 描述 |
|-----|-------------|
| `openai-completions` | OpenAI Chat Completions（兼容性最广） |
| `openai-responses` | OpenAI Responses API |
| `anthropic-messages` | Anthropic Messages API |
| `google-generative-ai` | Google Generative AI |

在提供商级别（所有模型的默认值）或模型级别（按模型覆盖）设置 `api`。

## 提供商配置

| 字段 | 描述 |
|-------|-------------|
| `baseUrl` | API 端点 URL |
| `api` | API 类型（见上文） |
| `apiKey` | API key（值解析见下文） |
| `headers` | 自定义 headers（值解析见下文） |
| `authHeader` | 设为 `true` 自动添加 `Authorization: Bearer <apiKey>` |
| `models` | 模型配置数组 |
| `modelOverrides` | 该提供商上内置模型的按模型覆盖 |

### 值解析

`apiKey` 和 `headers` 字段支持命令执行、环境变量插值和字面值：

- **Shell 命令：** 开头的 `"!command"` 将整个值作为命令执行并使用 stdout
  ```json
  "apiKey": "!security find-generic-password -ws 'anthropic'"
  "apiKey": "!op read 'op://vault/item/credential'"
  ```
- **环境变量插值：** `"$ENV_VAR"` 或 `"${ENV_VAR}"` 使用指定变量的值。插值可嵌入更大字面值中。
  ```json
  "apiKey": "$MY_API_KEY"
  "apiKey": "${KEY_PREFIX}_${KEY_SUFFIX}"
  ```
  `$FOO_BAR` 表示变量 `FOO_BAR`；当 `BAR` 为字面文本时使用 `${FOO}_BAR`。缺失的环境变量会使值不可解析。
- **转义：** `"$$"` 输出字面 `"$"`；`"$!"` 输出字面 `"!"` 而不触发命令执行。
  ```json
  "apiKey": "$$literal-dollar-prefix"
  "apiKey": "$!literal-bang-prefix"
  ```
- **字面值：** 直接使用
  ```json
  "apiKey": "sk-..."
  ```

旧的纯大写环境变量风格值如 `MY_API_KEY` 会在启动时迁移为 `$MY_API_KEY`。

对于 `models.json`，Shell 命令在请求时解析。pi 有意不对任意命令应用内置的 TTL、过期复用或恢复逻辑。不同命令需要不同的缓存和失败策略，pi 无法推断正确的策略。

如果你的命令速度慢、代价高、有速率限制，或在瞬时失败时应继续使用之前的值，将其包装在你自己的脚本或命令中，实现你期望的缓存或 TTL 行为。

`/model` 可用性检查使用已配置的认证存在性，不执行 shell 命令。

### 自定义 Headers

```json
{
  "providers": {
    "custom-proxy": {
      "baseUrl": "https://proxy.example.com/v1",
      "apiKey": "$MY_API_KEY",
      "api": "anthropic-messages",
      "headers": {
        "x-portkey-api-key": "$PORTKEY_API_KEY",
        "x-secret": "!op read 'op://vault/item/secret'"
      },
      "models": [...]
    }
  }
}
```

## 模型配置

| 字段 | 必需 | 默认值 | 描述 |
|-------|----------|---------|-------------|
| `id` | 是 | — | 模型标识符（传给 API） |
| `name` | 否 | `id` | 人类可读的模型标签。用于匹配（`--model` 模式）并显示在模型详情/状态文本中。 |
| `api` | 否 | 提供商的 `api` | 覆盖该模型的提供商 API |
| `reasoning` | 否 | `false` | 支持扩展思考 |
| `thinkingLevelMap` | 否 | 省略 | 将 pi 思考级别映射到提供商值并标记不支持的级别（见下文） |
| `input` | 否 | `["text"]` | 输入类型：`["text"]` 或 `["text", "image"]` |
| `contextWindow` | 否 | `128000` | 上下文窗口大小（token） |
| `maxTokens` | 否 | `16384` | 最大输出 token 数 |
| `cost` | 否 | 全零 | `{"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0}`（每百万 token） |
| `compat` | 否 | 提供商的 `compat` | 提供商兼容性覆盖。两者都设置时会与提供商级别 `compat` 合并。 |

当前行为：
- `/model` 和 `--list-models` 按模型 `id` 列出条目。
- 配置的 `name` 用于模型匹配和详情/状态文本。

### 思考级别映射

在模型上使用 `thinkingLevelMap` 描述模型特定的思考控制。键为 pi 思考级别：`off`、`minimal`、`low`、`medium`、`high`、`xhigh`。

值为三态：

| 值 | 含义 |
|-------|---------|
| 省略 | 级别受支持，使用提供商的默认映射 |
| string | 级别受支持，将此值发送给提供商 |
| `null` | 级别不受支持，隐藏/跳过/钳制掉 |

仅支持 off、high 和 max 推理的模型示例：

```json
{
  "id": "deepseek-v4-pro",
  "reasoning": true,
  "thinkingLevelMap": {
    "minimal": null,
    "low": null,
    "medium": null,
    "high": "high",
    "xhigh": "max"
  }
}
```

思考无法禁用的模型示例：

```json
{
  "id": "always-thinking-model",
  "reasoning": true,
  "thinkingLevelMap": {
    "off": null
  }
}
```

迁移：使用 `compat.reasoningEffortMap` 的旧配置应将映射迁移到模型级别的 `thinkingLevelMap`。对不应在 UI 中出现的级别使用 `null`。

## 覆盖内置提供商

通过代理路由内置提供商而无需重新定义模型：

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1"
    }
  }
}
```

所有内置 Anthropic 模型仍然可用。现有 OAuth 或 API key 认证继续有效。

要将自定义模型合并到内置提供商，包含 `models` 数组：

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1",
      "apiKey": "$ANTHROPIC_API_KEY",
      "api": "anthropic-messages",
      "models": [...]
    }
  }
}
```

合并语义：
- 保留内置模型。
- 自定义模型在提供商内按 `id` 进行 upsert。
- 如果自定义模型 `id` 与内置模型 `id` 匹配，自定义模型替换该内置模型。
- 如果自定义模型 `id` 为新 id，则添加到内置模型旁边。

## 按模型覆盖

使用 `modelOverrides` 自定义特定内置模型，而无需替换提供商的完整模型列表。

```json
{
  "providers": {
    "openrouter": {
      "modelOverrides": {
        "anthropic/claude-sonnet-4": {
          "name": "Claude Sonnet 4 (Bedrock Route)",
          "compat": {
            "openRouterRouting": {
              "only": ["amazon-bedrock"]
            }
          }
        }
      }
    }
  }
}
```

`modelOverrides` 支持以下按模型字段：`name`、`reasoning`、`input`、`cost`（部分）、`contextWindow`、`maxTokens`、`headers`、`compat`。

行为说明：
- `modelOverrides` 应用于内置提供商模型。
- 未知模型 ID 被忽略。
- 可结合提供商级别 `baseUrl`/`headers` 与 `modelOverrides`。
- 如果提供商还定义了 `models`，自定义模型在内置覆盖之后合并。具有相同 `id` 的自定义模型替换覆盖后的内置模型条目。

## Anthropic Messages 兼容性

对于使用 `api: "anthropic-messages"` 的提供商或代理，使用 `compat` 控制 Anthropic 特定的请求兼容性。

默认情况下 pi 按工具发送 `eager_input_streaming: true`。如果代理或 Anthropic 兼容后端拒绝该字段，将 `supportsEagerToolInputStreaming` 设为 `false`。Pi 将省略 `tools[].eager_input_streaming` 并改为在启用工具的请求中发送旧的 `fine-grained-tool-streaming-2025-05-14` beta header。

一些 Anthropic 模型需要自适应思考（`thinking.type: "adaptive"` 加上 `output_config.effort`），而不是旧的基于预算的思考 payload。内置模型自动设置此项。对于路由到这些模型的自定义提供商或别名，将 `forceAdaptiveThinking` 设为 `true`。

一些 Anthropic 兼容提供商发出带有空签名的思考块，并仍然期望在重放时包含它们。仅对这些提供商将 `allowEmptySignature` 设为 `true`；真正的 Anthropic 拒绝空的思考签名。

```json
{
  "providers": {
    "anthropic-proxy": {
      "baseUrl": "https://proxy.example.com",
      "api": "anthropic-messages",
      "apiKey": "$ANTHROPIC_PROXY_KEY",
      "compat": {
        "supportsEagerToolInputStreaming": false,
        "supportsLongCacheRetention": true,
        "forceAdaptiveThinking": true,
        "allowEmptySignature": true
      },
      "models": [
        {
          "id": "claude-opus-4-7",
          "reasoning": true,
          "input": ["text", "image"]
        }
      ]
    }
  }
}
```

| 字段 | 描述 |
|-------|-------------|
| `supportsEagerToolInputStreaming` | 提供商是否接受按工具的 `eager_input_streaming`。默认：`true`。设为 `false` 省略该字段并在启用工具的请求中使用旧的细粒度工具流式 beta header。 |
| `supportsLongCacheRetention` | 提供商是否接受 Anthropic 长缓存保留（`cache_control.ttl: "1h"`），当缓存保留为 `long` 时。默认：`true`。 |
| `sendSessionAffinityHeaders` | 当启用缓存时是否从会话 id 发送 `x-session-affinity`。默认：对已知提供商自动检测。 |
| `supportsCacheControlOnTools` | 提供商是否接受工具定义上的 Anthropic 风格 `cache_control` 标记。默认：`true`。 |
| `forceAdaptiveThinking` | 是否为此模型发送自适应思考（`thinking.type: "adaptive"` 加上 `output_config.effort`）。内置自适应模型自动设置此项。默认：`false`。 |
| `allowEmptySignature` | 是否将空思考签名重放为 `signature: ""` 而非将思考转换为文本。默认：`false`。 |

## OpenAI 兼容性

对于部分 OpenAI 兼容的提供商，使用 `compat` 字段。

- 提供商级别的 `compat` 为提供商下的所有模型应用默认值。
- 模型级别的 `compat` 为特定模型覆盖提供商级别的值。

```json
{
  "providers": {
    "local-llm": {
      "baseUrl": "http://localhost:8080/v1",
      "api": "openai-completions",
      "compat": {
        "supportsUsageInStreaming": false,
        "maxTokensField": "max_tokens"
      },
      "models": [...]
    }
  }
}
```

| 字段 | 描述 |
|-------|-------------|
| `supportsStore` | 提供商支持 `store` 字段 |
| `supportsDeveloperRole` | 使用 `developer` 角色还是 `system` 角色 |
| `supportsReasoningEffort` | 支持 `reasoning_effort` 参数 |
| `supportsUsageInStreaming` | 支持 `stream_options: { include_usage: true }`（默认：`true`） |
| `maxTokensField` | 使用 `max_completion_tokens` 还是 `max_tokens` |
| `requiresToolResultName` | 在工具结果消息中包含 `name` |
| `requiresAssistantAfterToolResult` | 在工具结果之后的用户消息前插入 assistant 消息 |
| `requiresThinkingAsText` | 将思考块转换为纯文本 |
| `requiresReasoningContentOnAssistantMessages` | 当启用推理时，在重放的所有 assistant 消息上包含空的 `reasoning_content` |
| `thinkingFormat` | 使用 `reasoning_effort`、`openrouter`、`deepseek`、`together`、`zai`、`qwen` 或 `qwen-chat-template` 思考参数 |
| `cacheControlFormat` | 在 system prompt、最后一个工具定义以及最后一条用户/assistant 文本内容上使用 Anthropic 风格的 `cache_control` 标记。目前仅支持 `anthropic`。 |
| `supportsStrictMode` | 在工具定义中包含 `strict` 字段 |
| `supportsLongCacheRetention` | 当缓存保留为 `long` 时提供商是否接受长缓存保留：对于 OpenAI prompt 缓存为 `prompt_cache_retention: "24h"`，当 `cacheControlFormat` 为 `anthropic` 时为 `cache_control.ttl: "1h"`。默认：`true`。 |
| `openRouterRouting` | OpenRouter 提供商路由偏好。该对象原样发送在 [OpenRouter API 请求](https://openrouter.ai/docs/guides/routing/provider-selection)的 `provider` 字段中。 |
| `vercelGatewayRouting` | Vercel AI Gateway 路由配置，用于提供商选择（`only`、`order`） |

`openrouter` 使用 `reasoning: { effort }`。`together` 使用 `reasoning: { enabled }`，当 `supportsReasoningEffort` 启用时也使用 `reasoning_effort`。`qwen` 使用顶层 `enable_thinking`。对于要求 `chat_template_kwargs.enable_thinking` 的本地 Qwen 兼容服务器，使用 `qwen-chat-template`。

`cacheControlFormat: "anthropic"` 适用于通过 `cache_control` 标记暴露 Anthropic 风格 prompt 缓存的 OpenAI 兼容提供商（在文本内容和工具定义上）。

示例：

```json
{
  "providers": {
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "$OPENROUTER_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "openrouter/anthropic/claude-3.5-sonnet",
          "name": "OpenRouter Claude 3.5 Sonnet",
          "compat": {
            "openRouterRouting": {
              "allow_fallbacks": true,
              "require_parameters": false,
              "data_collection": "deny",
              "zdr": true,
              "enforce_distillable_text": false,
              "order": ["anthropic", "amazon-bedrock", "google-vertex"],
              "only": ["anthropic", "amazon-bedrock"],
              "ignore": ["gmicloud", "friendli"],
              "quantizations": ["fp16", "bf16"],
              "sort": {
                "by": "price",
                "partition": "model"
              },
              "max_price": {
                "prompt": 10,
                "completion": 20
              },
              "preferred_min_throughput": {
                "p50": 100,
                "p90": 50
              },
              "preferred_max_latency": {
                "p50": 1,
                "p90": 3,
                "p99": 5
              }
            }
          }
        }
      ]
    }
  }
}
```

Vercel AI Gateway 示例：

```json
{
  "providers": {
    "vercel-ai-gateway": {
      "baseUrl": "https://ai-gateway.vercel.sh/v1",
      "apiKey": "$AI_GATEWAY_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "moonshotai/kimi-k2.5",
          "name": "Kimi K2.5 (Fireworks via Vercel)",
          "reasoning": true,
          "input": ["text", "image"],
          "cost": { "input": 0.6, "output": 3, "cacheRead": 0, "cacheWrite": 0 },
          "contextWindow": 262144,
          "maxTokens": 262144,
          "compat": {
            "vercelGatewayRouting": {
              "only": ["fireworks", "novita"],
              "order": ["fireworks", "novita"]
            }
          }
        }
      ]
    }
  }
}
```
