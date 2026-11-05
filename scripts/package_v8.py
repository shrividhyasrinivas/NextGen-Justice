import os
import zipfile

output_filename = "NextGen_Justice_V8_FINAL.zip"

excluded_dirs = {
    'node_modules', '.git', 'dist', '.cache', '__pycache__', 'uploads'
}

excluded_files = {
    output_filename, '.DS_Store'
}

print(f"Creating {output_filename}...")
count = 0
with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Exclude directories in-place
        dirs[:] = [d for d in dirs if d not in excluded_dirs and not d.startswith('.git')]
        
        for file in files:
            if file in excluded_files or file.endswith('.zip'):
                continue
            file_path = os.path.join(root, file)
            # Relative archive path with normalized forward slashes
            rel_path = os.path.relpath(file_path, '.').replace('\\', '/')
            if rel_path.startswith('./'):
                rel_path = rel_path[2:]
            zipf.write(file_path, rel_path)
            count += 1

file_size_mb = os.path.getsize(output_filename) / (1024 * 1024)
print(f"Successfully packaged {count} files into {output_filename} ({file_size_mb:.2f} MB)")
