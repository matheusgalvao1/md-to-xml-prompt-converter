import { ConversionManager } from "./modules/ConversionManager.js";
import { availableConverters } from "./converters/index.js";

const DEFAULT_MARKDOWN = `# ROLE

You are a helpful assistant

__CONTRAINTS__
- Do not do x
- When y do:
  1. First step
  2. Second step

# PERSONALITY
## Tone
Be polite

# EXAMPLE
\`\`\`python
print("Hey")
\`\`\`
`;

const elements = {
  markdownInput: document.getElementById("markdownInput"),
  xmlOutput: document.getElementById("xmlOutput"),
  strategySelect: document.getElementById("strategySelect"),
  resetButton: document.getElementById("resetButton"),
  copyButton: document.getElementById("copyButton"),
  helpGuideContent: document.getElementById("helpGuideContent"),
};

const editors = {
  markdown: null,
  xml: null,
};

const manager = new ConversionManager();
availableConverters.forEach((converter) => manager.registerConverter(converter));

const populateStrategies = () => {
  const converters = manager.listConverters();
  elements.strategySelect.innerHTML = converters
    .map(
      (converter) => `<option value="${converter.id}">
        ${converter.label ?? converter.id}
      </option>`
    )
    .join("");

  elements.strategySelect.value = manager.getActiveConverter()?.id ?? "";
  updateGuide();
};

const guideCache = new Map();

const updateGuide = async () => {
  if (!elements.helpGuideContent) return;
  const active = manager.getActiveConverter();
  
  if (!active?.guidePath) {
    elements.helpGuideContent.innerHTML =
      "<p>No conversion rules available for this strategy.</p>";
    return;
  }

  // Resolve path relative to converter directory
  // Convert ID like "matheus.v1" to directory name "matheusV1"
  const dirName = active.id
    .split(".")
    .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const converterDir = `src/converters/${dirName}/`;
  const guideUrl = active.guidePath.startsWith("./")
    ? `${converterDir}${active.guidePath.slice(2)}`
    : active.guidePath;

  // Check cache first
  if (guideCache.has(guideUrl)) {
    elements.helpGuideContent.innerHTML = guideCache.get(guideUrl);
    return;
  }

  // Show loading state
  elements.helpGuideContent.innerHTML = "<p>Loading conversion rules...</p>";

  try {
    const response = await fetch(guideUrl);
    if (!response.ok) {
      throw new Error(`Failed to load guide: ${response.statusText}`);
    }
    const html = await response.text();
    guideCache.set(guideUrl, html);
    elements.helpGuideContent.innerHTML = html;
  } catch (error) {
    elements.helpGuideContent.innerHTML =
      "<p>Unable to load conversion rules for this strategy.</p>";
  }
};

const convertAndRender = () => {
  if (!editors.markdown || !editors.xml) return;
  const { output } = manager.convert(editors.markdown.getValue());
  const scroll = editors.xml.getScrollInfo();
  editors.xml.setValue(output);
  editors.xml.scrollTo(scroll.left, scroll.top);
};

const initializeEditors = () => {
  editors.markdown = CodeMirror.fromTextArea(elements.markdownInput, {
    mode: "markdown",
    lineNumbers: true,
    lineWrapping: true,
    theme: "neo",
  });

  editors.xml = CodeMirror.fromTextArea(elements.xmlOutput, {
    mode: "application/xml",
    lineNumbers: true,
    readOnly: true,
    theme: "neo",
  });
};

const setupInteractions = () => {
  editors.markdown.setValue(DEFAULT_MARKDOWN);
  editors.markdown.on("change", () => {
    convertAndRender();
  });

  elements.strategySelect.addEventListener("change", (event) => {
    manager.setActiveConverter(event.target.value);
    updateGuide();
    convertAndRender();
  });

  elements.resetButton.addEventListener("click", () => {
    editors.markdown.setValue(DEFAULT_MARKDOWN);
    convertAndRender();
  });

  elements.copyButton.addEventListener("click", async () => {
    if (!navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(editors.xml.getValue());
    } catch (error) {
      // Silently fail if clipboard access is denied
    }
  });
};

populateStrategies();
initializeEditors();
setupInteractions();
convertAndRender();

