# API Key 总费用限制功能需求文档

## 一、需求概述

在现有 API Key 管理系统基础上，新增**总费用限制（Total Cost Limit）**功能。该功能与现有的"每日费用限制"并行存在，用于控制单个 API Key 的累计总费用上限。当 API Key 的累计总费用达到设定限额后，系统将拒绝该 Key 的后续请求。

---

## 二、功能范围

### 2.1 前端功能点

1. **创建 API Key 模态框（CreateApiKeyModal.vue）**
   - 新增表单字段：`totalCostLimit`（总费用限制，单位：美元）
   - 提供快捷设置按钮（如：100、500、1000、5000 美元等）
   - 字段说明：输入 0 或留空表示无限制
   - 表单校验：必须为非负数
   - 提交时将 `totalCostLimit` 转换为数值（parseFloat）

2. **编辑 API Key 模态框（EditApiKeyModal.vue）**
   - 新增表单字段：`totalCostLimit`
   - 加载现有值并允许修改
   - 提供快捷设置按钮
   - 表单校验与转换逻辑同创建模态框

3. **批量编辑 API Key 模态框（BatchEditApiKeyModal.vue）**
   - 新增批量修改选项：`totalCostLimit`
   - 支持为多个选中的 API Key 统一设置总费用限制
   - 提供快捷设置按钮
   - 表单校验与转换逻辑同创建模态框

4. **API Keys 列表视图（ApiKeysView.vue）**
   - 在"限制"列中增加总费用限制的展示
   - **展示逻辑优先级**：
     - 如果设置了 `totalCostLimit > 0`：显示总费用进度条（使用 `LimitProgressBar` 组件，type='total'）
     - 否则，按现有逻辑展示每日费用或窗口费用限制
   - 进度条显示：
     - 当前累计总费用 / 总费用限制
     - 色彩变化：<70% 绿色，70-90% 黄色，>90% 红色
     - 鼠标悬停提示：当前总费用、限额、剩余额度

5. **用量明细模态框（UsageDetailModal.vue）**
   - 在现有的每日费用、周费用进度条基础上，新增"总费用"进度条
   - 显示项：
     - 累计总费用（props.apiKey.totalCost）
     - 总费用限制（props.apiKey.totalCostLimit）
     - 进度条（使用 `LimitProgressBar` 组件，type='total'）
   - 位置建议：放在"每日费用"进度条的上方或下方

6. **统计面板（LimitConfig.vue）**
   - 在现有的 dailyCostLimit 统计基础上，新增 totalCostLimit 的总览展示
   - 显示内容：
     - 总费用限制设置值（statsData.limits.totalCostLimit）
     - 当前累计总费用（currentTotalCost）
     - 进度条（使用 `LimitProgressBar` 组件，type='total'）

7. **前端状态管理（apistats.js）**
   - 新增计算逻辑：当 `limits.totalCostLimit > 0` 时，计算总费用使用率 = `(currentTotalCost / limits.totalCostLimit) * 100`
   - 在统计数据中包含 `totalCost` 和 `totalCostLimit` 字段

8. **限额进度条组件（LimitProgressBar.vue）**
   - 已有 type='daily'、'window'、'opus' 等类型
   - 确保支持 type='total'（如果已支持则无需修改，否则需添加对应的文案和图标）

---

### 2.2 后端功能点

1. **数据模型（apiKeyService.js）**
   - API Key 数据结构新增字段：
     - `totalCostLimit`（总费用限制，浮点数，默认 0 表示无限制）
     - `totalCost`（累计总费用，浮点数，默认 0）
   - 持久化与加载时：
     - 将 `totalCostLimit` 和 `totalCost` 解析为 float
     - 空值或 0 表示无限制
   - 提供方法：
     - `getTotalCost(keyId)`：读取累计总费用
     - `incrementTotalCost(keyId, cost)`：累加总费用（在每次请求产生费用后调用）

