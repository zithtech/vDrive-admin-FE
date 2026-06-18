import re

file_path = "/Users/karthikeyan/Documents/driver-admin/vDrive-admin/src/pages/RechargePlan.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace bg-white
# Be careful not to replace it if dark:bg-something is already there
content = re.sub(r'\bbg-white\b(?! dark:bg-)', 'bg-white dark:bg-slate-800', content)

# Text colors
content = re.sub(r'\btext-gray-900\b(?! dark:text-)', 'text-gray-900 dark:text-slate-100', content)
content = re.sub(r'\btext-gray-800\b(?! dark:text-)', 'text-gray-800 dark:text-slate-200', content)
content = re.sub(r'\btext-gray-600\b(?! dark:text-)', 'text-gray-600 dark:text-slate-300', content)
content = re.sub(r'\btext-gray-500\b(?! dark:text-)', 'text-gray-500 dark:text-slate-400', content)
content = re.sub(r'\btext-gray-400\b(?! dark:text-)', 'text-gray-400 dark:text-slate-500', content)
content = re.sub(r'\btext-gray-300\b(?! dark:text-)', 'text-gray-300 dark:text-slate-500', content)
content = re.sub(r'text-\[\#111827\]\b(?! dark:text-)', 'text-[#111827] dark:text-slate-100', content)

# Border colors
content = re.sub(r'\bborder-gray-50\b(?! dark:border-)', 'border-gray-50 dark:border-slate-800', content)
content = re.sub(r'\bborder-gray-100\b(?! dark:border-)', 'border-gray-100 dark:border-slate-700', content)
content = re.sub(r'\bborder-gray-200\b(?! dark:border-)', 'border-gray-200 dark:border-slate-600', content)
content = re.sub(r'\bborder-gray-300\b(?! dark:border-)', 'border-gray-300 dark:border-slate-500', content)

# Specific background changes
content = re.sub(r'\bbg-gray-50\b(?! dark:bg-)', 'bg-gray-50 dark:bg-slate-700', content)
content = re.sub(r'\bbg-gray-100\b(?! dark:bg-)', 'bg-gray-100 dark:bg-slate-600', content)
content = re.sub(r'\bhover:bg-gray-50\b(?! dark:hover:bg-)', 'hover:bg-gray-50 dark:hover:bg-slate-700', content)
content = re.sub(r'\bhover:bg-gray-100\b(?! dark:hover:bg-)', 'hover:bg-gray-100 dark:hover:bg-slate-600', content)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement successful")
