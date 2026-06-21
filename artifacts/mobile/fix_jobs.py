import re

with open('app/(tabs)/jobs.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'(const isPaused = status === "paused";\n)',
    r'\1  const { t } = useTranslation();\n',
    content
)

content = content.replace(
    '<Text style={empCardStyles.meta}>{job.location} · {job.salary}</Text>',
    '<Text style={empCardStyles.meta}>{t(job.location)} · {job.salary}</Text>'
)

content = re.sub(
    r'<Text style=\{\[styles\.quickFilterText, quickFilter === chip && styles\.quickFilterTextActive\]\}>\s*\{chip\}\s*</Text>',
    r'<Text style={[styles.quickFilterText, quickFilter === chip && styles.quickFilterTextActive]}>\n                {t(chip)}\n              </Text>',
    content
)

with open('app/(tabs)/jobs.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed jobs.tsx")
