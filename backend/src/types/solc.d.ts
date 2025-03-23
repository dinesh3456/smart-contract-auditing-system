declare module "solc" {
  function compile(input: string): string;
  function loadRemoteVersion(
    version: string,
    callback: (err: Error | null, solc: any) => void
  ): void;
  function setupMethods(solcjs: any): void;
  export = solc;
}
