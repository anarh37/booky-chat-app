// netlify/functions/save-chat-turn.js

const { google } = require('googleapis');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const turnData = JSON.parse(event.body);
    
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const SHEET_NAME = 'ChatLogs'; // 'Sessions'가 아닌 새로운 시트 이름입니다.

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // ChatLogs 시트에 맞는 간단한 데이터 행을 준비합니다.
    const newRow = [
        new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"}),
        turnData.userId || '',
        turnData.sessionId || '',
        turnData.nickname || '',
        turnData.role, // 'user' 또는 'model'
        turnData.text, // 메시지 내용
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'OK' }) };
  } catch (error) {
    console.error('실시간 대화 저장 오류:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
