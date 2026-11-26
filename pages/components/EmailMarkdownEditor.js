import { useEffect, useId, useRef, useState } from "react";
import useLanguage from "hooks/useLanguage";
import { emailUrl } from "models/emailMarkdown.js";

const COPY = {
  pt: {
    hint: "Markdown: títulos, listas, links, imagens e GIFs",
    bold: "Negrito",
    italic: "Itálico",
    heading: "Título",
    list: "Lista",
    numbered: "Lista numerada",
    quote: "Citação",
    code: "Código",
    link: "Inserir link",
    image: "Imagem / GIF",
    upload: "Enviar arquivo",
    uploading: "Enviando arquivo…",
    insert: "Inserir",
    cancel: "Cancelar",
    url: "Endereço público",
    label: "Texto do link",
    alt: "Descrição da imagem",
    choose: "Escolher imagem ou GIF",
    sample: "texto",
    sampleTitle: "Título",
    sampleItem: "Item da lista",
    help: "Guia de Markdown",
    limits:
      "PNG, JPG, WebP e GIF de até 3 MB. As imagens ficam públicas para aparecer no email. Alguns leitores exibem só o primeiro quadro do GIF.",
    invalid:
      "Use um endereço HTTP ou HTTPS válido para imagens; links também aceitam mailto: e tel:.",
    uploadError: "Não foi possível enviar o arquivo. Tente novamente.",
    sizeError: "Escolha uma imagem PNG, JPG, WebP ou GIF de até 3 MB.",
    lengthError: "A mensagem pode ter até 12.000 caracteres.",
    guide:
      "# Título\n\n**negrito**, *itálico*, ~~riscado~~ e `código`\n\n- Item\n  - Subitem\n\n1. Primeiro\n2. Segundo\n\n> Citação\n\n[Texto do link](https://exemplo.com)\n![Descrição](https://exemplo.com/imagem.gif)\n\n| Projeto | Novidade |\n| --- | --- |\n| Grão | Nova versão |\n\n---\n\n```\nBloco de código\n```\n\nOlá, {{username}}! Versão: {{tag}}",
  },
  en: {
    hint: "Markdown: headings, lists, links, images and GIFs",
    bold: "Bold",
    italic: "Italic",
    heading: "Heading",
    list: "List",
    numbered: "Numbered list",
    quote: "Quote",
    code: "Code",
    link: "Insert link",
    image: "Image / GIF",
    upload: "Upload file",
    uploading: "Uploading file…",
    insert: "Insert",
    cancel: "Cancel",
    url: "Public URL",
    label: "Link text",
    alt: "Image description",
    choose: "Choose an image or GIF",
    sample: "text",
    sampleTitle: "Heading",
    sampleItem: "List item",
    help: "Markdown guide",
    limits:
      "PNG, JPG, WebP and GIF up to 3 MB. Images are public so they can appear in emails. Some readers only display the first GIF frame.",
    invalid:
      "Use a valid HTTP or HTTPS address for images; links also accept mailto: and tel:.",
    uploadError: "Could not upload the file. Please try again.",
    sizeError: "Choose a PNG, JPG, WebP or GIF up to 3 MB.",
    lengthError: "The message can contain up to 12,000 characters.",
    guide:
      "# Heading\n\n**bold**, *italic*, ~~strikethrough~~ and `code`\n\n- Item\n  - Nested item\n\n1. First\n2. Second\n\n> Quote\n\n[Link text](https://example.com)\n![Description](https://example.com/image.gif)\n\n| Project | News |\n| --- | --- |\n| Grão | New version |\n\n---\n\n```\nCode block\n```\n\nHello, {{username}}! Version: {{tag}}",
  },
};
const escapeLabel = (value) =>
  String(value)
    .replace(/[\\[\]*_`]/g, "\\$&")
    .replace(/[\r\n]+/g, " ");

export default function EmailMarkdownEditor({
  value,
  onChange,
  disabled,
  fullPage,
  placeholder,
  onUploadingChange,
}) {
  const { language, t } = useLanguage();
  const copy = COPY[language] || COPY.pt;
  const id = useId();
  const textarea = useRef(null);
  const fileInput = useRef(null);
  const selection = useRef({ start: 0, end: 0 });
  const controller = useRef(null);
  const liveValue = useRef(value);
  liveValue.current = value;
  const [panel, setPanel] = useState(null);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => controller.current?.abort(), []);

  function rememberSelection() {
    const input = textarea.current;
    selection.current = {
      start: input?.selectionStart ?? value.length,
      end: input?.selectionEnd ?? value.length,
    };
  }
  function insert(
    text,
    { block = false, selectStart = 0, selectEnd = text.length } = {},
  ) {
    const { start, end } = selection.current;
    const current = liveValue.current;
    const prefix =
      block && start > 0 && !current.slice(0, start).endsWith("\n\n")
        ? "\n\n"
        : "";
    const suffix = block ? "\n\n" : "";
    const next =
      current.slice(0, start) + prefix + text + suffix + current.slice(end);
    if (next.length > 12000) {
      setError(copy.lengthError);
      return false;
    }
    onChange(next);
    setError("");
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(
        start + prefix.length + selectStart,
        start + prefix.length + selectEnd,
      );
    });
    return true;
  }
  function format(before, after = "", sample = copy.sample, block = false) {
    rememberSelection();
    const selected =
      value.slice(selection.current.start, selection.current.end) || sample;
    insert(before + selected + after, {
      block,
      selectStart: before.length,
      selectEnd: before.length + selected.length,
    });
  }
  function openPanel(kind) {
    rememberSelection();
    setLabel(value.slice(selection.current.start, selection.current.end));
    setUrl("");
    setError("");
    setPanel(kind);
  }
  function insertUrl(event) {
    event.preventDefault();
    const normalized = emailUrl(
      url.trim(),
      window.location.origin,
      panel === "image",
    );
    if (!normalized) {
      setError(copy.invalid);
      return;
    }
    const caption = escapeLabel(
      label.trim() || (panel === "image" ? copy.alt : normalized),
    );
    const address = normalized.replace(/[()<>]/g, (c) =>
      encodeURIComponent(c).replace(/\(/g, "%28").replace(/\)/g, "%29"),
    );
    if (
      insert(`${panel === "image" ? "!" : ""}[${caption}](${address})`, {
        block: panel === "image",
      })
    )
      setPanel(null);
  }
  async function uploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      file.size > 3_000_000 ||
      !/^image\/(png|jpeg|webp|gif)$/.test(file.type)
    ) {
      setError(copy.sizeError);
      return;
    }
    setUploading(true);
    onUploadingChange?.(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    try {
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error(copy.uploadError));
        reader.readAsDataURL(file);
      });
      if (abort.signal.aborted) return;
      const response = await fetch("/api/v1/releases/media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abort.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || copy.uploadError);
      if (abort.signal.aborted) return;
      insert(
        `![${escapeLabel(file.name.replace(/\.[^.]+$/, ""))}](${result.url})`,
        { block: true },
      );
    } catch (cause) {
      if (!abort.signal.aborted) setError(cause.message || copy.uploadError);
    } finally {
      if (!abort.signal.aborted) {
        setUploading(false);
        onUploadingChange?.(false);
      }
    }
  }
  const buttonClass =
    "rounded-full border border-zinc-700 bg-black px-2.5 py-1 text-xs text-zinc-200 cursor-pointer hover:border-white hover:text-white disabled:opacity-40 disabled:cursor-not-allowed";
  const controls = [
    ["B", copy.bold, () => format("**", "**")],
    ["I", copy.italic, () => format("*", "*")],
    ["H", copy.heading, () => format("## ", "", copy.sampleTitle, true)],
    ["•", copy.list, () => format("- ", "", copy.sampleItem, true)],
    ["1.", copy.numbered, () => format("1. ", "", copy.sampleItem, true)],
    [">", copy.quote, () => format("> ", "", copy.sample, true)],
    ["</>", copy.code, () => format("`", "`")],
    ["Link", copy.link, () => openPanel("link")],
    [copy.image, copy.image, () => openPanel("image")],
  ];
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-wider text-zinc-400"
        >
          {t("Mensagem")}
        </label>
        <span className="text-xs text-zinc-500">{copy.hint}</span>
      </div>
      <div
        role="group"
        aria-label={copy.hint}
        className="flex flex-wrap gap-1.5"
      >
        {controls.map(([text, title, action]) => (
          <button
            key={title}
            type="button"
            title={title}
            aria-label={title}
            className={buttonClass}
            disabled={disabled || uploading}
            onMouseDown={(event) => event.preventDefault()}
            onClick={action}
          >
            {text}
          </button>
        ))}
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || uploading}
          onClick={() => {
            rememberSelection();
            fileInput.current?.click();
          }}
        >
          {uploading ? copy.uploading : copy.upload}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          aria-label={copy.choose}
          onChange={uploadFile}
          disabled={disabled || uploading}
        />
      </div>
      {panel && (
        <form
          onSubmit={insertUrl}
          className="flex flex-col gap-2 border border-zinc-700 bg-zinc-950 p-3"
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            {panel === "image" ? copy.alt : copy.label}
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="win-input text-sm"
              disabled={disabled}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            {copy.url}
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              className="win-input text-sm"
              disabled={disabled}
              required
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass} disabled={disabled}>
              {copy.insert}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => setPanel(null)}
            >
              {copy.cancel}
            </button>
          </div>
        </form>
      )}
      <textarea
        ref={textarea}
        id={id}
        rows={fullPage ? 10 : 6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || uploading}
        maxLength={12000}
        placeholder={placeholder}
        className={`win-input text-sm leading-relaxed resize-y ${fullPage ? "min-h-[12rem]" : "min-h-[8rem]"}`}
      />
      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
      {uploading && (
        <p role="status" className="text-xs text-zinc-300">
          {copy.uploading}
        </p>
      )}
      <details className="text-xs text-zinc-400">
        <summary className="cursor-pointer w-fit hover:text-white">
          {copy.help}
        </summary>
        <p className="my-2 leading-relaxed">{copy.limits}</p>
        <pre className="whitespace-pre-wrap break-words border border-zinc-800 bg-zinc-950 p-3 text-zinc-300 leading-relaxed">
          {copy.guide}
        </pre>
      </details>
    </div>
  );
}
