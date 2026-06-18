import re

with open("/Users/karthikeyan/Documents/driver-admin/vDrive-admin/src/pages/RechargePlan.tsx", "r") as f:
    lines = f.readlines()

in_sub = False
for i, line in enumerate(lines):
    if 'activeTab === "subscriptions"' in line:
        in_sub = True
    if in_sub:
        # Check for unhandled colors
        matches = re.findall(r'\bbg-white\b(?! dark:)', line)
        if matches:
            print(f"L{i+1}: missing dark for bg-white: {line.strip()}")
            
        matches = re.findall(r'\btext-gray-[5-9]00\b(?! dark:)', line)
        if matches:
            print(f"L{i+1}: missing dark for text-gray: {line.strip()}")

        matches = re.findall(r'\btext-slate-[5-9]00\b(?! dark:)', line)
        if matches:
            print(f"L{i+1}: missing dark for text-slate: {line.strip()}")
            
        matches = re.findall(r'\bborder-gray-[1-4]00\b(?! dark:)', line)
        if matches:
            print(f"L{i+1}: missing dark for border-gray: {line.strip()}")

        matches = re.findall(r'\bborder-slate-[1-4]00\b(?! dark:)', line)
        if matches:
            print(f"L{i+1}: missing dark for border-slate: {line.strip()}")

    # End of the subscriptions area
    if in_sub and 'activeTab === "promotions"' in line:
        in_sub = False

