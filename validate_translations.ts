import { DICTIONARY } from './artifacts/mobile/locales/dictionary';

const enKeys = Object.keys(DICTIONARY.en);
const hiKeys = Object.keys(DICTIONARY.hi);
const hinglishKeys = Object.keys(DICTIONARY.hinglish);

const missingHi = enKeys.filter(k => !hiKeys.includes(k));
const missingHinglish = enKeys.filter(k => !hinglishKeys.includes(k));

console.log('Total EN keys:', enKeys.length);
console.log('Total HI keys:', hiKeys.length);
console.log('Total HINGLISH keys:', hinglishKeys.length);

if (missingHi.length > 0) {
  console.log('Missing in Hindi:');
  console.log(JSON.stringify(missingHi, null, 2));
} else {
  console.log('No missing keys in Hindi!');
}

if (missingHinglish.length > 0) {
  console.log('Missing in Hinglish:');
  console.log(JSON.stringify(missingHinglish, null, 2));
} else {
  console.log('No missing keys in Hinglish!');
}
