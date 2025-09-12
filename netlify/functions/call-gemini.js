// 이 파일은 서버에서만 실행되므로, 여기에 있는 API 키는 절대 노출되지 않습니다.
// Netlify 환경 변수에서 API 키를 가져옵니다.
const GEMINI_API_KEY = "AIzaSyCRf3hACTKWHk4RUBf_YjwqQkFfKCliQ7Y";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

exports.handler = async (event) => {
  // 클라이언트(index.html)에서 보낸 데이터가 아니면 요청을 거부합니다.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 클라이언트에서 보낸 대화 기록과 사용자 입력을 받습니다.
    const { chatHistory, userInput, systemPrompt } = JSON.parse(event.body);

    const payloadContents = [...chatHistory, { role: 'user', parts: [{ text: userInput }] }];

    const payload = {
      contents: payloadContents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };
    
    // 서버에서 Google Gemini API로 실제 요청을 보냅니다.
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google API request failed with status ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    // 성공적으로 받은 AI의 답변을 다시 클라이언트로 보내줍니다.
    return {
      statusCode: 200,
      body: JSON.stringify({ aiResponse: aiResponse }),
    };
  } catch (error) {
    console.error('Error in Netlify function:', error);
    // 에러가 발생하면 클라이언트에 에러 메시지를 보냅니다.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};


