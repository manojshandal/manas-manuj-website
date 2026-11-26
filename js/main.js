/* =========================================
   मानस मनुज - मुख्य कार्यप्रणाली (main.js)
   ========================================= */

// अपना वास्तविक WhatsApp नंबर (91 के साथ, बिना + या स्पेस के) और Email यहाँ डालें:
const AUTHOR_WHATSAPP = "91XXXXXXXXXX";
const AUTHOR_EMAIL = "your-email@example.com";

// मोबाइल मेनू खोलने और बंद करने का कोड
function toggleMenu() {
  const navList = document.getElementById("navList");
  if (navList) {
    navList.classList.toggle("show");
  }
}

// डायरेक्ट पुस्तक ऑर्डर (WhatsApp पर भेजने के लिए)
function sendDirectBookOrder() {
  const name = document.getElementById("buyerName").value.trim();
  const phone = document.getElementById("buyerPhone").value.trim();
  const address = document.getElementById("buyerAddress").value.trim();
  const qty = document.getElementById("bookQty").value;
  const currentLang = localStorage.getItem("siteLang") || "hi";

  if (!name || !phone || !address) {
    alert(
      currentLang === "en"
        ? "Please enter your full name, mobile number, and complete postal address."
        : "कृपया अपना नाम, मोबाइल नंबर और पूरा पता अवश्य लिखें।"
    );
    return;
  }

  const orderText =
    `नमस्ते मानस मनुज जी,\n` +
    `मैं आपकी पुस्तक 'शिवशक्ति त्रिदेव गाथा' की ऑटोग्राफ कॉपी (डायरेक्ट सेल - 10% छूट / ₹720) मँगवाना चाहता/चाहती हूँ:\n\n` +
    `नाम: ${name}\n` +
    `मोबाइल: ${phone}\n` +
    `प्रतियों की संख्या: ${qty}\n` +
    `पूरा पता: ${address}`;

  const url = `https://wa.me/${AUTHOR_WHATSAPP}?text=${encodeURIComponent(orderText)}`;
  window.open(url, "_blank");
}

// सामान्य संपर्क फॉर्म (WhatsApp या Email)
function sendContactMessage(mode) {
  const name = document.getElementById("visitorName").value.trim();
  const topic = document.getElementById("visitorTopic").value;
  const message = document.getElementById("visitorMessage").value.trim();
  const currentLang = localStorage.getItem("siteLang") || "hi";

  if (!name || !message) {
    alert(
      currentLang === "en"
        ? "Please enter your name and message."
        : "कृपया अपना नाम और संदेश अवश्य लिखें।"
    );
    return;
  }

  const fullText =
    `नमस्ते मानस मनुज जी,\n` +
    `नाम: ${name}\n` +
    `विषय: ${topic}\n` +
    `संदेश: ${message}`;

  if (mode === "whatsapp") {
    window.open(`https://wa.me/${AUTHOR_WHATSAPP}?text=${encodeURIComponent(fullText)}`, "_blank");
  } else {
    window.location.href = `mailto:${AUTHOR_EMAIL}?subject=${encodeURIComponent(topic + " - " + name)}&body=${encodeURIComponent(fullText)}`;
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

