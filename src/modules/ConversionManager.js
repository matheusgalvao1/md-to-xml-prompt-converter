export class ConversionManager {
  constructor() {
    this.converters = new Map();
    this.activeId = null;
    this.lastDiagnostics = null;
  }

  registerConverter(converter) {
    if (!converter || typeof converter.convert !== "function") {
      throw new Error("Converter must expose a convert(input) function.");
    }

    if (!converter.id) {
      throw new Error("Converter must include a unique id.");
    }

    this.converters.set(converter.id, converter);

    if (!this.activeId) {
      this.activeId = converter.id;
    }
  }

  listConverters() {
    return Array.from(this.converters.values());
  }

  getActiveConverter() {
    return this.converters.get(this.activeId) || null;
  }

  setActiveConverter(id) {
    if (!this.converters.has(id)) {
      throw new Error(`Converter "${id}" is not registered.`);
    }

    this.activeId = id;
  }

  convert(input, options = {}) {
    const active = this.getActiveConverter();

    if (!active) {
      return {
        output: "",
        diagnostics: {
          messages: ["No converter selected."],
        },
      };
    }

    try {
      const result = active.convert(input, options);
      this.lastDiagnostics = result?.diagnostics || null;

      return {
        output: result?.output ?? "",
        diagnostics: {
          ...result?.diagnostics,
          strategy: active.label ?? active.id,
        },
      };
    } catch (error) {
      const fallback = {
        output: "",
        diagnostics: {
          strategy: active.label ?? active.id,
          messages: [
            "Conversion failed. Check the input or select another strategy.",
            error.message,
          ].filter(Boolean),
        },
        error,
      };

      this.lastDiagnostics = fallback.diagnostics;
      return fallback;
    }
  }
}

