import { getSecretValue } from "@/services";
import { Configuration, OpenAI } from "openai";

export async function POST(request) {
  const res = await request.json();
  const content = await res?.content;

  const OPENAI_SECRET_KEY = await getSecretValue("OPENAI_SECRET_KEY");
  const openai = new OpenAI({
    apiKey: OPENAI_SECRET_KEY,
  });
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: content }],
  });

  const result = chatCompletion.data.choices[0].message;

  return new Response(`{"success":true, "data":${result}}`, {
    status: 200,
    headers: {
      "Content-type": "application/json",
    },
  });
}
