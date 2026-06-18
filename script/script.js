(() => {
  "use strict";

  const THEME_KEY = "theme";
  const DARK_THEME = "dark";
  const LIGHT_THEME = "light";
  const SLIDESHOW_AUTOPLAY_DELAY = 4200;

  const html = document.documentElement;
  const body = document.body;
  const siteHeader = document.querySelector(".site-header");
  const themeButton = document.getElementById("darkLightModeButton");
  const themeIcon = themeButton?.querySelector(".theme-toggle-icon");
  const menuButton = document.getElementById("menuToggle");
  const navMenu = document.getElementById("primary-navigation");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const pageSections = navLinks
    .map((link) => getNavLinkHash(link))
    .filter(Boolean)
    .map((hash) => {
      try {
        return document.querySelector(hash);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const toast = document.getElementById("toast");

  let toastTimer;
  let lastScrollY = window.scrollY;
  let isScrollTicking = false;

  const safeStorage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Local storage is optional. */
      }
    },
  };

  function getNavLinkHash(link) {
    const href = link.getAttribute("href");
    if (!href) return "";

    try {
      return new URL(href, window.location.href).hash;
    } catch {
      return href.startsWith("#") ? href : "";
    }
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? DARK_THEME
      : LIGHT_THEME;
  }

  function getCurrentTheme() {
    return html.dataset.theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
  }

  function applyTheme(theme) {
    const isDark = theme === DARK_THEME;
    html.dataset.theme = isDark ? DARK_THEME : LIGHT_THEME;
    body.classList.toggle("dark-mode", isDark);

    if (themeIcon) {
      themeIcon.classList.toggle("fa-moon", !isDark);
      themeIcon.classList.toggle("fa-sun", isDark);
    }

    if (themeButton) {
      themeButton.setAttribute("aria-pressed", String(isDark));
      themeButton.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        /* Fall back for browsers that expose clipboard but deny writes. */
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "-999px";
    document.body.append(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const didCopy = document.execCommand("copy");
    textArea.remove();

    if (!didCopy) {
      throw new Error("Copy command failed");
    }
  }

  function setMenuState(isOpen, shouldFocusButton = false) {
    if (!menuButton || !navMenu) return;

    menuButton.classList.toggle("is-active", isOpen);
    navMenu.classList.toggle("is-active", isOpen);
    body.classList.toggle("nav-open", isOpen);
    siteHeader?.classList.remove("is-hidden");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );

    if (isOpen) {
      window.setTimeout(() => {
        const firstLink = navMenu.querySelector("a");
        try {
          firstLink?.focus({ preventScroll: true });
        } catch {
          firstLink?.focus();
        }
      }, 80);
    } else if (shouldFocusButton) {
      menuButton.focus({ preventScroll: true });
    }
  }

  function isMenuOpen() {
    return menuButton?.getAttribute("aria-expanded") === "true";
  }

  function setActiveNavLink(sectionId) {
    navLinks.forEach((link) => {
      const isActive = getNavLinkHash(link) === `#${sectionId}`;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateActiveNavLink() {
    if (!pageSections.length) return;

    const readingLine = window.scrollY + window.innerHeight * 0.38;
    let currentSection = pageSections[0];

    pageSections.forEach((section) => {
      if (section.offsetTop <= readingLine) {
        currentSection = section;
      }
    });

    const bottomReached =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    setActiveNavLink(bottomReached ? pageSections.at(-1).id : currentSection.id);
  }

  function updateHeaderOnScroll() {
    if (!siteHeader) return;

    const currentScrollY = Math.max(window.scrollY, 0);
    const isNearTop = currentScrollY < 80;
    const isScrollingDown = currentScrollY > lastScrollY;

    siteHeader.classList.toggle("is-scrolled", currentScrollY > 12);
    siteHeader.classList.toggle(
      "is-hidden",
      isScrollingDown && !isNearTop && !isMenuOpen()
    );

    lastScrollY = currentScrollY;
  }

  function handleScroll() {
    if (isScrollTicking) return;

    isScrollTicking = true;
    window.requestAnimationFrame(() => {
      updateHeaderOnScroll();
      updateActiveNavLink();
      isScrollTicking = false;
    });
  }

  function initThemeToggle() {
    const savedTheme = safeStorage.get(THEME_KEY);
    applyTheme(savedTheme || html.dataset.theme || getSystemTheme());

    themeButton?.addEventListener("click", () => {
      const nextTheme = getCurrentTheme() === DARK_THEME ? LIGHT_THEME : DARK_THEME;
      safeStorage.set(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
      showToast(`${nextTheme === DARK_THEME ? "Dark" : "Light"} mode enabled.`);
    });
  }

  function initCopyButtons() {
    document.querySelectorAll(".copy-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const text = button.getAttribute("data-copy-text");
        const label = button.getAttribute("data-copy-label") || "text";

        if (!text) return;

        try {
          await copyText(text);
          showToast(`Copied ${label}.`);
        } catch {
          showToast("Copy failed. Select the text and copy it manually.");
        }
      });
    });
  }

  function initResumeDownload() {
    document.getElementById("downloadResumeBtn")?.addEventListener("click", () => {
      showToast("Resume download started.");
    });
  }

  function initProjectSlideshows() {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.querySelectorAll("[data-slideshow]").forEach((slideshow) => {
      const slides = [...slideshow.querySelectorAll("[data-slide]")];
      const dotsContainer = slideshow.querySelector("[data-slide-dots]");

      if (!slides.length) return;

      if (dotsContainer && !dotsContainer.children.length && slides.length > 1) {
        slides.forEach((_, index) => {
          const dot = document.createElement("button");
          dot.className = "slideshow-dot";
          dot.type = "button";
          dot.setAttribute("data-slide-dot", "");
          dot.setAttribute("aria-label", `Show slide ${index + 1}`);
          dotsContainer.append(dot);
        });
      }

      const dots = [...slideshow.querySelectorAll("[data-slide-dot]")];
      const hasMultipleSlides = slides.length > 1;
      let activeIndex = slides.findIndex((slide) =>
        slide.classList.contains("is-active")
      );
      let autoplayTimer;

      if (activeIndex < 0) {
        activeIndex = 0;
      }

      if (dotsContainer instanceof HTMLElement) {
        dotsContainer.hidden = !hasMultipleSlides;
      }

      function setSlide(nextIndex) {
        activeIndex = (nextIndex + slides.length) % slides.length;

        slides.forEach((slide, index) => {
          const isActive = index === activeIndex;
          slide.classList.toggle("is-active", isActive);
          slide.setAttribute("aria-hidden", String(!isActive));
        });

        dots.forEach((dot, index) => {
          const isActive = index === activeIndex;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-pressed", String(isActive));
        });
      }

      function stopAutoplay() {
        window.clearInterval(autoplayTimer);
        autoplayTimer = undefined;
      }

      function canAutoplay() {
        return (
          hasMultipleSlides &&
          !reduceMotionQuery.matches &&
          !document.hidden &&
          !slideshow.matches(":hover") &&
          !slideshow.contains(document.activeElement)
        );
      }

      function startAutoplay() {
        if (!canAutoplay()) return;

        stopAutoplay();
        autoplayTimer = window.setInterval(() => {
          setSlide(activeIndex + 1);
        }, SLIDESHOW_AUTOPLAY_DELAY);
      }

      function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
      }

      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          setSlide(index);
          restartAutoplay();
        });
      });

      slideshow.addEventListener("keydown", (event) => {
        if (!hasMultipleSlides) return;

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setSlide(activeIndex - 1);
          restartAutoplay();
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          setSlide(activeIndex + 1);
          restartAutoplay();
        }
      });

      slideshow.addEventListener("mouseenter", stopAutoplay);
      slideshow.addEventListener("mouseleave", startAutoplay);
      slideshow.addEventListener("focusin", stopAutoplay);
      slideshow.addEventListener("focusout", (event) => {
        if (!event.relatedTarget || !slideshow.contains(event.relatedTarget)) {
          startAutoplay();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });

      reduceMotionQuery.addEventListener("change", () => {
        if (reduceMotionQuery.matches) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });

      setSlide(activeIndex);
      startAutoplay();
    });
  }

  function initMobileMenu() {
    menuButton?.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      setMenuState(!isOpen);
    });

    navMenu?.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        setMenuState(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuState(false, true);
      }
    });

    window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
      if (event.matches) {
        setMenuState(false);
      }
    });
  }

  function initNavigationState() {
    updateHeaderOnScroll();
    updateActiveNavLink();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateActiveNavLink);
  }

  function initTypedHeadline() {
    const target = document.querySelector(".multiText");
    if (!target) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phrases = ["UI/UX Designer", "Full-Stack Developer"];

    if (reduceMotion) {
      target.textContent = phrases[0];
      return;
    }

    let phraseIndex = 0;
    let characterIndex = phrases[0].length;
    let isDeleting = false;

    function tick() {
      const phrase = phrases[phraseIndex];
      target.textContent = phrase.slice(0, characterIndex);

      if (!isDeleting && characterIndex < phrase.length) {
        characterIndex += 1;
        window.setTimeout(tick, 85);
        return;
      }

      if (!isDeleting && characterIndex === phrase.length) {
        isDeleting = true;
        window.setTimeout(tick, 1200);
        return;
      }

      if (isDeleting && characterIndex > 0) {
        characterIndex -= 1;
        window.setTimeout(tick, 45);
        return;
      }

      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      window.setTimeout(tick, 350);
    }

    tick();
  }

  function initFooterYear() {
    const currentYear = document.getElementById("currentYear");
    if (currentYear) {
      currentYear.textContent = String(new Date().getFullYear());
    }
  }

  initThemeToggle();
  initCopyButtons();
  initResumeDownload();
  initProjectSlideshows();
  initMobileMenu();
  initNavigationState();
  initTypedHeadline();
  initFooterYear();
})();