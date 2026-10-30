const btnGenerate = document.querySelector("#generate-pdf");
const btnIdioma = document.querySelector("#idioma");
const btnDarkMode = document.querySelector("#dark-mode-toggle");
const btnMedium = document.querySelector("#medium-link");
const buttonsContainer = document.querySelector(".buttons-container");
const backToTopButton = document.getElementById("back-to-top");
const headerTitle = document.querySelector("header h1");
const pageTitle = document.getElementById("page-title");
const metaDescription = document.getElementById("meta-description");

const NOME_COMPLETO = "Edivaldo da Costa Lima Júnior";
const NOME_CURTO = "Edivaldo Costa";
const LANG_STORAGE_KEY = "curriculo-lang";
const EMAIL = "edivaldocostadv@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/edivaldocljunior";

const btnCopyEmail = document.querySelector("#copy-email");
const btnCopyLinkedin = document.querySelector("#copy-linkedin");
const toastEl = document.getElementById("toast");

let currentLang = "pt";
let printState = null;

const MOBILE_TOOLBAR_MQ = window.matchMedia("(max-width: 768px)");

function usesStickyToolbar() {
    return MOBILE_TOOLBAR_MQ.matches;
}

function getLangFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    return lang === "en" ? "en" : null;
}

function applyLanguage(lang) {
    if (!I18N[lang]) return;

    currentLang = lang;
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        const text = I18N[lang][key];
        if (text !== undefined) {
            el.textContent = text;
        }
    });

    if (pageTitle && I18N[lang]["meta.title"]) {
        pageTitle.textContent = I18N[lang]["meta.title"];
    }

    if (metaDescription && I18N[lang]["meta.description"]) {
        metaDescription.setAttribute("content", I18N[lang]["meta.description"]);
    }

    btnIdioma.setAttribute(
        "aria-label",
        I18N[lang][lang === "pt" ? "btn.lang" : "btn.lang.alt"]
    );
    btnIdioma.querySelectorAll(".lang-opt").forEach((opt) => {
        opt.classList.toggle("is-active", opt.dataset.lang === lang);
    });

    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_) {
        /* ignore */
    }

    const url = new URL(window.location.href);
    if (lang === "en") {
        url.searchParams.set("lang", "en");
    } else {
        url.searchParams.delete("lang");
    }
    history.replaceState({}, "", url);

    if (btnCopyEmail) {
        btnCopyEmail.setAttribute("aria-label", I18N[lang]["contact.copyEmail"]);
    }
    if (btnCopyLinkedin) {
        btnCopyLinkedin.setAttribute("aria-label", I18N[lang]["contact.copyLinkedin"]);
    }

    ajustarTituloMobile();
}

function initLanguage() {
    const urlLang = getLangFromUrl();
    let savedLang = null;
    try {
        savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    } catch (_) {
        /* ignore */
    }
    const lang = urlLang || (savedLang === "en" ? "en" : "pt");
    applyLanguage(lang);
}

function toggleLanguage() {
    applyLanguage(currentLang === "pt" ? "en" : "pt");
}

function updateToolbarMode() {
    if (usesStickyToolbar()) {
        buttonsContainer.classList.remove("fixed");
        document.body.classList.remove("toolbar-fixed");
        return;
    }
}

MOBILE_TOOLBAR_MQ.addEventListener("change", updateToolbarMode);

let lastScrollTop = 0;
window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const header = document.querySelector("header");
    const headerHeight = header ? header.offsetHeight + 50 : 100;

    if (usesStickyToolbar()) {
        buttonsContainer.classList.remove("fixed");
        document.body.classList.remove("toolbar-fixed");
    } else if (scrollTop > headerHeight) {
        buttonsContainer.classList.add("fixed");
        document.body.classList.add("toolbar-fixed");
    } else {
        buttonsContainer.classList.remove("fixed");
        document.body.classList.remove("toolbar-fixed");
    }

    if (scrollTop > 300) {
        backToTopButton.classList.add("show");
    } else {
        backToTopButton.classList.remove("show");
    }

    lastScrollTop = scrollTop;
});

function prepareForPrint() {
    if (printState) return;

    printState = {
        darkMode: document.body.classList.contains("dark-mode"),
        scroll: window.pageYOffset || document.documentElement.scrollTop,
        wasFixed: buttonsContainer.classList.contains("fixed"),
    };

    buttonsContainer.classList.remove("fixed");
    document.body.classList.remove("toolbar-fixed");
    window.scrollTo(0, 0);

    if (printState.darkMode) {
        document.body.classList.remove("dark-mode");
    }

    if (headerTitle) {
        headerTitle.textContent = NOME_COMPLETO;
    }

    document.body.classList.add("printing");
}

function restoreAfterPrint() {
    if (!printState) return;

    if (printState.darkMode) {
        document.body.classList.add("dark-mode");
    }

    ajustarTituloMobile();

    window.scrollTo(0, printState.scroll);

    if (printState.wasFixed && !usesStickyToolbar()) {
        buttonsContainer.classList.add("fixed");
        document.body.classList.add("toolbar-fixed");
    }

    if (printState.scroll > 300) {
        backToTopButton.classList.add("show");
    }

    document.body.classList.remove("printing");
    printState = null;
}

window.addEventListener("beforeprint", prepareForPrint);
window.addEventListener("afterprint", restoreAfterPrint);

if (window.matchMedia) {
    window.matchMedia("print").addEventListener("change", (event) => {
        if (!event.matches) {
            restoreAfterPrint();
        }
    });
}

btnGenerate.addEventListener("click", () => {
    prepareForPrint();
    window.print();
});

btnDarkMode.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});

btnIdioma.addEventListener("click", toggleLanguage);

function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add("is-visible");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
        toastEl.classList.remove("is-visible");
        toastEl.hidden = true;
    }, 2200);
}

async function copyTextToClipboard(text, toastKey) {
    const copiedMsg = I18N[currentLang][toastKey] || text;
    try {
        await navigator.clipboard.writeText(text);
        showToast(copiedMsg);
    } catch (_) {
        const input = document.createElement("textarea");
        input.value = text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        try {
            document.execCommand("copy");
            showToast(copiedMsg);
        } catch {
            showToast(text);
        }
        document.body.removeChild(input);
    }
}

if (btnCopyEmail) {
    btnCopyEmail.addEventListener("click", () => copyTextToClipboard(EMAIL, "contact.copiedEmail"));
}

if (btnCopyLinkedin) {
    btnCopyLinkedin.addEventListener("click", () => copyTextToClipboard(LINKEDIN_URL, "contact.copiedLinkedin"));
}

function ajustarTituloMobile() {
    if (!headerTitle) return;
    if (window.innerWidth <= 480) {
        headerTitle.textContent = NOME_CURTO;
    } else {
        headerTitle.textContent = NOME_COMPLETO;
    }
}

backToTopButton.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
});

window.addEventListener("resize", () => {
    ajustarTituloMobile();
    updateToolbarMode();
});
window.addEventListener("load", () => {
    initLanguage();
    updateToolbarMode();
});
