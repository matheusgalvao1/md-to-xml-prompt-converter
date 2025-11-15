export class ConversionPipeline {
  constructor(steps = []) {
    this.steps = Array.isArray(steps) ? steps : [];
  }

  use(step) {
    if (typeof step !== "function") {
      throw new Error("Pipeline steps must be functions.");
    }

    return new ConversionPipeline([...this.steps, step]);
  }

  run(payload, context = {}) {
    return this.steps.reduce(
      (current, step) => step(current, context),
      payload
    );
  }
}

export const createPipeline = (...steps) => new ConversionPipeline(steps);

