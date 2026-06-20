const ts = require('typescript');
const fs = require('fs');
const content = fs.readFileSync('artifacts/mobile/locales/dictionary.ts', 'utf8');
const result = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.CommonJS }});
fs.writeFileSync('temp_dict.js', result.outputText);
const { DICTIONARY } = require('./temp_dict.js');

const enKeys = Object.keys(DICTIONARY.en);
const hiKeys = Object.keys(DICTIONARY.hi);
const hinglishKeys = Object.keys(DICTIONARY.hinglish);

const missingHi = enKeys.filter(k => !hiKeys.includes(k));
const missingHinglish = enKeys.filter(k => !hinglishKeys.includes(k));

console.log('Total EN keys:', enKeys.length);
console.log('Total HI keys:', hiKeys.length);
console.log('Total HINGLISH keys:', hinglishKeys.length);
console.log('Missing in Hindi:', missingHi);
console.log('Missing in Hinglish:', missingHinglish);
