import fs from 'fs';

const b64 = fs.readFileSync('public/icon.png').toString('base64');
const content = `// Default embedded application logo (base64 Data URI)
// This guarantees instantaneous rendering at 0ms on startup without any network or disk latency
export const DEFAULT_APP_LOGO = 'data:image/png;base64,${b64}';
`;

fs.writeFileSync('defaultLogo.ts', content, 'utf-8');
console.log('defaultLogo.ts created successfully!');
