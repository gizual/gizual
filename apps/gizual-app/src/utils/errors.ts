export class NoVmError extends Error {
  constructor(componentName: string) {
    super(`Constructing a ${componentName} without a ViewModel is not allowed.`);
  }
}
