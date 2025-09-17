const { google } = require('googleapis');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sessionData = JSON.parse(event.body);
    
    // Netlify 환경 변수에서 비밀 정보 가져오기
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const SHEET_NAME = 'Sessions'; 

    // Google 인증
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // 시트에 추가할 데이터 행 준비 (Transcript 제외)
    const newRow = [
        new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"}),
        sessionData.userId || '',
        sessionData.sessionId || '',
        sessionData.nickname || '',
        sessionData.grade || '',
        sessionData.bookTitle || '',
        sessionData.activeDurationInSeconds || 0,
        sessionData.chatTurnCount || 0,
        sessionData.avgMessageLength || 0,
        sessionData.questionCount || 0,
        sessionData.avgResponseTime || null,
        sessionData.feedback || '',
        // sessionData.transcript || '' // <-- 오류 방지를 위해 이 부분을 제거했습니다.
    ];

    // 시트에 데이터 추가
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME, 
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '데이터가 성공적으로 시트에 저장되었습니다.' }),
    };
  } catch (error) {
    console.error('시트 저장 오류:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