2. **Redis 数据存储（redis.js）**
   - 新增 Redis 键：
     - `usage:cost:total:${keyId}`：存储该 API Key 的累计总费用（永久有效，不按日期分割）
   - 新增方法：
     - `getTotalCost(keyId)`：读取 `usage:cost:total:${keyId}` 的值
     - `incrementTotalCost(keyId, amount)`：使用 `INCRBYFLOAT` 原子递增总费用
   - 注意事项：
     - 总费用不会自动过期（与每日费用按日期分割不同）
     - 可能需要提供管理接口手动重置或清零（可选，本期暂不实现）

3. **管理端路由（admin.js）**
   - 在创建/编辑/批量修改 API Key 的路由中：
     - 接收前端传入的 `totalCostLimit` 参数
     - 校验逻辑：
       - 非空时转换为 Number
       - 必须为非负数（>= 0），否则返回 400 错误
       - 0 或空值表示无限制
     - 将通过校验的 `totalCostLimit` 写入 `updates` 对象，随后更新到存储
   - 批量修改时：
     - 支持为多个 keyId 统一设置 `totalCostLimit`
     - 更新逻辑与单个编辑一致

4. **用户侧路由（userRoutes.js）**
   - 在用户创建 API Key 的路由中：
     - 接收 `req.body.totalCostLimit`
     - 校验非负，然后传入 `apiKeyService.createKey()` 方法
   - 在用户查询 API Key 信息的路由中：
     - 返回 `totalCost` 和 `totalCostLimit` 字段

5. **中间件拦截（auth.js - authenticateApiKey）**
   - 在现有的每日费用、周费用限制检查逻辑后，新增总费用限制检查：
     ```javascript
     const { totalCostLimit, totalCost } = validation.keyData

     if (totalCostLimit > 0 && totalCost >= totalCostLimit) {
       logger.warn('Total cost limit exceeded', {
         keyId: validation.keyData.id,
         totalCost,
         totalCostLimit
       })
       return res.status(429).json({
         error: 'Total cost limit exceeded',
         message: `该 API Key 累计总费用已达限额。当前: $${totalCost.toFixed(4)}，限额: $${totalCostLimit.toFixed(2)}`,
         current: totalCost,
         limit: totalCostLimit,
         type: 'total_cost'
       })
     }
     ```
   - 注意：
     - 检查顺序可以与每日费用、周费用并列（不分先后）
     - 确保错误响应中包含当前值、限额值和类型标识，便于前端展示

6. **费用累加逻辑（各模型路由）**
   - 在现有的 `updateRateLimitCounters()` 调用后，除了累加每日费用，还需累加总费用：
     ```javascript
     // openaiRoutes.js / geminiRoutes.js / droidRelayService.js 等
     await apiKeyService.incrementTotalCost(keyId, totalCost)
     ```
   - 位置：在每次请求完成并计算出 `totalCost` 后立即调用
   - 确保所有产生费用的路由都包含此逻辑（Claude、Gemini、OpenAI、Droid、AWS Bedrock、Azure OpenAI 等）

7. **统计接口（apiStats.js）**
   - 在返回统计数据时：
     - 调用 `redis.getTotalCost(keyId)` 获取累计总费用
     - 将 `totalCost` 和 `totalCostLimit` 一并返回给前端，用于图表和进度条展示
   - 示例：
     ```javascript
     const totalCost = await redis.getTotalCost(keyId)
     return {
       ...stats,
       totalCost,
       totalCostLimit: keyData.totalCostLimit
     }
     ```

---

## 三、数据流时序说明

### 3.1 配置阶段（前端）
1. 管理员在创建/编辑/批量修改 Modal 中设置 `totalCostLimit`（美元）
2. 前端表单校验：非负数、空值表示无限制
3. 提交到后端接口（管理端路由）

