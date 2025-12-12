// netlify/functions/chat.mjs

const OFFICIAL_SOURCES = [
  { title: "MOE Scholarship Program (Saudi Arabia)", url: "https://sites.moe.gov.sa/scholarship-program/" },
  { title: "MOE Scholarship FAQs", url: "https://sites.moe.gov.sa/scholarship-program/faqs/" },
  { title: "General Authority for Statistics (GASTAT)", url: "https://www.stats.gov.sa/" },
  { title: "Saudi National Portal (my.gov.sa)", url: "https://www.my.gov.sa/" }
];

// قاعدة معرفة صغيرة كبداية (لاحقًا نربط ملفاتك)
// كل عنصر لازم يكون معه مصدر رسمي واحد على الأقل
const KB = [
  {
    keys: ["الأسئلة الشائعة", "faq", "faqs", "برنامج الابتعاث", "scholarship faq"],
    answer_ar: "هذي صفحة الأسئلة الشائعة الرسمية لبرنامج الابتعاث (وزارة التعليم).",
    answer_en: "Here is the official Scholarship Program FAQ page (Saudi Ministry of Education).",
    sources: [{ title: "MOE Scholarship FAQs", url: "https://sites.moe.gov.sa/scholarship-program/faqs/" }]
  },
  {
    keys: ["برنامج الابتعاث", "وزارة التعليم", "scholarship program", "moe scholarship"],
    answer_ar: "هذي الصفحة الرسمية لبرنامج الابتعاث (وزارة التعليم).",
    answer_en: "Here is the official Scholarship Program page (Saudi Ministry of Education).",
    sources: [{ title: "MOE Scholarship Program", url: "https://sites.moe.gov.sa/scholarship-program/" }]
  }
];

function json(statusCode, bodyObj) {
  return new Response(JSON.stringify(bodyObj), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}

function normalize(s = "") {
  return String(s).toLowerCase().trim();
}

function matchKB(q) {
  const nq = normalize(q);
  let best = null;
  let bestScore = 0;

  for (const item of KB) {
    let score = 0;
    for (const k of item.keys) {
      const nk = normalize(k);
      if (nq.includes(nk)) score += 2;
      // دعم كلمات مفردة بدون ما نبالغ
      for (const token of nk.split(/\s+/)) {
        if (token.length >= 4 && nq.includes(token)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 2 ? best : null;
}

export default async (req, context) => {
  // CORS preflight
  if (req.method === "OPTIONS") return json(200, { ok: true });

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed. Use POST." });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const question = payload?.question;
  const lang = payload?.lang === "en" ? "en" : "ar";

  if (!question || !String(question).trim()) {
    return json(400, { error: "Missing question." });
  }

  // مبدأ منع الهلوسة: نجاوب فقط إذا عندنا تطابق + مصادر رسمية
  const hit = matchKB(question);

  if (hit) {
    const answer = lang === "en" ? hit.answer_en : hit.answer_ar;
    return json(200, { answer, sources: hit.sources });
  }

  // إذا ما عندنا مصدر رسمي داخل KB: نرفض الإجابة التفصيلية ونرجع روابط رسمية
  const safeAnswerAr =
    "ما أقدر أجاوب إجابة تفصيلية لأن ما عندي نص/مصدر رسمي داخل قاعدة المعرفة الحالية يغطي هذا السؤال. " +
    "تقدر تبدأ من الروابط الرسمية التالية، وإذا رفعت ملفاتك الرسمية/النصوص هنا بنبني قاعدة معرفة عليها ونجاوب منها فقط.";
  const safeAnswerEn =
    "I can’t provide a detailed answer because the current knowledge base does not contain an official text/source that covers this question. " +
    "Start with the official links below. If you upload your official documents/text, we will build a knowledge base and answer only from it.";

  return json(200, {
    answer: lang === "en" ? safeAnswerEn : safeAnswerAr,
    sources: OFFICIAL_SOURCES
  });
};