export async function handler(event) {
  try {
    const { question, lang } = JSON.parse(event.body || "{}");

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No question provided" })
      };
    }

    const answer =
      lang === "ar"
        ? `تم استلام سؤالك:\n"${question}"\n\nهذه نسخة تجريبية. سيتم قريبًا ربط المساعد بالمصادر الرسمية والذكاء الاصطناعي.`
        : `Your question was received:\n"${question}"\n\nThis is a demo response. AI + official sources will be connected next.`;

    const sources = [
      {
        title: "برنامج الابتعاث – وزارة التعليم",
        url: "https://sites.moe.gov.sa/scholarship-program/"
      },
      {
        title: "بوابة الحكومة الموحدة my.gov.sa",
        url: "https://www.my.gov.sa/"
      }
    ];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, sources })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: error.message
      })
    };
  }
}
