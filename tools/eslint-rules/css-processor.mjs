/** Wraps stylesheet source as a JavaScript string so architecture rules can inspect its contents. */
export const cssProcessor = {
  preprocess(source) {
    return [`const stylesheetSource = ${JSON.stringify(source)}; void stylesheetSource;`];
  },
  postprocess(messageLists) {
    return messageLists.flat();
  },
  supportsAutofix: false,
};
