/* ==========================================================================
   Shamains Design Group — interactions
   Progressive enhancement, no dependencies.
   ========================================================================== */

(function () {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------------ */

  $$("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------------------
     Header, reading progress, back-to-top, active navigation, parallax
     ------------------------------------------------------------------------ */

  const header = $("[data-header]");
  const progress = $("[data-progress]");
  const backToTop = $(".back-to-top");
  const parallaxEls = $$("[data-parallax]");
  const navLinks = $$(".primary-nav .nav-link");
  const navSections = navLinks
    .map((link) => {
      const href = link.getAttribute("href") || "";
      return href.startsWith("#") ? document.getElementById(href.slice(1)) : null;
    })
    .filter(Boolean);

  let scrollFrame = null;

  function updateParallax() {
    if (!parallaxEls.length) return;
    if (reducedMotion.matches || window.innerWidth < 768) {
      parallaxEls.forEach((el) => el.style.setProperty("--parallax", "0px"));
      return;
    }

    const viewportCentre = window.innerHeight / 2;
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const distance = rect.top + rect.height / 2 - viewportCentre;
      const offset = Math.max(-64, Math.min(64, distance * -0.09));
      el.style.setProperty("--parallax", offset.toFixed(1) + "px");
    });
  }

  function setActiveNav() {
    if (!navSections.length) return;
    const marker = window.scrollY + window.innerHeight * 0.34;
    let current = null;

    navSections.forEach((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = section;
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = current && href === "#" + current.id;
      link.classList.toggle("is-active", Boolean(isActive));
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 700);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
      progress.style.width = percentage + "%";
    }

    setActiveNav();
    updateParallax();
    scrollFrame = null;
  }

  function requestScrollUpdate() {
    if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(onScroll);
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  onScroll();

  $$("[data-to-top]").forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    });
  });

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */

  const menu = $("[data-menu]");
  const menuToggle = $("[data-menu-toggle]");
  const menuClose = $("[data-menu-close]");
  let menuReturnFocus = null;

  function openMenu() {
    if (!menu || !menuToggle) return;
    menuReturnFocus = document.activeElement;
    menu.classList.add("is-open");
    menu.removeAttribute("inert");
    menu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    window.setTimeout(() => {
      if (menuClose) menuClose.focus();
    }, 120);
  }

  function closeMenu(restoreFocus = true) {
    if (!menu || !menuToggle) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("inert", "");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (restoreFocus && menuReturnFocus) menuReturnFocus.focus();
    menuReturnFocus = null;
  }

  if (menu && menuToggle) {
    menuToggle.addEventListener("click", openMenu);
    if (menuClose) menuClose.addEventListener("click", () => closeMenu());

    $$("a", menu).forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (!menu.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key === "Tab") {
        const focusables = $$(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          menu
        ).filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 1101px)");
    const handleViewportChange = (event) => {
      if (event.matches) closeMenu(false);
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", handleViewportChange);
    else desktopQuery.addListener(handleViewportChange);
  }

  /* ------------------------------------------------------------------------
     Scroll reveals
     ------------------------------------------------------------------------ */

  const revealEls = $$("[data-reveal]");

  function revealAll() {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  if (!revealEls.length) {
    /* no-op */
  } else if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------------------
     Services accordion
     ------------------------------------------------------------------------ */

  const accordion = $("[data-accordion]");

  if (accordion) {
    const services = $$(".service", accordion);
    const previewImages = $$("[data-preview]");
    const previewLabel = $("[data-preview-label]");
    const previewIndex = $("[data-preview-index]");
    const defaultOpen = services.find((service) => service.classList.contains("is-open")) || services[0];

    accordion.classList.add("is-ready");

    function syncServiceState(activeService) {
      services.forEach((service) => {
        const isOpen = service === activeService;
        const trigger = $(".service__trigger", service);
        const panel = $(".service__panel", service);

        service.classList.toggle("is-open", isOpen);
        if (trigger) trigger.setAttribute("aria-expanded", String(isOpen));
        if (panel) {
          panel.setAttribute("aria-hidden", String(!isOpen));
          if (isOpen) panel.removeAttribute("inert");
          else panel.setAttribute("inert", "");
        }
      });
    }

    function updateServicePreview(service) {
      if (!service) return;
      const trigger = $(".service__trigger", service);
      if (!trigger) return;
      const target = trigger.dataset.previewTarget;

      previewImages.forEach((img) => {
        img.classList.toggle("is-active", img.dataset.preview === target);
      });
      if (previewLabel) previewLabel.textContent = trigger.dataset.previewName || "";
      if (previewIndex) previewIndex.textContent = trigger.dataset.previewNumber || "";
    }

    if (defaultOpen) {
      syncServiceState(defaultOpen);
      updateServicePreview(defaultOpen);
    }

    services.forEach((service) => {
      const trigger = $(".service__trigger", service);
      if (!trigger) return;

      trigger.addEventListener("click", () => {
        if (service.classList.contains("is-open")) return;
        syncServiceState(service);
        updateServicePreview(service);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Reviews carousel
     ------------------------------------------------------------------------ */

  const carousel = $("[data-carousel]");

  if (carousel) {
    const track = $("[data-carousel-track]", carousel);
    const slides = $$(".review", carousel);
    const dots = $$("[data-carousel-dot]", carousel);
    const previous = $("[data-carousel-prev]", carousel);
    const next = $("[data-carousel-next]", carousel);
    const currentLabel = $("[data-carousel-current]", carousel);
    const viewport = $("[data-carousel-viewport]", carousel);
    let activeIndex = 0;

    function showReview(nextIndex) {
      if (!slides.length) return;
      activeIndex = (nextIndex + slides.length) % slides.length;
      if (track) track.style.transform = "translateX(-" + activeIndex * 100 + "%)";

      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.setAttribute("aria-hidden", String(!isActive));
        if (isActive) slide.removeAttribute("inert");
        else slide.setAttribute("inert", "");
      });

      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle("is-active", isActive);
        if (isActive) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });

      if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, "0");
    }

    if (previous) previous.addEventListener("click", () => showReview(activeIndex - 1));
    if (next) next.addEventListener("click", () => showReview(activeIndex + 1));

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => showReview(index));
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showReview(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showReview(activeIndex + 1);
      }
    });

    if (viewport) {
      let startX = null;
      let startY = null;

      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;
        startX = event.clientX;
        startY = event.clientY;
      });

      viewport.addEventListener("pointerup", (event) => {
        if (startX === null || startY === null) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
          showReview(activeIndex + (deltaX < 0 ? 1 : -1));
        }
        startX = null;
        startY = null;
      });

      viewport.addEventListener("pointercancel", () => {
        startX = null;
        startY = null;
      });
    }

    showReview(0);
  }

  /* ------------------------------------------------------------------------
     Contact form → WhatsApp
     ------------------------------------------------------------------------ */

  const contactForm = $("[data-contact-form]");

  if (contactForm) {
    const status = $("[data-form-status]", contactForm);

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!contactForm.reportValidity()) return;

      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const phone = String(data.get("phone") || "").trim() || "Not provided";
      const project = String(data.get("project") || "").trim() || "Not specified";
      const message = String(data.get("message") || "").trim();

      const body = [
        "New project enquiry — Shamains Design Group",
        "",
        "Name: " + name,
        "Email: " + email,
        "Phone: " + phone,
        "Project: " + project,
        "",
        "Message:",
        message
      ].join("\n");

      const whatsappUrl = "https://wa.me/919811033803?text=" + encodeURIComponent(body);
      const emailUrl =
        "mailto:info@shamainsdesigngroup.com?subject=" +
        encodeURIComponent("Project enquiry — " + name) +
        "&body=" +
        encodeURIComponent(body);

      let opened = null;
      try {
        opened = window.open(whatsappUrl, "_blank", "noopener");
      } catch (error) {
        opened = null;
      }

      if (status) {
        status.hidden = false;
        status.classList.remove("is-error");
        status.textContent = "";

        const message = document.createElement("p");
        message.textContent = opened
          ? "Thank you, " + name + ". Your enquiry is ready in WhatsApp — press send there to reach the studio."
          : "Thank you, " + name + ". Use the link below to send your enquiry on WhatsApp, or email the studio directly.";
        status.appendChild(message);

        const actions = document.createElement("p");
        actions.className = "form__status-links";

        const whatsappLink = document.createElement("a");
        whatsappLink.href = whatsappUrl;
        whatsappLink.target = "_blank";
        whatsappLink.rel = "noopener";
        whatsappLink.textContent = "Open WhatsApp";

        const emailLink = document.createElement("a");
        emailLink.href = emailUrl;
        emailLink.textContent = "Send by email";

        actions.appendChild(whatsappLink);
        actions.appendChild(emailLink);
        status.appendChild(actions);
      }

      contactForm.reset();
    });
  }

  /* ------------------------------------------------------------------------
     Project gallery lightbox
     ------------------------------------------------------------------------ */

  const lightbox = $("[data-lightbox-dialog]");
  const lightboxTriggers = $$("[data-lightbox]");

  if (lightbox && lightboxTriggers.length) {
    const image = $("[data-lightbox-image]", lightbox);
    const caption = $("[data-lightbox-caption]", lightbox);
    const counter = $("[data-lightbox-count]", lightbox);
    const closeButton = $("[data-lightbox-close]", lightbox);
    const previousButton = $("[data-lightbox-prev]", lightbox);
    const nextButton = $("[data-lightbox-next]", lightbox);
    let activeIndex = 0;
    let returnFocusTo = null;

    const items = lightboxTriggers.map((trigger) => {
      const img = $("img", trigger);
      return {
        full: trigger.dataset.full || (img ? img.currentSrc || img.src : ""),
        caption: trigger.dataset.caption || (img ? img.alt : ""),
        alt: img ? img.alt : ""
      };
    });

    function updateLightbox(index) {
      activeIndex = (index + items.length) % items.length;
      const item = items[activeIndex];
      if (!item) return;
      if (image) {
        image.src = item.full;
        image.alt = item.alt;
      }
      if (caption) caption.textContent = item.caption;
      if (counter) {
        counter.textContent =
          String(activeIndex + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
      }

      const preload = new Image();
      preload.src = items[(activeIndex + 1) % items.length].full;
    }

    function openLightbox(index, trigger) {
      returnFocusTo = trigger;
      updateLightbox(index);
      if (!lightbox.open) {
        document.body.classList.add("dialog-open");
        lightbox.showModal();
      }
      if (closeButton) closeButton.focus();
    }

    lightboxTriggers.forEach((trigger, index) => {
      trigger.addEventListener("click", () => openLightbox(index, trigger));
    });

    if (closeButton) closeButton.addEventListener("click", () => lightbox.close());
    if (previousButton) previousButton.addEventListener("click", () => updateLightbox(activeIndex - 1));
    if (nextButton) nextButton.addEventListener("click", () => updateLightbox(activeIndex + 1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateLightbox(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        updateLightbox(activeIndex + 1);
      }
    });

    lightbox.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (returnFocusTo) returnFocusTo.focus();
      returnFocusTo = null;
    });
  }
})();