### 3.2 校验与写入（后端）
1. 管理端路由接收 `totalCostLimit` 参数
2. 校验非负且为数字，否则返回 400 错误
3. 存储为 0 或实际限制值（0/空表示无限制）
4. 写入 Redis：`api_key:${keyId}` 的 `totalCostLimit` 字段

### 3.3 费用产生与累计
1. 用户发送请求到模型接口（如 `/api/v1/messages`）
2. 中间件 `authenticateApiKey` 校验 API Key 有效性
3. 请求转发到 AI 服务提供商，获取响应
4. 各模型路由计算本次请求的 `totalCost`（基于 input/output tokens 和定价）
5. 调用 `apiKeyService.incrementDailyCost(keyId, totalCost)` 累加每日费用
6. **新增**：调用 `apiKeyService.incrementTotalCost(keyId, totalCost)` 累加总费用
7. Redis 更新：
   - `usage:cost:daily:${keyId}:${today}` += totalCost
   - `usage:cost:total:${keyId}` += totalCost

### 3.4 拦截与错误返回
1. 下次请求时，中间件 `authenticateApiKey` 从 Redis 读取：
   - `totalCost = await redis.getTotalCost(keyId)`
   - `totalCostLimit = keyData.totalCostLimit`
2. 判断：`if (totalCostLimit > 0 && totalCost >= totalCostLimit)`
3. 若超限：
   - 记录日志（含当前用量与限额）
   - 返回 429 错误，附带详细信息（当前/限制数值、类型标识）
4. 前端接收错误响应，显示友好提示（如弹窗或 Toast）

### 3.5 展示与统计
1. 前端通过 `ApiKeysView` 列表展示每个 Key 的总费用进度条
2. `UsageDetailModal` 显示详细的总费用统计
3. `LimitConfig` 统计面板展示全局总费用使用情况
4. `apistats` store 计算总费用使用率，用于图表和进度条

---

## 四、与"总费用限制（Total Cost Limit）"直接相关的文件清单

### 4.1 前端文件（需修改）
- `web/admin-spa/src/components/apikeys/CreateApiKeyModal.vue`
- `web/admin-spa/src/components/apikeys/EditApiKeyModal.vue`
- `web/admin-spa/src/components/apikeys/BatchEditApiKeyModal.vue`
- `web/admin-spa/src/views/ApiKeysView.vue`
- `web/admin-spa/src/components/apikeys/UsageDetailModal.vue`
- `web/admin-spa/src/components/stats/LimitConfig.vue`
- `web/admin-spa/src/components/common/LimitProgressBar.vue`（确认支持 type='total'）
- `web/admin-spa/src/stores/apistats.js`

### 4.2 后端文件（需修改）
- `src/middleware/auth.js`（新增总费用限制检查逻辑）
- `src/services/apiKeyService.js`（新增 totalCostLimit、totalCost 字段和相关方法）
- `src/models/redis.js`（新增 getTotalCost、incrementTotalCost 方法）
- `src/routes/admin.js`（新增 totalCostLimit 参数校验与更新逻辑）
- `src/routes/userRoutes.js`（新增 totalCostLimit 参数接收与校验）
- `src/routes/apiStats.js`（新增 totalCost 和 totalCostLimit 返回）
- `src/routes/openaiRoutes.js`（新增 incrementTotalCost 调用）
- `src/routes/geminiRoutes.js`（新增 incrementTotalCost 调用）
- `src/routes/openaiClaudeRoutes.js`（新增 incrementTotalCost 调用）
- `src/services/droidRelayService.js`（新增 incrementTotalCost 调用）
- `src/services/claudeRelayService.js`（新增 incrementTotalCost 调用）
- 其他所有产生费用的路由（AWS Bedrock、Azure OpenAI 等）

---

## 五、UI/UX 设计要求

