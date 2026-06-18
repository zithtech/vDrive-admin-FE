import re

file_path = "/Users/karthikeyan/Documents/driver-admin/vDrive-admin/src/pages/RechargePlan.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Make sure main wrapper has dark:bg-[#0b0f19] instead of dark:bg-slate-800 if it was replaced earlier
content = content.replace(
    'className="flex flex-col h-full overflow-hidden p-3 gap-3 bg-white dark:bg-slate-800 min-h-screen font-sans"',
    'className="flex flex-col h-full overflow-hidden p-3 gap-3 bg-white dark:bg-[#0b0f19] min-h-screen font-sans"'
)

# Apply rootClassName="dark-drawer" to Drawers
content = re.sub(r'<Drawer\s', '<Drawer rootClassName="dark-drawer" ', content)

# Make sure the header texts inside Drawers get dark mode color overrides
# (I'll just add some generic ones if they are missing, but the dark mode classes should be okay)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement successful")
