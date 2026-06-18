import re

file_path = "/Users/karthikeyan/Documents/driver-admin/vDrive-admin/src/pages/DriverReconciliation.tsx"

with open(file_path, "r") as f:
    content = f.read()

replacements = [
    (r'Card size="small" className="rounded-xl border border-slate-100 shadow-sm', r'Card size="small" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm'),
    (r'text-slate-900 tracking-tight leading-none', r'text-slate-900 dark:text-slate-100 tracking-tight leading-none'),
    (r'bg-indigo-50 text-indigo-500', r'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'),
    (r'border-indigo-100/50"', r'border-indigo-100/50 dark:border-indigo-500/20"'),
    (r'bg-emerald-50 text-emerald-500', r'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'),
    (r'border-emerald-100/50"', r'border-emerald-100/50 dark:border-emerald-500/20"'),
    (r'bg-amber-50 text-amber-500', r'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400'),
    (r'border-amber-100/50"', r'border-amber-100/50 dark:border-amber-500/20"'),
    (r'bg-white rounded-3xl border border-slate-100 shadow-sm', r'bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm'),
    (r'"bg-slate-50/50 hover:bg-indigo-50/30 transition-colors"', r'"bg-slate-50/50 dark:bg-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-slate-700/50 transition-colors"'),
    (r'"bg-white hover:bg-indigo-50/30 transition-colors"', r'"bg-white dark:bg-slate-800 hover:bg-indigo-50/30 dark:hover:bg-slate-700/50 transition-colors"'),
    (r'text-slate-700', r'text-slate-700 dark:text-slate-200'),
    (r'text-slate-600', r'text-slate-600 dark:text-slate-300'),
    (r'text-slate-500', r'text-slate-500 dark:text-slate-400'),
    (r'text-slate-400', r'text-slate-400 dark:text-slate-500'),
    (r'border-indigo-200"', r'border-indigo-200 dark:border-indigo-500/30"'),
    (r'bg-indigo-200/60', r'bg-indigo-200/60 dark:bg-indigo-500/30')
]

for old, new in replacements:
    content = content.replace(old, new)

# Append dark mode CSS block
css_to_add = """
        .dark .premium-table .ant-table-thead > tr > th {
          background: #1e293b;
          color: #94a3b8;
          border-bottom: 2px solid #334155;
        }
        .dark .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155;
        }
        .dark .premium-table .ant-table-wrapper .ant-table-pagination.ant-pagination {
          color: #cbd5e1;
        }
        .dark .premium-table .ant-table-cell-row-hover {
          background: transparent !important;
        }
"""
if ".dark .premium-table" not in content:
    content = content.replace("      `}</style>", f"{css_to_add}      `}}</style>")

with open(file_path, "w") as f:
    f.write(content)

print("Driver Outreach dark mode updated")
