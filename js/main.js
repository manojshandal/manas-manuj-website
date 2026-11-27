/* =========================================
   मानस मनुज - मुख्य कार्यप्रणाली (main.js)
   ========================================= */

// वास्तविक WhatsApp नंबर (91 के साथ, बिना + या स्पेस के) और आधिकारिक कस्टम ईमेल:
const AUTHOR_WHATSAPP = "919646838289";
const EMAILS = {
  booking: "booking@manasmanuj.in",
  contact: "contact@manasmanuj.in",
  guidance: "guidance@manasmanuj.in"
};

// मोबाइल मेनू खोलने और बंद करने का कोड
function toggleMenu() {
  const navList = document.getElementById("navList");
  if (navList) {
    navList.classList.toggle("show");
  }
}

// विषय के अनुसार सही कस्टम ईमेल चुनने का हेल्पर
function getTargetEmail(topic) {
  const text = (topic || "").toLowerCase();
  if (
    text.includes("परामर्श") ||
    text.includes("मार्गदर्शन") ||
    text.includes("consultation") ||
    text.includes("guidance")
  ) {
    return EMAILS.guidance;
  }
  if (
    text.includes("पुस्तक") ||
    text.includes("ऑर्डर") ||
    text.includes("book") ||
    text.includes("order") ||
    text.includes("booking")
  ) {
    return EMAILS.booking;
  }
  return EMAILS.contact;
}

// FormSubmit के ज़रिए बैकग्राउंड में सीधे Zoho इनबॉक्स पर ईमेल भेजने का हेल्पर
function sendViaFormSubmit(targetEmail, payload) {
  return fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    keepalive: true,
    body: JSON.stringify({
      ...payload,
      _template: "table",
      _captcha: "false"
    })
  });
}

// डायरेक्ट पुस्तक ऑर्डर (WhatsApp + बैकग्राउंड में booking@manasmanuj.in पर ऑटो-ईमेल)
function sendDirectBookOrder(mode = "whatsapp") {
  const nameEl = document.getElementById("buyerName");
  const phoneEl = document.getElementById("buyerPhone");
  const addressEl = document.getElementById("buyerAddress");
  const qtyEl = document.getElementById("bookQty");
  const bookEl = document.getElementById("bookSelect");

  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const address = addressEl.value.trim();
  const qty = qtyEl ? qtyEl.value : "1";
  const selectedBook =
    bookEl && bookEl.value
      ? bookEl.value
      : "शिवशक्ति त्रिदेव गाथा (डायरेक्ट सेल - 10% छूट / ₹720)";
  const currentLang = localStorage.getItem("siteLang") || "hi";

  if (!name || !phone || !address) {
    alert(
      currentLang === "en"
        ? "Please enter your full name, mobile number, and complete postal address."
        : "कृपया अपना नाम, मोबाइल नंबर और पूरा पता अवश्य लिखें।"
    );
    return;
  }

  const emailPayload = {
    _subject: `नया पुस्तक ऑर्डर: ${selectedBook} (${name})`,
    "माध्यम (Mode)": mode === "email" ? "Direct Email Order" : "WhatsApp Order (Auto-Copy)",
    "पुस्तक (Book)": selectedBook,
    "नाम (Name)": name,
    "मोबाइल नंबर (Phone)": phone,
    "प्रतियाँ (Quantity)": qty,
    "पूरा पता (Address)": address
  };

  if (mode === "email") {
    sendViaFormSubmit(EMAILS.booking, emailPayload)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        alert(
          currentLang === "en"
            ? "Thank you! Your book order has been sent directly to booking@manasmanuj.in."
            : "धन्यवाद! आपका पुस्तक ऑर्डर सफलतापूर्वक booking@manasmanuj.in पर भेज दिया गया है।"
        );
        nameEl.value = "";
        phoneEl.value = "";
        addressEl.value = "";
      })
      .catch(() => {
        alert(
          currentLang === "en"
            ? "Could not send email right now. Please try again or use WhatsApp."
            : "अभी ईमेल भेजने में तकनीकी दिक्कत आई। कृपया दोबारा प्रयास करें या WhatsApp चुनें।"
        );
      });
    return;
  }

  // बैकग्राउंड में booking@manasmanuj.in पर रिकॉर्ड भेजें (बिना WhatsApp को रोके)
  sendViaFormSubmit(EMAILS.booking, emailPayload).catch(() => {});

  const orderText =
    `नमस्ते मानस मनुज जी,\n` +
    `मैं आपकी पुस्तक की ऑटोग्राफ कॉपी मँगवाना चाहता/चाहती हूँ:\n\n` +
    `पुस्तक: ${selectedBook}\n` +
    `नाम: ${name}\n` +
    `मोबाइल: ${phone}\n` +
    `प्रतियों की संख्या: ${qty}\n` +
    `पूरा पता: ${address}`;

  const url = `https://wa.me/${AUTHOR_WHATSAPP}?text=${encodeURIComponent(orderText)}`;
  window.open(url, "_blank");
}

