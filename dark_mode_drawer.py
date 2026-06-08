import re

file_path = "/Users/karthikeyan/Documents/driver-admin/vDrive-admin/src/pages/RechargePlan.tsx"

with open(file_path, "r") as f:
    content = f.read()

replacements = [
    (r"bg-slate-100 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-300 transition-colors", r"bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"),
    (r"bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-600 transition-colors", r"bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded text-indigo-600 dark:text-indigo-400 transition-colors"),
    (r"bg-slate-100 px-2 py-1 rounded hover:bg-slate-200", r"bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"),
    (r"bg-slate-50/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700", r"bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700"),
    (r"bg-slate-50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none", r"bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none"),
    (r"p-2 text-slate-300 hover:text-rose-500 transition-colors", r"p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors"),
    (r"bg-slate-50 rounded-lg border border-dashed border-slate-200 dark:border-slate-600", r"bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-600"),
    (r"backgroundColor: '#ffffff'", r"/* backgroundColor: '#ffffff' removed for dark mode compat */"),
    (r"bg-white dark:bg-slate-800 p-4 h-24 ml-8", r"bg-slate-50 dark:bg-slate-800/50 p-4 h-24 ml-8 border border-slate-100 dark:border-slate-700 rounded-xl"),
    (r"bg-white dark:bg-slate-800 z-10", r"bg-white dark:bg-slate-800 z-10 shadow-sm"),
    (r"bg-slate-100 text-slate-600 dark:text-slate-300 text-\[10px\] font-bold", r"bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold")
]

for old, new in replacements:
    content = content.replace(old, new)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement successful")
