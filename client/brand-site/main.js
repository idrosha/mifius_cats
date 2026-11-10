(() => {
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reveal = () => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const showAll = () => nodes.forEach((el) => el.classList.add("is-in"));

    if (reduceMotion || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    // Hero + header in first paint — no wait for observer
    document
      .querySelectorAll(".site-header [data-reveal], .hero [data-reveal]")
      .forEach((el) => el.classList.add("is-in"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    nodes.forEach((el) => io.observe(el));
    // Safety net for headless / slow fonts
    window.setTimeout(showAll, 1200);
  };

  const embers = () => {
    if (reduceMotion) return;
    const layer = document.getElementById("embers");
    if (!layer) return;

    const count = 18;
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      spark.className = "ember";
      spark.style.left = `${8 + Math.random() * 84}%`;
      spark.style.animationDuration = `${9 + Math.random() * 12}s`;
      spark.style.animationDelay = `${Math.random() * 8}s`;
      spark.style.width = spark.style.height = `${2 + Math.random() * 3}px`;
      layer.appendChild(spark);
    }
  };

  const headerShrink = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const onScroll = () => {
      header.dataset.scrolled = window.scrollY > 24 ? "1" : "0";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  };

  reveal();
  embers();
  headerShrink();
})();