### 5.1 表单设计
- **字段标签**：总费用限制（Total Cost Limit）
- **单位显示**：美元（USD）或 $
- **输入提示**：输入 0 或留空表示无限制
- **快捷按钮**：100、500、1000、5000、10000 美元（可根据实际需求调整）
- **校验提示**：
  - 必须为非负数
  - 不能为负值
  - 格式错误时显示错误提示

### 5.2 进度条设计
- **类型标识**：type='total'
- **显示内容**：
  - 当前累计总费用 / 总费用限制
  - 示例：$123.45 / $1000.00（12.35%）
- **色彩规则**：
  - 使用率 < 70%：绿色（success）
  - 使用率 70-90%：黄色（warning）
  - 使用率 > 90%：红色（danger）
- **鼠标悬停提示**：
  - 当前总费用：$123.45
  - 限额：$1000.00
  - 剩余：$876.55
  - 使用率：12.35%

### 5.3 列表展示优先级
在 `ApiKeysView.vue` 的"限制"列中，按以下优先级展示：
1. **总费用限制** > 每日费用限制 > 周费用限制 > 窗口费用限制
2. 即：如果设置了 `totalCostLimit > 0`，优先显示总费用进度条
3. 如果未设置总费用限制，则按现有逻辑展示每日费用或其他限制

### 5.4 错误提示设计
当 API Key 因总费用超限被拒绝时，前端应显示友好的错误提示：
- **标题**：总费用限制已达
- **内容**：该 API Key 累计总费用已达限额。当前: $123.45，限额: $1000.00
- **操作建议**：
  - 联系管理员增加限额
  - 或切换到其他 API Key
- **显示方式**：弹窗（Modal）或 Toast 通知

---

## 六、数据结构定义

### 6.1 API Key 数据结构（新增字段）
```javascript
{
  id: 'string',
  key: 'string',
  keyHash: 'string',
  name: 'string',
  // ... 其他现有字段 ...
  dailyCostLimit: 0,          // 每日费用限制（美元）
  dailyCost: 0,               // 今日累计费用（美元）
  totalCostLimit: 0,          // 【新增】总费用限制（美元），0 表示无限制
  totalCost: 0,               // 【新增】累计总费用（美元）
  // ... 其他字段 ...
}
```

### 6.2 Redis 键设计（新增）
```
usage:cost:total:${keyId}   // 存储该 API Key 的累计总费用（永久有效）
```

### 6.3 统计接口返回数据（新增字段）
```javascript
{
  keyId: 'string',
  dailyCost: 0,
  dailyCostLimit: 0,
  weeklyOpusCost: 0,
  weeklyOpusCostLimit: 0,
  totalCost: 0,               // 【新增】累计总费用
  totalCostLimit: 0,          // 【新增】总费用限制
  // ... 其他统计数据 ...
}
```

---

## 七、测试用例

### 7.1 前端测试
1. **创建 API Key**
   - 输入 totalCostLimit = 1000，提交成功
   - 输入 totalCostLimit = 0，提交成功（表示无限制）
   - 输入 totalCostLimit = -100，显示校验错误
   - 留空 totalCostLimit，提交成功（表示无限制）

2. **编辑 API Key**
   - 修改 totalCostLimit 从 1000 → 2000，保存成功
   - 修改 totalCostLimit 从 1000 → 0，保存成功（表示无限制）

3. **批量编辑**
   - 选中 3 个 API Key，批量设置 totalCostLimit = 5000，所有 Key 更新成功

4. **列表展示**
   - Key A：totalCostLimit = 1000，totalCost = 200，显示绿色进度条（20%）
   - Key B：totalCostLimit = 1000，totalCost = 850，显示黄色进度条（85%）
   - Key C：totalCostLimit = 1000，totalCost = 950，显示红色进度条（95%）
   - Key D：totalCostLimit = 0，不显示总费用进度条，显示每日费用进度条

5. **用量明细**
   - 打开 Key A 的用量明细，显示总费用进度条：$200.00 / $1000.00（20%）

