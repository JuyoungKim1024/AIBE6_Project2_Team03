import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const { description, postType } = await req.json();

  if (!description?.trim()) {
    return NextResponse.json(
      { error: "설명을 입력해주세요." },
      { status: 400 },
    );
  }

  const typeLabel = postType === "hiring" ? "구인 공고" : "구직 공고";

  const prompt = `당신은 프리랜서 영상 편집 플랫폼의 글쓰기 도우미입니다.
아래 설명을 바탕으로 ${typeLabel} 글을 한국어로 작성해주세요.

설명: ${description}

반드시 아래 JSON 형식으로만 응답하세요. 코드블록 없이 순수 JSON만:
{
  "title": "글 제목 (50자 이내)",
  "content": "글 내용 (HTML 형식, <h2><p><ul><li><strong> 태그 사용, 상세하고 전문적으로)"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = response.text ?? "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ title: parsed.title, content: parsed.content });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "AI 생성 실패" }, { status: 500 });
  }
}
