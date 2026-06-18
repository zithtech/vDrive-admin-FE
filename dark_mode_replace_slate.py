import re

file_path = "/Users/karthikeyan/Documents/driver-admin/vDrive-admin/src/pages/RechargePlan.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace border-slate-200 with dark:border-slate-600
content = re.sub(r'\bborder-slate-200\b(?! dark:border-)', 'border-slate-200 dark:border-slate-600', content)
content = re.sub(r'\bborder-slate-100\b(?! dark:border-)', 'border-slate-100 dark:border-slate-700', content)
content = re.sub(r'\bborder-slate-50\b(?! dark:border-)', 'border-slate-50 dark:border-slate-800', content)

# Text slate
content = re.sub(r'\btext-slate-900\b(?! dark:text-)', 'text-slate-900 dark:text-slate-100', content)
content = re.sub(r'\btext-slate-800\b(?! dark:text-)', 'text-slate-800 dark:text-slate-200', content)
content = re.sub(r'\btext-slate-700\b(?! dark:text-)', 'text-slate-700 dark:text-slate-300', content)
content = re.sub(r'\btext-slate-600\b(?! dark:text-)', 'text-slate-600 dark:text-slate-300', content)
content = re.sub(r'\btext-slate-500\b(?! dark:text-)', 'text-slate-500 dark:text-slate-400', content)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement successful")
