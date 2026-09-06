(function () {
  "use strict";

  var MAX_DIMENSION = 400;
  var JPEG_QUALITY = 0.55;
  var LENGTH_WARNING_THRESHOLD = 15000; // characters in the final URL
  var DECOR_EMOJI = ["🎈", "🎈", "🎈", "🎉", "✨", "🎂", "🥳", "🎁", "🌟"];

  var state = {
    theme: "pink",
    images: [null, null, null] // dataURLs
  };

  function startFloatingDecor() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var layer = document.getElementById("decorLayer");
    if (!layer) return;
    var count = window.innerWidth < 600 ? 8 : 14;
    for (var i = 0; i < count; i++) {
      var el = document.createElement("span");
      el.className = "decor-item";
      el.textContent = DECOR_EMOJI[Math.floor(Math.random() * DECOR_EMOJI.length)];
      var size = 18 + Math.random() * 20;
      var duration = 16 + Math.random() * 14;
      var delay = -Math.random() * duration;
      var left = Math.random() * 100;
      var drift = (Math.random() * 120 - 60).toFixed(0) + "px";
      var spin = (Math.random() * 40 - 20).toFixed(0) + "deg";
      el.style.left = left + "%";
      el.style.fontSize = size + "px";
      el.style.animationDuration = duration + "s";
      el.style.animationDelay = delay + "s";
      el.style.setProperty("--drift", drift);
      el.style.setProperty("--spin", spin);
      layer.appendChild(el);
    }
  }

  // ---------- helpers ----------

  function resizeImageFile(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var reader = new FileReader();
      reader.onload = function (e) {
        img.onload = function () {
          var w = img.width, h = img.height;
          var scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
          var cw = Math.round(w * scale), ch = Math.round(h * scale);
          var canvas = document.createElement("canvas");
          canvas.width = cw;
          canvas.height = ch;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function buildPolaroidsHtml(images) {
    var html = "";
    for (var i = 0; i < 3; i++) {
      if (images[i]) {
        html += '<div class="polaroid"><img src="' + images[i] + '" alt=""></div>';
      } else {
        html += '<div class="polaroid empty" data-slot="' + i + '"><span>' + (i + 1) + "</span></div>";
      }
    }
    return html;
  }

  // ---------- compose mode ----------

  function initCompose() {
    var toNameEl = document.getElementById("toName");
    var fromNameEl = document.getElementById("fromName");
    var messageEl = document.getElementById("message");
    var charCountEl = document.getElementById("charCount");
    var previewHeadline = document.getElementById("previewHeadline");
    var previewMessage = document.getElementById("previewMessage");
    var previewFrom = document.getElementById("previewFrom");
    var previewPolaroids = document.getElementById("previewPolaroids");
    var previewCard = document.getElementById("previewCard");
    var form = document.getElementById("wishForm");
    var linkOutput = document.getElementById("linkOutput");
    var wishLinkInput = document.getElementById("wishLink");
    var copyBtn = document.getElementById("copyBtn");
    var shareBtn = document.getElementById("shareBtn");
    var toggleLinkBtn = document.getElementById("toggleLinkBtn");
    var linkRow = document.getElementById("linkRow");
    var previewLink = document.getElementById("previewLink");
    var lengthWarning = document.getElementById("lengthWarning");
    var currentWishTitle = "";

    function updatePreview() {
      var toName = toNameEl.value.trim();
      var fromName = fromNameEl.value.trim();
      var message = messageEl.value.trim();

      previewHeadline.textContent = toName ? "Happy Birthday, " + toName + "!" : "Happy Birthday!";
      previewMessage.textContent = message || "Your message will show up here as you type.";
      if (fromName) {
        previewFrom.textContent = "— " + fromName;
        previewFrom.hidden = false;
      } else {
        previewFrom.hidden = true;
      }
      previewPolaroids.innerHTML = buildPolaroidsHtml(state.images);
    }

    toNameEl.addEventListener("input", updatePreview);
    fromNameEl.addEventListener("input", updatePreview);
    messageEl.addEventListener("input", function () {
      charCountEl.textContent = String(messageEl.value.length);
      updatePreview();
    });

    // photo slots
    document.querySelectorAll(".photo-input").forEach(function (input) {
      input.addEventListener("change", function () {
        var index = parseInt(input.dataset.index, 10);
        var file = input.files && input.files[0];
        if (!file) return;
        resizeImageFile(file).then(function (dataUrl) {
          state.images[index] = dataUrl;
          var slot = input.closest(".photo-slot");
          slot.classList.add("filled");
          slot.style.backgroundImage = "url(" + dataUrl + ")";
          updatePreview();
        }).catch(function () {
          alert("That image couldn't be read. Try a different photo.");
        });
      });
    });

    // theme picker
    document.querySelectorAll(".theme-swatch").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".theme-swatch").forEach(function (b) {
          b.classList.remove("selected");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("selected");
        btn.setAttribute("aria-pressed", "true");
        state.theme = btn.dataset.theme;
        previewCard.dataset.theme = state.theme;
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var toName = toNameEl.value.trim();
      var message = messageEl.value.trim();
      if (!toName || !message) {
        alert("Add their name and a message before creating the link.");
        return;
      }

      var photos = [];
      for (var i = 0; i < 3; i++) {
        if (state.images[i]) {
          var captionEl = document.getElementById("caption" + i);
          var caption = captionEl ? captionEl.value.trim() : "";
          var entry = { u: state.images[i] };
          if (caption) entry.c = caption;
          photos.push(entry);
        }
      }

      var payload = {
        t: toName,
        f: fromNameEl.value.trim(),
        m: message,
        th: state.theme,
        p: photos
      };

      var json = JSON.stringify(payload);
      var compressed = LZString.compressToEncodedURIComponent(json);
      var baseUrl = location.origin + location.pathname;
      var fullUrl = baseUrl + "#" + compressed;
      currentWishTitle = "A birthday wish for " + toName;

      wishLinkInput.value = fullUrl;
      previewLink.href = fullUrl;
      linkOutput.hidden = false;
      linkRow.hidden = true;
      toggleLinkBtn.textContent = "Show full link";
      shareBtn.hidden = !(navigator.share);
      lengthWarning.hidden = fullUrl.length <= LENGTH_WARNING_THRESHOLD;
      linkOutput.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    toggleLinkBtn.addEventListener("click", function () {
      linkRow.hidden = !linkRow.hidden;
      toggleLinkBtn.textContent = linkRow.hidden ? "Show full link" : "Hide link";
    });

    shareBtn.addEventListener("click", function () {
      navigator.share({ title: currentWishTitle, url: wishLinkInput.value }).catch(function () {});
    });

    copyBtn.addEventListener("click", function () {
      var text = wishLinkInput.value;
      function done() {
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = "Copy link to send"; }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });

    function fallbackCopy(text, done) {
      var temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand("copy"); done(); } catch (err) { /* no-op */ }
      document.body.removeChild(temp);
    }

    updatePreview();
  }

  // ---------- view mode ----------

  function tryDecodePayload() {
    var hash = location.hash.replace(/^#/, "");
    if (!hash) return null;
    try {
      var json = LZString.decompressFromEncodedURIComponent(hash);
      if (!json) return null;
      var data = JSON.parse(json);
      if (!data || typeof data.t !== "string" || typeof data.m !== "string") return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  var CANDLE_COUNT = 5;

  function renderWishView(data) {
    document.getElementById("composeView").hidden = true;
    document.getElementById("wishView").hidden = false;
    document.title = "Happy Birthday, " + data.t + "! 🎉";

    var photos = Array.isArray(data.p) ? data.p.filter(function (p) { return p && p.u; }) : [];

    setupIntroStep(data, photos);
    setupPhotoStep(photos);
    setupCakeStep();
    setupFinalStep(data, photos);
  }

  function goToStep(id) {
    ["stepIntro", "stepPhotos", "stepCake", "stepFinal"].forEach(function (stepId) {
      document.getElementById(stepId).hidden = stepId !== id;
    });
  }

  // Step 1: envelope opens to reveal the letter, then type "yes" to continue
  function setupIntroStep(data, photos) {
    document.getElementById("introHeadline").textContent = "Happy Birthday, " + data.t + "!";
    document.getElementById("introMessage").textContent = data.m;

    var envelopeBtn = document.getElementById("envelopeBtn");
    var envelopeHint = document.getElementById("envelopeHint");
    var letterCard = document.getElementById("letterCard");
    var yesGate = document.getElementById("yesGate");

    envelopeBtn.addEventListener("click", function () {
      envelopeBtn.classList.add("open");
      envelopeHint.hidden = true;
      letterCard.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { letterCard.classList.add("show"); });
      });
      setTimeout(function () {
        yesGate.hidden = false;
        document.getElementById("yesInput").focus();
      }, 700);
    });

    var form = yesGate;
    var input = document.getElementById("yesInput");
    var hint = document.getElementById("yesHint");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value.trim().toLowerCase() === "yes") {
        hint.hidden = true;
        if (photos.length > 0) {
          goToStep("stepPhotos");
        } else {
          goToStep("stepCake");
        }
      } else {
        hint.hidden = false;
        input.focus();
      }
    });
  }

  // Step 2: photos one at a time, each with its own caption
  function setupPhotoStep(photos) {
    if (photos.length === 0) return;

    var stageImg = document.getElementById("stagePhoto");
    var stageCaption = document.getElementById("stageCaption");
    var dotsEl = document.getElementById("stageDots");
    var nextBtn = document.getElementById("photoNextBtn");
    var index = 0;

    dotsEl.innerHTML = photos.map(function (_, i) {
      return '<span class="stage-dot' + (i === 0 ? " active" : "") + '"></span>';
    }).join("");

    function render() {
      stageImg.src = photos[index].u;
      stageCaption.textContent = photos[index].c || "";
      stageCaption.hidden = !photos[index].c;
      Array.prototype.forEach.call(dotsEl.children, function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
      nextBtn.textContent = index === photos.length - 1 ? "Continue" : "Next photo";
    }

    nextBtn.addEventListener("click", function () {
      if (index < photos.length - 1) {
        index += 1;
        render();
      } else {
        goToStep("stepCake");
      }
    });

    render();
  }

  // Step 3: blow out the candles by clicking each flame
  function setupCakeStep() {
    var row = document.getElementById("candleRow");
    var instruction = document.getElementById("cakeInstruction");
    var sparkleLayer = document.getElementById("cakeSparkles");
    row.innerHTML = "";
    sparkleLayer.innerHTML = "";
    instruction.textContent = "Blow out every candle";
    var remaining = CANDLE_COUNT;

    var sparkleEmoji = ["✨", "⭐", "💫"];
    for (var s = 0; s < 6; s++) {
      var sparkle = document.createElement("span");
      sparkle.className = "sparkle";
      sparkle.textContent = sparkleEmoji[s % sparkleEmoji.length];
      sparkle.style.left = (8 + Math.random() * 84) + "%";
      sparkle.style.top = (Math.random() * 70) + "%";
      sparkle.style.animationDelay = (Math.random() * 2) + "s";
      sparkleLayer.appendChild(sparkle);
    }

    for (var i = 0; i < CANDLE_COUNT; i++) {
      var candle = document.createElement("button");
      candle.type = "button";
      candle.className = "candle";
      candle.setAttribute("aria-label", "Blow out candle " + (i + 1));
      candle.innerHTML = '<span class="flame"></span>';
      candle.addEventListener("click", function () {
        if (this.classList.contains("out")) return;
        this.classList.add("out");
        remaining -= 1;
        if (remaining > 0) {
          instruction.textContent = remaining === 1 ? "One more to go!" : "Keep going!";
        } else {
          instruction.textContent = "Yay! Make a wish! 🎉";
          fireConfetti({ x: 0.5, y: 0.55 }, 500);
          setTimeout(function () {
            goToStep("stepFinal");
            fireConfetti();
          }, 900);
        }
      });
      row.appendChild(candle);
    }
  }

  // Step 4: the final card
  function setupFinalStep(data, photos) {
    var card = document.getElementById("wishCard");
    card.dataset.theme = data.th || "pink";

    document.getElementById("wishHeadline").textContent = "Happy Birthday, " + data.t + "!";
    document.getElementById("wishMessage").textContent = data.m;

    var fromEl = document.getElementById("wishFrom");
    if (data.f) {
      fromEl.textContent = "— " + data.f;
      fromEl.hidden = false;
    }

    var images = photos.map(function (p) { return p.u; }).concat([null, null, null]).slice(0, 3);
    document.getElementById("wishPolaroids").innerHTML = buildPolaroidsHtml(images);

    document.getElementById("makeYourOwn").addEventListener("click", function (e) {
      e.preventDefault();
      location.hash = "";
      location.reload();
    });
  }

  function fireConfetti(singleOrigin, singleDuration) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof confetti !== "function") return;
    var colors = ["#ff6f91", "#ffc857", "#3aafa9"];

    if (singleOrigin) {
      var end2 = Date.now() + (singleDuration || 500);
      (function burst() {
        confetti({ particleCount: 6, spread: 70, startVelocity: 28, origin: singleOrigin, colors: colors });
        if (Date.now() < end2) requestAnimationFrame(burst);
      })();
      return;
    }

    var duration = 1600;
    var end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  // ---------- boot ----------

  document.addEventListener("DOMContentLoaded", function () {
    startFloatingDecor();
    var data = tryDecodePayload();
    if (data) {
      renderWishView(data);
    } else {
      initCompose();
    }

    document.getElementById("brandLink").addEventListener("click", function (e) {
      if (location.hash) {
        e.preventDefault();
        location.hash = "";
        location.reload();
      }
    });
  });
})();
