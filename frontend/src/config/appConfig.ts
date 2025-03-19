interface AppConfig {
  apiUrl: string;
  isDevelopment: boolean;
  version: string;
  appName: string;
}

// Using a more compatible approach for environment variables
const getEnvVariable = (key: string, defaultValue: string = ""): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  // Use a type assertion to avoid TypeScript error
  if (typeof import.meta !== "undefined") {
    // This tells TypeScript to trust us that import.meta has an env property
    const env = (import.meta as any).env;
    if (env && env[key]) {
      return env[key] as string;
    }
  }

  return defaultValue;
};

const isDevelopment = (): boolean => {
  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV === "development";
  }

  // Use a type assertion to avoid TypeScript error
  if (typeof import.meta !== "undefined") {
    const env = (import.meta as any).env;
    if (env) {
      return env.DEV === true;
    }
  }

  return false;
};

const config: AppConfig = {
  apiUrl: getEnvVariable("VITE_API_URL", "http://localhost:5000/api"),
  isDevelopment: isDevelopment(),
  version: getEnvVariable("VITE_APP_VERSION", "1.0.0"),
  appName: "Smart Contract Auditing System",
};

export default config;