### 7.2 后端测试
1. **数据持久化**
   - 创建 API Key 时设置 totalCostLimit = 1000，Redis 中正确存储
   - 读取 API Key 时，totalCostLimit 和 totalCost 正确返回

2. **费用累加**
   - 发送请求产生费用 $5.00，totalCost 从 0 → 5.00
   - 连续发送 10 个请求，每个费用 $10.00，totalCost 从 0 → 100.00

3. **限制拦截**
   - Key A：totalCostLimit = 100，totalCost = 50，请求通过
   - Key A：totalCostLimit = 100，totalCost = 100，请求被拒绝（429 错误）
   - Key A：totalCostLimit = 100，totalCost = 105，请求被拒绝（429 错误）

4. **错误响应**
   - 请求被拒绝时，返回 JSON 包含：
     ```json
     {
       "error": "Total cost limit exceeded",
       "message": "该 API Key 累计总费用已达限额。当前: $100.00，限额: $100.00",
       "current": 100.00,
       "limit": 100.00,
       "type": "total_cost"
     }
     ```

5. **边界情况**
   - totalCostLimit = 0（无限制），totalCost = 1000000，请求通过
   - totalCostLimit = null（无限制），totalCost = 1000000，请求通过

---

## 八、实现优先级

### P0（核心功能，必须实现）
1. 后端数据模型：新增 `totalCostLimit` 和 `totalCost` 字段
2. Redis 方法：`getTotalCost`、`incrementTotalCost`
3. 中间件拦截：总费用限制检查逻辑
4. 费用累加：所有模型路由调用 `incrementTotalCost`
5. 前端表单：创建/编辑/批量编辑 Modal 新增 `totalCostLimit` 字段
6. 前端列表：`ApiKeysView` 显示总费用进度条

### P1（重要功能，尽快实现）
1. 统计接口：返回 `totalCost` 和 `totalCostLimit`
2. 用量明细：`UsageDetailModal` 显示总费用进度条
3. 统计面板：`LimitConfig` 显示总费用统计
4. 错误提示：前端显示友好的超限错误提示

### P2（优化功能，后续迭代）
1. 管理接口：手动重置或清零 totalCost（可选）
2. 日志增强：记录总费用累加的详细日志
3. 监控告警：总费用达到 90% 时发送告警（可选）

---

## 九、注意事项与风险

### 9.1 数据一致性
- 总费用累加必须使用 Redis 的 `INCRBYFLOAT` 原子操作，避免并发请求导致数据不一致
- 所有产生费用的路由都必须调用 `incrementTotalCost`，避免漏计费用

### 9.2 性能考虑
- 总费用累加操作在请求路径上，需确保 Redis 操作高效（通常 < 1ms）
- 如果 Redis 出现性能问题，可考虑使用 Redis 管道（pipeline）批量操作

### 9.3 数据迁移
- 现有 API Key 需要初始化 `totalCostLimit = 0` 和 `totalCost = 0`
- 可编写迁移脚本：
  ```javascript
  // scripts/migrate-total-cost-limit.js
  // 遍历所有 API Key，设置默认值
  ```

### 9.4 费用回溯
- 新功能上线后，历史费用无法回溯到 `totalCost` 字段
- 如需回溯，需从 `usage:cost:daily:*` 汇总历史数据（可选）

### 9.5 用户体验
- 当 Key 因总费用超限被拒绝时，用户可能感到困惑（不清楚为何被拒绝）
- 需在前端清晰展示当前总费用和限额，以及如何解决（联系管理员或切换 Key）

---

## 十、验收标准

### 10.1 功能完整性
- [ ] 创建 API Key 时可设置 totalCostLimit
- [ ] 编辑 API Key 时可修改 totalCostLimit
- [ ] 批量编辑 API Key 时可统一设置 totalCostLimit
- [ ] API Keys 列表正确显示总费用进度条
- [ ] 用量明细模态框正确显示总费用统计
- [ ] 统计面板正确显示总费用总览
- [ ] 当 totalCost >= totalCostLimit 时，请求被正确拒绝
- [ ] 错误响应包含详细的当前值、限额值和类型标识
- [ ] 前端显示友好的超限错误提示

