document.addEventListener('DOMContentLoaded', function () {

  /* Mobile nav toggle */
  var burger = document.querySelector('[data-burger]');
  var nav = document.querySelector('[data-nav]');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('is-open'); });
    });
  }

  /* Copy password / demo url chips */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(function () {
        var original = btn.innerHTML;
        btn.innerHTML = '&#10003;';
        setTimeout(function () { btn.innerHTML = original; }, 1200);
      });
    });
  });

  /* Scroll reveal */
  var toReveal = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && toReveal.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    toReveal.forEach(function (el) { io.observe(el); });
  } else {
    toReveal.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Phone mockup play button -> swap poster for real <video> if data-video is filled in */
  document.querySelectorAll('[data-play-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.phone-mock');
      var src = wrap ? wrap.getAttribute('data-video-src') : '';
      if (src) {
        wrap.querySelector('.frame').innerHTML =
          '<video src="' + src + '" controls autoplay playsinline style="width:100%;height:100%;object-fit:cover"></video>';
      } else {
        alert('Add your mobile preview video: set data-video-src on the .phone-mock element.');
      }
    });
  });

  /* Hero: full-page screenshot auto-scrolls on hover (tap on touch). scrollTop-driven => never blurry. */
  document.querySelectorAll('[data-scroll-preview]').forEach(function (box) {
    var SPEED = 170;          /* px per second going down — slow & smooth */
    var BACK  = 900;          /* px per second going back up */
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var dir = 0, raf = 0, last = 0, pos = 0, started = 0;
    function max() { return box.scrollHeight - box.clientHeight; }
    function ease(t) { return t < 1 ? t * t * (3 - 2 * t) : 1; }   /* smoothstep ramp-up so it never lurches */
    function frame(now) {
      if (!last) last = now;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (dir > 0) {
        var ramp = ease((now - started) / 1200);
        pos += SPEED * ramp * dt;
      } else if (dir < 0) {
        pos -= BACK * dt;
      }
      pos = Math.max(0, Math.min(max(), pos));
      box.scrollTop = pos;
      if ((dir > 0 && pos < max()) || (dir < 0 && pos > 0)) { raf = requestAnimationFrame(frame); }
      else { raf = 0; last = 0; if (dir > 0) box.classList.add('is-scrolling'); if (dir < 0) box.classList.remove('is-scrolling'); }
    }
    function go(d) {
      dir = d; last = 0; started = performance.now();
      box.classList.toggle('is-scrolling', d > 0);
      if (!raf) raf = requestAnimationFrame(frame);
    }
    if (window.matchMedia('(hover: none)').matches) {
      box.addEventListener('click', function () { go(dir > 0 ? -1 : 1); });
    } else {
      box.addEventListener('mouseenter', function () { pos = box.scrollTop; go(1); });
      box.addEventListener('mouseleave', function () { pos = box.scrollTop; go(-1); });
      box.addEventListener('focus', function () { pos = box.scrollTop; go(1); });
      box.addEventListener('blur', function () { pos = box.scrollTop; go(-1); });
    }
  });

  /* Testimonials: full-width slider - arrows, drag/scroll, slow autoplay (pauses on hover/focus) */
  document.querySelectorAll('[data-testi-slider]').forEach(function (slider) {
    var track = slider.querySelector('.testi-track');
    var prev = slider.querySelector('[data-prev]');
    var next = slider.querySelector('[data-next]');
    if (!track) return;
    function step() {
      var card = track.querySelector('.testi-card');
      return card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
    }
    function atEnd() { return track.scrollLeft >= track.scrollWidth - track.clientWidth - 4; }
    function move(dir) {
      if (dir > 0 && atEnd()) { track.scrollTo({ left: 0, behavior: 'smooth' }); return; }
      if (dir < 0 && track.scrollLeft <= 4) { track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' }); return; }
      track.scrollBy({ left: dir * step(), behavior: 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { move(-1); });
    if (next) next.addEventListener('click', function () { move(1); });
    var timer = 0, paused = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function start() { if (reduce || timer) return; timer = setInterval(function () { if (!paused) move(1); }, 5500); }
    function stop() { paused = true; }
    function resume() { paused = false; }
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (e) { slider.addEventListener(e, stop, { passive: true }); });
    ['mouseleave', 'focusout', 'touchend'].forEach(function (e) { slider.addEventListener(e, resume, { passive: true }); });
    start();
    var down = false, sx = 0, sl = 0;
    track.addEventListener('mousedown', function (e) { down = true; sx = e.pageX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; track.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', function () { if (!down) return; down = false; track.style.scrollSnapType = ''; track.style.cursor = ''; });
    track.addEventListener('mousemove', function (e) { if (!down) return; e.preventDefault(); track.scrollLeft = sl - (e.pageX - sx); });
  });

  /* ---- Conversion round ---------------------------------------------------
     BUY_URL: paste your ThemeForest item URL here ONCE - every "Buy" button uses it.
     Price: read from the pricing card (.pricing-card .amount) and shown in every Buy button. */
  var BUY_URL = 'https://themeforest.net/user/themesflat'; /* TODO: replace with the Ovinx item URL once it is live on ThemeForest */
  var amount = document.querySelector('.pricing-card .amount');
  if (amount) {
    document.querySelectorAll('[data-price]').forEach(function (el) { el.textContent = amount.textContent.trim(); });
  }
  if (BUY_URL) {
    document.querySelectorAll('[data-buy]').forEach(function (a) {
      a.setAttribute('href', BUY_URL); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
    });
  }

  /* Sticky CTA: appears after the hero, hides while pricing / final CTA are on screen */
  var bar = document.getElementById('stickyCta');
  var heroStage = document.querySelector('.hero-stage');
  var pricing = document.getElementById('pricing');
  var finalCta = document.querySelector('.footer-cta');
  if (bar && heroStage) {
    var ticking = false;
    function inView(el) {
      if (!el) return false;
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.85 && r.bottom > window.innerHeight * 0.15;
    }
    function update() {
      ticking = false;
      var pastHero = heroStage.getBoundingClientRect().bottom < 0;
      var show = pastHero && !inView(pricing) && !inView(finalCta);
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      bar.querySelectorAll('a').forEach(function (a) { a.tabIndex = show ? 0 : -1; });
      document.body.classList.toggle('has-sticky-cta', show);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Mobile-first phone video: autoplay muted loop, only while on screen */
  document.querySelectorAll('.phone-video').forEach(function (v) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { v.controls = true; return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
          else { v.pause(); }
        });
      }, { threshold: 0.35 }).observe(v);
    } else {
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    }
  });

});
