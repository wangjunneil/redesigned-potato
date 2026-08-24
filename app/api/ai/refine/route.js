import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `请在**不改变原文核心意思、观点和语气**的前提下，对以下内容进行润色和整理：

1. 修正语病，使表达更加通顺、自然。
2. 优化标点符号、分段和句子结构。
3. 保留原有观点和信息，不随意增加、删除或改变内容。
4. 对关键文字、核心观点可适当使用 **Markdown 加粗** 强调。
5. 如果内容包含多个观点或步骤，可根据语义适当使用 Markdown **有序/无序列表**重新组织。
6. 仅在确有必要时调整表达，避免过度润色，保持原文风格。

**直接输出润色后的内容，不要解释修改过程。**`;

export async function POST(request) {
  try {
    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "内容为空" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DEEPSEEK_API_KEY 未配置" }, { status: 500 });
    }

    const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        stream: false,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("DeepSeek 调用失败:", data);
      return NextResponse.json(
        { error: data?.error?.message || "AI 调用失败" },
        { status: 502 }
      );
    }

    const refined = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ content: refined });
  } catch (error) {
    console.error("AI 润色失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
