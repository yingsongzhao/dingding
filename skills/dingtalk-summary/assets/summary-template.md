📊 钉钉消息汇总报告

📅 {{groups}} ▸ {{timeRange}} ▸ {{totalMessages}}条 ▸ {{activeMembers}}人活跃

—— 📌 总览 ——

{{overview}}

—— 🏷️ 主题分类 ——

{{#topics}}
▸ {{index}}. {{title}}

{{summary}}

涉及: {{participants}}

{{/topics}}

—— ⚡ 重要事项 ——

{{#highlights}}
🔔 [{{type}}] {{content}}
👤 {{sender}} ▸ {{time}}

{{/highlights}}

—— ✅ 待办清单 ——

{{#actionItems}}
☐ {{content}}
{{#if assignee}}👤 {{assignee}}{{/if}}
{{#if deadline}}⏰ {{deadline}}{{/if}}

{{/actionItems}}

—— 💬 关键讨论 ——

{{#discussions}}
▸ {{title}}

{{summary}}

结论: {{conclusion}}

{{/discussions}}

—— 完 ——

⚠️ 本报告由 AI 自动生成，请结合原始消息确认关键信息
