# 提供商

Pi 通过 OAuth 支持基于订阅的提供商，并通过环境变量或 auth 文件支持 API key 提供商。对于每个提供商，pi 知道所有可用的模型。列表随每次 pi 发布更新。

## 目录

- [订阅](#订阅)
- [API Keys](#api-keys)
- [Auth 文件](#auth-文件)
- [云提供商](#云提供商)
- [自定义提供商](#自定义提供商)
- [解析顺序](#解析顺序)

## 订阅

在交互模式下使用 `/login`，然后选择提供商：

- ChatGPT Plus/Pro (Codex)
- Claude Pro/Max
- GitHub Copilot

使用 `/logout` 清除凭据。Token 存储在 `~/.pi/agent/auth.json` 中，过期时自动刷新。

### OpenAI Codex

- 需要 ChatGPT Plus 或 Pro 订阅
- 获得 OpenAI 官方认可：[Codex for OSS](https://developers.openai.com/community/codex-for-oss)

### Claude Pro/Max

Anthropic 订阅认证对 Claude Pro/Max 账户有效。第三方工具使用的用量从[额外用量](https://claude.ai/settings/usage)中扣除，按 token 计费，不计入 Claude 计划限额。

### GitHub Copilot

- 按 Enter 使用 github.com，或输入 GitHub Enterprise Server 域名
- 如果出现"模型不支持"，在 VS Code 中启用：Copilot Chat → 模型选择器 → 选择模型 → "Enable"

## API Keys

### 环境变量或 Auth 文件

在交互模式下使用 `/login` 并选择提供商将 API key 存储在 `auth.json` 中，或通过环境变量设置凭据：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

| 提供商 | 环境变量 | `auth.json` key |
|----------|----------------------|------------------|
| Anthropic | `ANTHROPIC_API_KEY` | `anthropic` |
| Azure OpenAI Responses | `AZURE_OPENAI_API_KEY` | `azure-openai-responses` |
| OpenAI | `OPENAI_API_KEY` | `openai` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek` |
| Google Gemini | `GEMINI_API_KEY` | `google` |
| Mistral | `MISTRAL_API_KEY` | `mistral` |
| Groq | `GROQ_API_KEY` | `groq` |
| Cerebras | `CEREBRAS_API_KEY` | `cerebras` |
| Cloudflare AI Gateway | `CLOUDFLARE_API_KEY`（+ `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_GATEWAY_ID`） | `cloudflare-ai-gateway` |
| Cloudflare Workers AI | `CLOUDFLARE_API_KEY`（+ `CLOUDFLARE_ACCOUNT_ID`） | `cloudflare-workers-ai` |
| xAI | `XAI_API_KEY` | `xai` |
| OpenRouter | `OPENROUTER_API_KEY` | `openrouter` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway` |
| ZAI | `ZAI_API_KEY` | `zai` |
| OpenCode Zen | `OPENCODE_API_KEY` | `opencode` |
| OpenCode Go | `OPENCODE_API_KEY` | `opencode-go` |
| Hugging Face | `HF_TOKEN` | `huggingface` |
| Fireworks | `FIREWORKS_API_KEY` | `fireworks` |
| Together AI | `TOGETHER_API_KEY` | `together` |
| Kimi For Coding | `KIMI_API_KEY` | `kimi-coding` |
| MiniMax | `MINIMAX_API_KEY` | `minimax` |
| MiniMax（中国） | `MINIMAX_CN_API_KEY` | `minimax-cn` |
| 小米 MiMo | `XIAOMI_API_KEY` | `xiaomi` |
| 小米 MiMo Token Plan（中国） | `XIAOMI_TOKEN_PLAN_CN_API_KEY` | `xiaomi-token-plan-cn` |
| 小米 MiMo Token Plan（阿姆斯特丹） | `XIAOMI_TOKEN_PLAN_AMS_API_KEY` | `xiaomi-token-plan-ams` |
| 小米 MiMo Token Plan（新加坡） | `XIAOMI_TOKEN_PLAN_SGP_API_KEY` | `xiaomi-token-plan-sgp` |

环境变量和 `auth.json` key 参考：[`const envMap`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/env-api-keys.ts) 位于 [`packages/ai/src/env-api-keys.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/env-api-keys.ts)。

#### Auth 文件

将凭据存储在 `~/.pi/agent/auth.json` 中：

```json
{
  "anthropic": { "type": "api_key", "key": "sk-ant-..." },
  "openai": { "type": "api_key", "key": "sk-..." },
  "deepseek": { "type": "api_key", "key": "sk-..." },
  "google": { "type": "api_key", "key": "..." },
  "opencode": { "type": "api_key", "key": "..." },
  "opencode-go": { "type": "api_key", "key": "..." },
  "together": { "type": "api_key", "key": "..." },
  "xiaomi": { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-cn":  { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-ams": { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-sgp": { "type": "api_key", "key": "..." }
}
```

文件以 `0600` 权限创建（仅用户可读写）。Auth 文件凭据优先级高于环境变量。

### Key 解析

`key` 字段支持命令执行、环境变量插值和字面值：

- **Shell 命令：** 开头的 `"!command"` 将整个值作为命令执行并使用 stdout（缓存在进程生命周期内）
  ```json
  { "type": "api_key", "key": "!security find-generic-password -ws 'anthropic'" }
  { "type": "api_key", "key": "!op read 'op://vault/item/credential'" }
  ```
- **环境变量插值：** `"$ENV_VAR"` 或 `"${ENV_VAR}"` 使用指定变量的值。插值可嵌入更大字面值中。
  ```json
  { "type": "api_key", "key": "$MY_ANTHROPIC_KEY" }
  { "type": "api_key", "key": "${KEY_PREFIX}_${KEY_SUFFIX}" }
  ```
  `$FOO_BAR` 表示变量 `FOO_BAR`；当 `BAR` 为字面文本时使用 `${FOO}_BAR`。缺失的环境变量会使值不可解析。
- **转义：** `"$$"` 输出字面 `"$"`；`"$!"` 输出字面 `"!"` 而不触发命令执行。
  ```json
  { "type": "api_key", "key": "$$literal-dollar-prefix" }
  { "type": "api_key", "key": "$!literal-bang-prefix" }
  ```
- **字面值：** 直接使用
  ```json
  { "type": "api_key", "key": "sk-ant-..." }
  { "type": "api_key", "key": "public" }
  ```

旧的纯大写环境变量风格值如 `MY_API_KEY` 会在启动时迁移为 `$MY_API_KEY`。OAuth 凭据也在 `/login` 后存储在此处并自动管理。

## 云提供商

### Azure OpenAI

```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.openai.azure.com
# 也支持：https://your-resource.cognitiveservices.azure.com
# 根端点会自动规范化为 /openai/v1
# 或使用资源名称代替 base URL
export AZURE_OPENAI_RESOURCE_NAME=your-resource

# 可选
export AZURE_OPENAI_API_VERSION=2024-02-01
export AZURE_OPENAI_DEPLOYMENT_NAME_MAP=gpt-4=my-gpt4,gpt-4o=my-gpt4o
```

### Amazon Bedrock

```bash
# 方式一：AWS 配置文件
export AWS_PROFILE=your-profile

# 方式二：IAM Key
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...

# 方式三：Bearer Token
export AWS_BEARER_TOKEN_BEDROCK=...

# 可选区域（默认为 us-east-1）
export AWS_REGION=us-west-2
```

也支持 ECS 任务角色（`AWS_CONTAINER_CREDENTIALS_*`）和 IRSA（`AWS_WEB_IDENTITY_TOKEN_FILE`）。

```bash
pi --provider amazon-bedrock --model us.anthropic.claude-sonnet-4-20250514-v1:0
```

对于 ID 包含可识别模型名称的 Claude 模型（基础模型和系统定义的推理配置文件），prompt 缓存会自动启用。对于应用程序推理配置文件（其 ARN 不包含模型名称），设置 `AWS_BEDROCK_FORCE_CACHE=1` 启用缓存点：

```bash
export AWS_BEDROCK_FORCE_CACHE=1
pi --provider amazon-bedrock --model arn:aws:bedrock:us-east-1:123456789012:application-inference-profile/abc123
```

如果连接到 Bedrock API 代理，可使用以下环境变量：

```bash
# 设置 Bedrock 代理的 URL（标准 AWS SDK 环境变量）
export AWS_ENDPOINT_URL_BEDROCK_RUNTIME=https://my.corp.proxy/bedrock

# 如果代理不需要认证则设置
export AWS_BEDROCK_SKIP_AUTH=1

# 如果代理仅支持 HTTP/1.1 则设置
export AWS_BEDROCK_FORCE_HTTP1=1
```

### Cloudflare AI Gateway

`CLOUDFLARE_API_KEY` 可通过 `/login` 设置。account ID 和 gateway slug 必须设置为环境变量。

```bash
export CLOUDFLARE_API_KEY=...           # 或使用 /login
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_GATEWAY_ID=...        # 在 dash.cloudflare.com → AI → AI Gateway 创建
pi --provider cloudflare-ai-gateway --model "claude-sonnet-4-5"
```

通过 Cloudflare AI Gateway 路由到 OpenAI、Anthropic 和 Workers AI。Workers AI 使用 Unified API（`/compat`）和带前缀的模型 ID（`workers-ai/@cf/...`）。OpenAI 使用 OpenAI 透传路由（`/openai`）和原生 OpenAI 模型 ID 如 `gpt-5.1`。Anthropic 使用 Anthropic 透传路由（`/anthropic`）和原生 Anthropic 模型 ID 如 `claude-sonnet-4-5`。

AI Gateway 认证使用 `CLOUDFLARE_API_KEY` 作为 `cf-aig-authorization`。上游认证可以是以下之一：

| 模式 | 请求认证 | 上游认证 |
|------|--------------|---------------|
| Workers AI | 仅 Cloudflare token | Cloudflare 原生 |
| 统一计费 | 仅 Cloudflare token | Cloudflare 处理上游认证并扣除额度 |
| 存储 BYOK | 仅 Cloudflare token | Cloudflare 注入 AI Gateway 面板中存储的提供商 key |
| 内联 BYOK | Cloudflare token 加上游 `Authorization` header | 请求提供上游提供商 key |

对于正常 pi 使用，推荐统一计费或存储 BYOK。内联 BYOK 需要为 Cloudflare AI Gateway 提供商配置额外的上游 `Authorization` header，例如通过 `models.json` 提供商/模型覆盖。

### Cloudflare Workers AI

`CLOUDFLARE_API_KEY` 可通过 `/login` 设置。`CLOUDFLARE_ACCOUNT_ID` 必须设置为环境变量。

```bash
export CLOUDFLARE_API_KEY=...           # 或使用 /login
export CLOUDFLARE_ACCOUNT_ID=...
pi --provider cloudflare-workers-ai --model "@cf/moonshotai/kimi-k2.6"
```

Pi 自动设置 `x-session-affinity` 以获取[前缀缓存](https://developers.cloudflare.com/workers-ai/features/prompt-caching/)折扣。

### Google Vertex AI

使用应用程序默认凭据：

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_CLOUD_LOCATION=us-central1
```

或设置 `GOOGLE_APPLICATION_CREDENTIALS` 指向服务账号 key 文件。

## 自定义提供商

**通过 models.json：** 添加 Ollama、LM Studio、vLLM 或任何支持受支持 API（OpenAI Completions、OpenAI Responses、Anthropic Messages、Google Generative AI）的提供商。参见 [models.md](models.md)。

**通过扩展：** 对于需要自定义 API 实现或 OAuth 流程的提供商，创建扩展。参见 [custom-provider.md](custom-provider.md) 和 [examples/extensions/custom-provider-gitlab-duo](../examples/extensions/custom-provider-gitlab-duo/)。

## 解析顺序

解析提供商凭据时的顺序：

1. CLI `--api-key` 选项
2. `auth.json` 条目（API key 或 OAuth token）
3. 环境变量
4. 来自 `models.json` 的自定义提供商 key