// सामान्य संपर्क फॉर्म (WhatsApp + बैकग्राउंड ईमेल रिकॉर्ड, या सीधा Email सबमिट)
function sendContactMessage(mode) {
  const nameEl = document.getElementById("visitorName");
  const topicEl = document.getElementById("visitorTopic");
  const messageEl = document.getElementById("visitorMessage");

  const name = nameEl.value.trim();
  const topic = topicEl.value;
  const message = messageEl.value.trim();
  const currentLang = localStorage.getItem("siteLang") || "hi";

  if (!name || !message) {
    alert(
      currentLang === "en"
        ? "Please enter your name and message."
        : "कृपया अपना नाम और संदेश अवश्य लिखें।"
    );
    return;
  }

  const targetEmail = getTargetEmail(topic);
  const emailPayload = {
    _subject: `वेबसाइट संदेश: ${topic} - ${name}`,
    "माध्यम (Mode)": mode === "whatsapp" ? "WhatsApp (Auto-Copy)" : "Website Contact Form",
    "नाम (Name)": name,
    "विषय (Topic)": topic,
    "संदेश (Message)": message
  };

  if (mode === "whatsapp") {
    // बैकग्राउंड में संबंधित कस्टम ईमेल (contact@/guidance@/booking@) पर भी कॉपी भेजें
    sendViaFormSubmit(targetEmail, emailPayload).catch(() => {});

    const fullText =
      `नमस्ते मानस मनुज जी,\n` +
      `नाम: ${name}\n` +
      `विषय: ${topic}\n` +
      `संदेश: ${message}`;

    window.open(
      `https://wa.me/${AUTHOR_WHATSAPP}?text=${encodeURIComponent(fullText)}`,
      "_blank"
    );
  } else {
    sendViaFormSubmit(targetEmail, emailPayload)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        alert(
          currentLang === "en"
            ? "Thank you! Your message has been sent successfully."
            : "धन्यवाद! आपका संदेश सफलतापूर्वक भेज दिया गया है।"
        );
        nameEl.value = "";
        messageEl.value = "";
      })
      .catch(() => {
        alert(
          currentLang === "en"
            ? "Could not send message right now. Please try again or use WhatsApp."
            : "अभी संदेश भेजने में दिक्कत आई। कृपया दोबारा प्रयास करें या WhatsApp चुनें।"
        );
      });
  }
}

// भाषा बदलने का कोड (Hindi / English)
function setLanguage(lang) {
  document.querySelectorAll("[data-hi]").forEach((el) => {
    const text = el.getAttribute(`data-${lang}`);
    if (text !== null) {
      el.innerHTML = text;
    }
  });

  const btnHi = document.getElementById("btn-hi");
  const btnEn = document.getElementById("btn-en");
  if (btnHi) btnHi.classList.toggle("active", lang === "hi");
  if (btnEn) btnEn.classList.toggle("active", lang === "en");

  document.documentElement.lang = lang;
  localStorage.setItem("siteLang", lang);
}

// पेज लोड होने पर सहेजी गई भाषा लागू करना और मोबाइल मेनू ऑटो-क्लोज़ सेट करना
window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLang") || "hi";
  if (savedLang !== "hi") {
    setLanguage(savedLang);
  }

  // मोबाइल पर किसी भी मेनू लिंक पर टैप करते ही मेनू अपने आप बंद हो जाए
  const navLinks = document.querySelectorAll("#navList a");
  const navList = document.getElementById("navList");
  if (navList) {
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navList.classList.remove("show");
      });
    });
  }
});
