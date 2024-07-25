export async function POST(request) {
  const data = await request.json();

  try {
    const response = await fetch("http://1.13.189.65:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Llama3-8B-Chinese-Chat-q8_0-v2_1:latest",
        prompt: `
            作为一个命名专家，给你提供文章的标题，将标题翻译成英文以slug的方式返回。

            # 要求
            翻译的单词数量不超过6个，输出内容简单明了

            # 示例
            输入：
            使用 OpenAI Whisper + SoundDevice 创建即时语音转录系统
            输出：
            voice-transcription-openai-whisper-sounddevice

            示例结束，现在开始正式输入，输入：${data.content}
        `,
        stream: false,
        format: "json",
      }),
    });

    // 检查响应状态码
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 解析JSON响应
    const result = await response.json();
    const jsonContent = JSON.parse(result.response);

    return new Response(`{"status":"ok", "data":"${jsonContent.slug}"}`, {
      status: 200,
      headers: {
        "Content-type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);

    return new Response(`{"status":"fail"}`, {
      status: 500,
      headers: {
        "Content-type": "application/json",
      },
    });
  }
}