### 10.2 数据准确性
- [ ] totalCost 累加准确（与实际产生的费用一致）
- [ ] 所有产生费用的路由都正确调用 incrementTotalCost
- [ ] Redis 中的 totalCost 与前端显示一致
- [ ] 并发请求场景下，totalCost 累加无误

### 10.3 UI/UX 质量
- [ ] 表单字段布局合理，说明清晰
- [ ] 进度条色彩变化符合预期（绿/黄/红）
- [ ] 鼠标悬停提示信息完整且易读
- [ ] 错误提示文案友好，提供明确的操作建议

### 10.4 代码质量
- [ ] 代码通过 ESLint 检查（`npm run lint`）
- [ ] 代码通过 Prettier 格式化（`npm run format`）
- [ ] 新增方法包含必要的错误处理和日志记录
- [ ] 遵循项目现有的代码风格和命名规范

### 10.5 测试覆盖
- [ ] 前端表单校验测试通过
- [ ] 后端参数校验测试通过
- [ ] 费用累加逻辑测试通过
- [ ] 限制拦截逻辑测试通过
- [ ] 边界情况测试通过（0、null、超大值等）

---

## 十一、参考资料

### 11.1 现有代码参考
- 每日费用限制实现：参考 `dailyCostLimit` 和 `dailyCost` 的完整实现流程
- 周费用限制实现：参考 `weeklyOpusCostLimit` 和 `weeklyOpusCost` 的实现
- 窗口费用限制实现：参考 `rateLimitHelper.js` 中的窗口限流逻辑

### 11.2 相关文档
- 项目架构文档：`PROJECT_ANALYSIS.md`
- 项目指南：`CLAUDE.md`
- API 文档：`README.md`（如有）

### 11.3 开发工具
- 代码检查：`npm run lint`
- 代码格式化：`npm run format`
- 本地开发：`npm run dev`
- 构建前端：`npm run build:web`

---

## 十二、实现时间估算

### 后端开发（预计 4-6 小时）
- 数据模型修改：1 小时
- Redis 方法新增：1 小时
- 中间件拦截逻辑：1 小时
- 费用累加逻辑：1-2 小时（多个路由需要修改）
- 统计接口修改：0.5 小时
- 测试与调试：0.5-1 小时

### 前端开发（预计 3-4 小时）
- 表单字段新增（3 个 Modal）：1.5 小时
- 列表展示修改：0.5 小时
- 用量明细修改：0.5 小时
- 统计面板修改：0.5 小时
- 状态管理修改：0.5 小时
- 测试与调试：0.5-1 小时

### 总计：7-10 小时（约 1-1.5 个工作日）

---

## 十三、后续优化方向

1. **费用预警**：当总费用达到 80%、90% 时，向管理员发送邮件或系统通知
2. **费用报表**：提供按时间维度的总费用趋势图（日/周/月）
3. **费用重置**：提供管理接口手动重置 totalCost（需权限控制）
4. **费用回溯**：编写脚本从历史数据汇总现有 API Key 的总费用
5. **费用预测**：基于历史使用趋势，预测何时会达到总费用限额

---

## 结束语

本文档详细描述了"总费用限制"功能的需求范围、实现细节、测试用例和验收标准。在实现过程中，请严格参考现有的"每日费用限制"实现模式，确保代码风格一致、逻辑健壮、用户体验友好。

**重要提醒**：
- 实现前请仔细阅读相关代码文件，理解现有模式
- 实现过程中保持小步快跑，每个功能点完成后及时测试
- 所有代码提交前必须通过 lint 和 format 检查
- 遇到问题及时沟通，避免返工

祝开发顺利！🚀