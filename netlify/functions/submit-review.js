exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "केवल POST अनुरोध स्वीकार्य है।" })
    };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO; // उदाहरण: username/manas-manuj-website
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!token || !repo) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "सर्वर सेटअप अधूरा है (GITHUB_TOKEN या GITHUB_REPO सेट नहीं है)।"
        })
      };
    }

    const payload = JSON.parse(event.body || "{}");

    // स्पैम बॉट से बचाव (Honeypot)
    if (payload.website && String(payload.website).trim() !== "") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, message: "समीक्षा प्राप्त हुई।" })
      };
    }

    const name = String(payload.name || "").trim().slice(0, 80);
    const city = String(payload.city || "").trim().slice(0, 60);
    const allowedBooks = [
      "शिवशक्ति त्रिदेव गाथा",
      "सनातन गौरव गाथा",
      "वेबसाइट एवं साहित्य"
    ];
    const book = allowedBooks.includes(payload.book)
      ? payload.book
      : "शिवशक्ति त्रिदेव गाथा";
    const ratingNum = Math.min(5, Math.max(1, parseInt(payload.rating, 10) || 5));
    const message = String(payload.message || "").trim().slice(0, 1500);

    if (!name || message.length < 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "कृपया अपना नाम और कम से कम 5 अक्षरों की समीक्षा लिखें।"
        })
      };
    }

    const ghHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "manasmanuj-review-bot"
    };

    // 1. यदि पाठक ने फ़ोटो भेजी है, तो images/uploads/ में सेव करें ([skip netlify] के साथ)
    let savedPhotoPath = "";
    if (payload.photoBase64 && typeof payload.photoBase64 === "string") {
      const match = payload.photoBase64.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
      if (match) {
        const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
        const rawBase64 = match[2];

        // अधिकतम ~1.5 MB सीमा
        if (rawBase64.length > 2100000) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "फ़ोटो का आकार बहुत बड़ा है। कृपया छोटी फ़ोटो चुनें।"
            })
          };
        }

        const safeSlug = `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const photoRepoPath = `images/uploads/${safeSlug}`;

        const photoUploadRes = await fetch(
          `https://api.github.com/repos/${repo}/contents/${photoRepoPath}`,
          {
            method: "PUT",
            headers: ghHeaders,
            body: JSON.stringify({
              message: `Add pending reader review photo [skip netlify]`,
              content: rawBase64,
              branch
            })
          }
        );

        if (photoUploadRes.ok) {
          savedPhotoPath = `/images/uploads/${safeSlug}`;
        }
      }
    }

    // 2. मौजूदा data/reviews.json फ़ाइल पढ़ें
    const reviewsApiUrl = `https://api.github.com/repos/${repo}/contents/data/reviews.json`;
    let existingItems = [];
    let currentSha = undefined;

    const getRes = await fetch(`${reviewsApiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers: ghHeaders
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      currentSha = fileData.sha;
      const decoded = Buffer.from(fileData.content, "base64").toString("utf8");
      const parsed = JSON.parse(decoded || "{}");
      if (Array.isArray(parsed.items)) {
        existingItems = parsed.items;
      }
    }

    // हिंदी दिनांक तैयार करें (उदा. 28 नवंबर 2026)
    const monthsHi = [
      "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
      "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
    ];
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const dateStr = `${istDate.getUTCDate()} ${monthsHi[istDate.getUTCMonth()]} ${istDate.getUTCFullYear()}`;

    // नया रिव्यू सबसे ऊपर जोड़ें (approved: false ताकि बिना अनुमति लाइव न हो)
    const newReview = {
      approved: false,
      featured: false,
      name,
      city,
      book,
      rating: String(ratingNum),
      message,
      photo: savedPhotoPath,
      date: dateStr
    };

    const updatedJson = JSON.stringify({ items: [newReview, ...existingItems] }, null, 2) + "\n";

    // 3. अपडेटेड reviews.json को GitHub में सेव करें ([skip netlify] ताकि 0 क्रेडिट खर्च हों)
    const putBody = {
      message: `New pending reader review from ${name} [skip netlify]`,
      content: Buffer.from(updatedJson, "utf8").toString("base64"),
      branch
    };
    if (currentSha) putBody.sha = currentSha;

    const putRes = await fetch(reviewsApiUrl, {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "समीक्षा सहेजने में तकनीकी समस्या आई। कृपया थोड़ी देर बाद प्रयास करें।",
          details: errText.slice(0, 200)
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: "धन्यवाद! आपकी समीक्षा सफलतापूर्वक प्राप्त हो गई है। लेखक की स्वीकृति के बाद यह वेबसाइट पर प्रकाशित हो जाएगी।"
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "कुछ तकनीकी त्रुटि हुई। कृपया पुनः प्रयास करें।"
      })
    };
  }
};
