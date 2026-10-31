import { unstable_ClassNameGenerator } from "@mui/material/className";

unstable_ClassNameGenerator.configure((componentName) => `tc-${componentName}`);
