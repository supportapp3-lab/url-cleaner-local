(function () {
  "use strict";

  const form = document.querySelector("#clean-form");
  const input = document.querySelector("#url-input");
  const result = document.querySelector("#result");
  const output = document.querySelector("#cleaned-url");
  const status = document.querySelector("#status");
  const count = document.querySelector("#removed-count");
  const list = document.querySelector("#removed-list");
  const copyButton = document.querySelector("#copy-button");

  function clearResult() {
    result.hidden = true;
    output.value = "";
    count.textContent = "";
    list.replaceChildren();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult();
    status.className = "";

    try {
      const cleaned = UrlCleanerCore.cleanUrl(input.value);
      output.value = cleaned.cleanedUrl;
      count.textContent = `${cleaned.removedParameters.length} tracking parameter${cleaned.removedParameters.length === 1 ? "" : "s"} removed.`;
      for (const name of cleaned.removedParameters) {
        const item = document.createElement("li");
        item.textContent = name;
        list.append(item);
      }
      result.hidden = false;
      status.textContent = "URL cleaned locally.";
      status.className = "success";
    } catch (error) {
      status.textContent = error.message;
      status.className = "error";
    }
  });

  copyButton.addEventListener("click", async () => {
    if (result.hidden || output.value === "") return;
    status.className = "";
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard access is unavailable.");
      }
      await navigator.clipboard.writeText(output.value);
      status.textContent = "Copied to clipboard.";
      status.className = "success";
    } catch {
      output.focus();
      output.select();
      status.textContent = "The cleaned URL is selected. Copy it with your keyboard shortcut.";
      status.className = "";
    }
  });
})();
