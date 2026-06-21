import json
import re

file_path = 'c:/Users/Admin/Downloads/RozgaarSetu/artifacts/mobile/locales/dictionary.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

en_keys = {
    'Work From Home': 'Work From Home',
    'Verified Employer': 'Verified Employer',
    'Contract': 'Contract',
    '1 Year': '1 Year',
    '2 Years': '2 Years',
    '3+ Years': '3+ Years',
    'Rohini': 'Rohini',
    'Jahangirpuri': 'Jahangirpuri',
    'Pitampura': 'Pitampura',
    'Delhi NCR': 'Delhi NCR',
    'Azadpur': 'Azadpur',
    'Mukherjee Nagar': 'Mukherjee Nagar',
    'Model Town': 'Model Town',
    'GTB Nagar': 'GTB Nagar',
    'Ashok Vihar': 'Ashok Vihar',
    'Shalimar Bagh': 'Shalimar Bagh',
    'Get matched with local jobs based on your skills and experience': 'Get matched with local jobs based on your skills and experience',
}

hi_keys = {
    'Work From Home': 'घर से काम',
    'Verified Employer': 'सत्यापित नियोक्ता',
    'Contract': 'अनुबंध',
    '1 Year': '1 वर्ष',
    '2 Years': '2 वर्ष',
    '3+ Years': '3+ वर्ष',
    'Rohini': 'रोहिणी',
    'Jahangirpuri': 'जहांगीरपुरी',
    'Pitampura': 'पीतमपुरा',
    'Delhi NCR': 'दिल्ली एनसीआर',
    'Azadpur': 'आज़ादपुर',
    'Mukherjee Nagar': 'मुखर्जी नगर',
    'Model Town': 'मॉडल टाउन',
    'GTB Nagar': 'जीटीबी नगर',
    'Ashok Vihar': 'अशोक विहार',
    'Shalimar Bagh': 'शालीमार बाग',
    'Get matched with local jobs based on your skills and experience': 'अपने कौशल और अनुभव के आधार पर स्थानीय नौकरियां प्राप्त करें',
}

hinglish_keys = {
    'Work From Home': 'Work From Home',
    'Verified Employer': 'Verified Employer',
    'Contract': 'Contract',
    '1 Year': '1 Year',
    '2 Years': '2 Years',
    '3+ Years': '3+ Years',
    'Rohini': 'Rohini',
    'Jahangirpuri': 'Jahangirpuri',
    'Pitampura': 'Pitampura',
    'Delhi NCR': 'Delhi NCR',
    'Azadpur': 'Azadpur',
    'Mukherjee Nagar': 'Mukherjee Nagar',
    'Model Town': 'Model Town',
    'GTB Nagar': 'GTB Nagar',
    'Ashok Vihar': 'Ashok Vihar',
    'Shalimar Bagh': 'Shalimar Bagh',
    'Get matched with local jobs based on your skills and experience': 'Apne skills aur experience ke hisaab se local jobs payein',
}

en_block_end = content.find('  hi: {')
if en_block_end != -1:
    insert_pos = content.rfind('  },', 0, en_block_end)
    new_en_str = ''
    for k, v in en_keys.items():
        new_en_str += f'    \"{k}\": \"{v}\",\n'
    content = content[:insert_pos] + new_en_str + content[insert_pos:]

hi_block_end = content.find('  hinglish: {')
if hi_block_end != -1:
    insert_pos = content.rfind('  },', 0, hi_block_end)
    new_hi_str = ''
    for k, v in hi_keys.items():
        new_hi_str += f'    \"{k}\": \"{v}\",\n'
    content = content[:insert_pos] + new_hi_str + content[insert_pos:]

hinglish_block_end = content.rfind('  },')
if hinglish_block_end != -1:
    insert_pos = content.rfind('  },', 0, hinglish_block_end)
    new_hinglish_str = ''
    for k, v in hinglish_keys.items():
        new_hinglish_str += f'    \"{k}\": \"{v}\",\n'
    content = content[:insert_pos] + new_hinglish_str + content[insert_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
