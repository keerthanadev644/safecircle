
const $ = (id) => document.getElementById(id);

// Language translations
const translations = {
    en: {
        title: "Your trusted circle, one tap away",
        sub: "Alert contacts, share live location, and get help fast.",
        who: "Built for night-time commuters",
        hint: "Tap SOS to alert your trusted contacts.",
        share: "Share location",
        fake: "Fake call",
        call: "Call 112",
        trusted: "Trusted contacts",
        tips: "Safety tips",
        foot: "Demo prototype: WhatsApp messages require your confirmation."
    },

    hi: {
        title: "आपका भरोसेमंद घेरा, बस एक टैप दूर",
        sub: "संपर्कों को अलर्ट करें, लोकेशन साझा करें और तुरंत मदद पाएं।",
        who: "रात में सफ़र करने वालों के लिए",
        hint: "अपने भरोसेमंद संपर्कों को अलर्ट करने के लिए SOS दबाएं।",
        share: "लोकेशन भेजें",
        fake: "नकली कॉल",
        call: "112 कॉल करें",
        trusted: "भरोसेमंद संपर्क",
        tips: "सुरक्षा सुझाव",
        foot: "डेमो: WhatsApp संदेश भेजने के लिए आपकी पुष्टि आवश्यक है।"
    },

    te: {
        title: "మీ నమ్మకమైన వలయం, ఒక్క ట్యాప్ దూరంలో",
        sub: "కాంటాక్ట్‌లకు అలర్ట్ పంపండి, లొకేషన్ షేర్ చేయండి.",
        who: "రాత్రి ప్రయాణికుల కోసం",
        hint: "కాంటాక్ట్‌లకు అలర్ట్ పంపడానికి SOS నొక్కండి.",
        share: "లొకేషన్ షేర్",
        fake: "నకిలీ కాల్",
        call: "112 కి కాల్",
        trusted: "నమ్మకమైన కాంటాక్ట్‌లు",
        tips: "భద్రతా చిట్కాలు",
        foot: "డెమో: WhatsApp సందేశాలను మీరు నిర్ధారించి పంపాలి."
    }
};

// Language selector
function setLanguage(language) {
    document.documentElement.lang = language;

    document.querySelectorAll("[data-i]").forEach((element) => {
        const key = element.dataset.i;

        if (translations[language][key] !== undefined) {
            element.textContent = translations[language][key];
        }
    });

    try {
        localStorage.setItem("sc_lang", language);
    } catch (error) {
        // Continue if browser storage is unavailable.
    }
}

let savedLanguage = "en";

try {
    savedLanguage = localStorage.getItem("sc_lang") || "en";
} catch (error) {
    savedLanguage = "en";
}

if (!translations[savedLanguage]) {
    savedLanguage = "en";
}

$("lang").value = savedLanguage;
setLanguage(savedLanguage);

$("lang").addEventListener("change", (event) => {
    setLanguage(event.target.value);
});

// Dark mode
$("theme").addEventListener("click", () => {
    const root = document.documentElement;
    const isDark = root.dataset.theme !== "dark";

    root.dataset.theme = isDark ? "dark" : "light";
    $("theme").textContent = isDark ? "☀️" : "🌙";

    try {
        localStorage.setItem("sc_theme", root.dataset.theme);
    } catch (error) {}
});

try {
    const savedTheme = localStorage.getItem("sc_theme");

    if (savedTheme === "dark") {
        document.documentElement.dataset.theme = "dark";
        $("theme").textContent = "☀️";
    }
} catch (error) {}

// Trusted contacts
let contacts = [];

try {
    contacts = JSON.parse(
        localStorage.getItem("sc_contacts") || "[]"
    );

    if (!Array.isArray(contacts)) {
        contacts = [];
    }

    // Keep only contacts with valid basic fields.
    contacts = contacts.filter(
        (contact) =>
            contact &&
            typeof contact.name === "string" &&
            typeof contact.phone === "string"
    );
} catch (error) {
    contacts = [];
}

function saveContacts() {
    try {
        localStorage.setItem(
            "sc_contacts",
            JSON.stringify(contacts)
        );
    } catch (error) {
        alert("Could not save contacts in this browser.");
    }
}

function renderContacts() {
    const circle = $("circle");
    circle.replaceChildren();

    contacts.forEach((contact) => {
        const avatar = document.createElement("div");
        avatar.className = "av";
        avatar.textContent = contact.name.charAt(0).toUpperCase();
        avatar.title = `${contact.name} - ${contact.phone}`;

        circle.appendChild(avatar);
    });

    const addButton = document.createElement("button");
    addButton.className = "add";
    addButton.textContent = "+";
    addButton.setAttribute("aria-label", "Add trusted contact");
    addButton.addEventListener("click", addContact);

    circle.appendChild(addButton);

    $("status").textContent =
        `● ${contacts.length} trusted contact(s) saved`;
}

