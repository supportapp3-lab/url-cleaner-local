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
  const errorMessages = new Map([
    ["Enter an HTTP or HTTPS URL.", "http:// または https:// から始まるURLを入れてください。"],
    ["The URL contains whitespace or control characters. Remove them or encode spaces first.", "URLに空白や改行が含まれています。取り除いてから試してください。"],
    ["Enter a complete, valid HTTP or HTTPS URL.", "URLを読み取れませんでした。http:// または https:// から始まるURLを確認してください。"],
    ["Only HTTP and HTTPS URLs are supported.", "http:// または https:// から始まるURLに対応しています。"],
    ["The URL query could not be safely identified.", "URLの情報を区別できませんでした。元のURLを確認してください。"]
  ]);

  document.querySelector("#try-sample").addEventListener("click", () => {
    input.value = "https://example.com/articles/123?utm_source=mail&utm_campaign=autumn&ref=guide#heading";
    form.requestSubmit();
  });

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
      count.textContent = cleaned.removedParameters.length
        ? `削除した情報は${cleaned.removedParameters.length}件です。以下に名前を表示します。`
        : "削除対象の情報はありませんでした。入力したURLをそのまま表示しています。";
      for (const name of cleaned.removedParameters) {
        const item = document.createElement("li");
        item.textContent = name;
        list.append(item);
      }
      result.hidden = false;
      status.textContent = "URLを整理しました。結果を確認してからコピーしてください。";
      status.className = "success";
    } catch (error) {
      status.textContent = errorMessages.get(error.message) || "URLを整理できませんでした。入力内容を確認してください。";
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
      status.textContent = "URLをコピーしました。";
      status.className = "success";
    } catch {
      output.focus();
      output.select();
      status.textContent = "URLを選択しました。コピー操作を行ってください（Windowsなら Ctrl+C、Macなら ⌘C）。";
      status.className = "";
    }
  });
})();
