import re

file_path = "/Users/karthikeyan/Documents/driver-admin/vDrive-admin/src/pages/TripTransactions.tsx"

with open(file_path, "r") as f:
    content = f.read()

replacements = [
    # Top level Search
    (r'bg-white/80', r'bg-white/80 dark:bg-slate-900/80'),
    (r'bg-white rounded-\[2rem\] border border-gray-100', r'bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700'),
    (r'!bg-gray-50 !border-none !text-gray-700 !font-bold !text-base placeholder:text-gray-300 focus:!bg-white focus:!shadow-inner', 
     r'!bg-gray-50 dark:!bg-slate-900 !border-none !text-gray-700 dark:!text-slate-100 !font-bold !text-base placeholder:text-gray-300 dark:placeholder:text-slate-500 focus:!bg-white dark:focus:!bg-slate-800 focus:!shadow-inner'),
    
    # Text colors
    (r'text-gray-400', r'text-gray-400 dark:text-slate-500'),
    (r'text-gray-800', r'text-gray-800 dark:text-slate-200'),
    (r'text-gray-700', r'text-gray-700 dark:text-slate-200'),
    (r'text-gray-300', r'text-gray-300 dark:text-slate-500'),
    (r'text-gray-500', r'text-gray-500 dark:text-slate-400'),
    (r'text-slate-400', r'text-slate-400 dark:text-slate-500'),
    (r'text-slate-500', r'text-slate-500 dark:text-slate-400'),
    (r'text-slate-700', r'text-slate-700 dark:text-slate-200'),
    
    # Error states
    (r'bg-rose-50 border border-rose-100', r'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20'),
    
    # Summary Card
    (r'bg-white rounded-\[2.5rem\] border border-gray-200', r'bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-200 dark:border-slate-700'),
    (r'border-b border-gray-200 bg-gray-50/30', r'border-b border-gray-200 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/50'),
    (r'bg-slate-100 text-slate-500 px-2.5 py-1 rounded font-mono font-bold tracking-tighter border border-slate-200', 
     r'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded font-mono font-bold tracking-tighter border border-slate-200 dark:border-slate-600'),
    (r'bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded font-bold uppercase tracking-widest border border-indigo-100', 
     r'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/30'),
    
    # Avatar Wrapper
    (r'bg-white border border-gray-200', r'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700'),
    (r'border-r border-gray-100', r'border-r border-gray-100 dark:border-slate-700'),
    (r'border-2 border-white', r'border-2 border-white dark:border-slate-800'),
    (r'bg-gray-100', r'bg-gray-100 dark:bg-slate-700'),
    
    # Activity Timeline
    (r'bg-gray-50/20', r'bg-gray-50/20 dark:bg-slate-900/20'),
    (r'bg-slate-200', r'bg-slate-200 dark:bg-slate-700'),
    (r'border-4 border-white', r'border-4 border-white dark:border-slate-800'),
    
    # Timeline Events Mapping
    (r'bg: "bg-indigo-50"', r'bg: "bg-indigo-50 dark:bg-indigo-500/10"'),
    (r'bg: "bg-blue-50"', r'bg: "bg-blue-50 dark:bg-blue-500/10"'),
    (r'bg: "bg-emerald-50"', r'bg: "bg-emerald-50 dark:bg-emerald-500/10"'),
    (r'bg: "bg-rose-50"', r'bg: "bg-rose-50 dark:bg-rose-500/10"'),
    (r'bg: "bg-slate-50"', r'bg: "bg-slate-50 dark:bg-slate-800"'),
    
    # Timeline Card
    (r'bg-gray-50/50 rounded-\[2rem\] border border-gray-200 p-6 sm:p-8 hover:bg-white hover:shadow-xl', 
     r'bg-gray-50/50 dark:bg-slate-800/50 rounded-[2rem] border border-gray-200 dark:border-slate-700 p-6 sm:p-8 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl'),
    (r'bg-emerald-50 text-emerald-600 border-emerald-100', r'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/30'),
    (r'bg-rose-50 text-rose-600 border-rose-100', r'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/30'),
    
    # Notes & Snapshots
    (r'bg-white rounded-2xl border border-gray-100', r'bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'),
    (r'bg-white p-4 rounded-2xl border border-gray-100', r'bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700'),
    (r'border-r border-gray-50', r'border-r border-gray-50 dark:border-slate-700'),
    (r'bg-emerald-50 flex items-center justify-center text-emerald-600', r'bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400'),
    (r'bg-rose-50 flex items-center justify-center text-rose-600', r'bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400'),
    
    # Field Mutation Audit
    (r'border-t border-gray-100', r'border-t border-gray-100 dark:border-slate-700'),
    (r'bg-white/50 p-3 rounded-xl border border-gray-100/50 hover:bg-white', r'bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'),
    (r'bg-slate-50 text-slate-400 px-2 py-1', r'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 px-2 py-1'),
    (r'bg-indigo-50 text-indigo-700 px-2 py-1', r'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-1'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(file_path, "w") as f:
    f.write(content)

print("Trip Transactions dark mode updated")