function addContact() {
    if (contacts.length >= 12) {
        alert("You can add up to 12 contacts in this demo.");
        return;
    }

    const name = prompt("Enter contact name:");

    if (!name || !name.trim()) return;

    const phone = prompt("Enter phone number:");

    if (!phone || !/^[+\d][\d\s()-]{5,}$/.test(phone.trim())) {
        alert("Please enter a valid phone number.");
        return;
    }

    contacts.push({
        name: name.trim().slice(0, 30),
        phone: phone.trim()
    });

    saveContacts();
    renderContacts();
}

renderContacts();

// Request current device location
function getLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            () => resolve(null),
            {
                enableHighAccuracy: true,
                timeout: 8000
            }
        );
    });
}

function getMapLink(coords) {
    if (!coords) return null;

    return `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
}

// WhatsApp alert helpers
function waNumber(phone) {
    let number = String(phone || "").replace(/\D/g, "");

    // Assume India for 10-digit numbers.
    if (number.length === 10) {
        number = "91" + number;
    }

    return number;
}

function waUrl(contact, mapLink) {
    let message =
        "🚨 I need help! This is an SOS from SafeCircle.";

    if (mapLink) {
        message += " My location: " + mapLink;
    } else {
        message +=
            " My location could not be retrieved. Please contact me.";
    }

    return (
        "https://wa.me/" +
        waNumber(contact.phone) +
        "?text=" +
        encodeURIComponent(message)
    );
}

function showWhatsApp(mapLink) {
    const box = $("alerts");

    if (!box) {
        $("msg").textContent =
            "WhatsApp alert area is missing. Add the alerts element in index.html.";
        return;
    }

    box.replaceChildren();

    if (contacts.length === 0) {
        $("msg").textContent =
            "No trusted contacts found. Add a contact first.";
        return;
    }

    $("msg").textContent =
        "🚨 SOS ready. Tap a contact below to open WhatsApp and send the alert.";

    contacts.forEach((contact) => {
        const linkButton = document.createElement("a");

        linkButton.href = waUrl(contact, mapLink);
        linkButton.target = "_blank";
        linkButton.rel = "noopener noreferrer";
        linkButton.textContent =
            "Send to " + contact.name + " on WhatsApp";

        box.appendChild(linkButton);
    });
}

// SOS countdown
let sosTimer = null;

$("sos").addEventListener("click", () => {
    const button = $("sos");

    // Tap again to cancel the countdown.
    if (sosTimer !== null) {
        clearInterval(sosTimer);
        sosTimer = null;

        button.classList.remove("on");
        button.textContent = "SOS";
        $("msg").textContent = "SOS demo cancelled.";
        $("alerts")?.replaceChildren();

        return;
    }

    if (contacts.length === 0) {
        $("msg").textContent =
            "Add a trusted contact first using the + button.";
        return;
    }

    $("alerts")?.replaceChildren();

    let seconds = 5;

    button.classList.add("on");
    button.textContent = seconds;

    $("msg").textContent =
        "SOS countdown starts in 5 seconds. Tap again to cancel.";

    sosTimer = setInterval(async () => {
        seconds--;

        if (seconds > 0) {
            button.textContent = seconds;
            $("msg").textContent =
                `SOS countdown starts in ${seconds} seconds. Tap again to cancel.`;
            return;
        }

        clearInterval(sosTimer);
        sosTimer = null;

        button.classList.remove("on");
        button.textContent = "SOS";

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        // Get location after countdown.
        $("msg").textContent = "Getting your location...";

        const coords = await getLocation();
        const mapLink = getMapLink(coords);

        // Show WhatsApp links for all trusted contacts.
        showWhatsApp(mapLink);
    }, 1000);
});

// Share location
$("share").addEventListener("click", async () => {
    $("msg").textContent = "Requesting location permission...";

    const coords = await getLocation();
    const mapLink = getMapLink(coords);

    if (!mapLink) {
        $("msg").textContent =
            "Location unavailable. Check browser permission and try again.";
        return;
    }

    const message = `My current location: ${mapLink}`;

    try {
        if (navigator.share) {
            await navigator.share({
                title: "My location",
                text: message
            });

            $("msg").textContent = "Sharing options opened.";
            return;
        }
    } catch (error) {
        if (error.name === "AbortError") return;
    }

    try {
        await navigator.clipboard.writeText(message);
        $("msg").textContent = "Location link copied to clipboard.";
    } catch (error) {
        $("msg").textContent = message;
    }
});

// Fake call simulation
$("fake").addEventListener("click", () => {
    $("msg").textContent = "Fake call demo in 5 seconds...";

    setTimeout(() => {
        $("msg").textContent =
            "📞 Incoming call: Mom (simulated demo only).";
    }, 5000);
});

// Emergency number 112
$("call").addEventListener("click", () => {
    const confirmed = confirm(
        "Open your phone dialer for 112, India's emergency number? Only proceed if you need emergency help."
    );

    if (confirmed) {
        window.location.href = "tel:112";
    }
});
