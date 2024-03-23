import { action, computed, makeObservable, observable } from "mobx";

import { SearchQueryType } from "@giz/query";
import { Validator } from "@giz/query/validator";

export class QueryViewModel {
  @observable private _editorContent = "";
  @observable private _validationOutput: string[] = [];

  constructor() {
    makeObservable(this, undefined, { autoBind: true });
  }

  @action
  setEditorContent(content: string) {
    this._editorContent = content;
  }

  @action
  setValidationOutput(output: string[]) {
    this._validationOutput = output;
  }

  @computed
  get validatedQuery():
    | { isValid: true; query: SearchQueryType }
    | { isValid: false; query: undefined } {
    const result = Validator.validate(this._editorContent);

    if (result === undefined) return { isValid: false, query: undefined };
    return { isValid: true, query: result };
  }

  @computed
  get contentHasErrors() {
    return this._validationOutput.length > 0;
  }

  get editorContent() {
    return this._editorContent;
  }

  get validationOutput() {
    return this._validationOutput;
  }

  @action
  handleEditorValidation(markers: any) {
    let validationOutput: string[] = [];
    for (const marker of markers)
      validationOutput = [...validationOutput, marker.message as string];

    this.setValidationOutput(validationOutput);
  }
}
