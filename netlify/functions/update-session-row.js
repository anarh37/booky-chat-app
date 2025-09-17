// netlify/functions/update-session-row.js (새로운 단일 파일)

const { google } = require('googleapis');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sessionData = JSON.parse(event.body);
    const { sessionId } = sessionData;

    if (!sessionId) {
      throw new Error('Session ID is missing');
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const SHEET_NAME = 'Sessions';

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 시트에서 기존 세션 ID 목록을 모두 읽어옵니다.
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!C:C`, // C열 (SessionID)만 읽습니다.
    });

    const sessionIds = getResponse.data.values ? getResponse.data.values.flat() : [];
    const rowIndex = sessionIds.findIndex(id => id === sessionId);
    const rowNumber = rowIndex + 1; // 시트의 행 번호는 1부터 시작

    // 2. 시트에 표시할 새로운 데이터 행을 만듭니다.
    const newRowData = [
      new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"}),
      sessionData.userId || '',
      sessionData.sessionId || '',
      sessionData.nickname || '',
      sessionData.grade || '',
      sessionData.bookTitle || '',
      sessionData.activeDurationInSeconds || 0,
      sessionData.chatTurnCount || 0,
      null, // AvgLength - 구현 필요 시 추가
      null, // Questions - 구현 필요 시 추가
      null, // AvgResponseTime - 구현 필요 시 추가
      sessionData.feedback || '',
      sessionData.transcript || '',
    ];

    if (rowIndex !== -1) {
      // 3-1. 기존 행이 있으면, 해당 행을 통째로 덮어씁니다 (Update).
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [newRowData],
        },
      });
    } else {
      // 3-2. 기존 행이 없으면, 새로운 행으로 추가합니다 (Append).
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [newRowData],
        },
      });
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'OK' }) };
  } catch (error) {
    console.error('세션 업데이트 오류:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
