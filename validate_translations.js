const fs = require('fs');
const tsPath = 'artifacts/mobile/locales/dictionary.ts';
const content = fs.readFileSync(tsPath, 'utf8');

const locales = ['en', 'hi', 'hinglish'];
const dictionaries = {};

for (const loc of locales) {
  const regex = new RegExp('(?:\"|\')?' + loc + '(?:\"|\')?:\\s*\\{([\\s\\S]*?)\\}(?:,\\n\\s*[a-z]+:|\\n\\s*\\};)', 'm');
  const match = content.match(regex);
  if (match) {
    const keys = [...match[1].matchAll(/\"([^\"]+)\"\\s*:/g)].map(m => m[1]);
    dictionaries[loc] = keys;
  } else {
    console.log('Failed to match', loc);
  }
}

const enKeys = dictionaries['en'] || [];
const hiKeys = dictionaries['hi'] || [];
const hinglishKeys = dictionaries['hinglish'] || [];

const missingHi = enKeys.filter(k => !hiKeys.includes(k));
const missingHinglish = enKeys.filter(k => !hinglishKeys.includes(k));

console.log('Total EN keys:', enKeys.length);
console.log('Total HI keys:', hiKeys.length);
console.log('Total HINGLISH keys:', hinglishKeys.length);

if (missingHi.length > 0) {
  console.log('Missing in Hindi:', missingHi);
}
if (missingHinglish.length > 0) {
  console.log('Missing in Hinglish:', missingHinglish);
}
