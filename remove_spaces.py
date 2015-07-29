import os
import shutil

input_dir = '/data/ken/datasets/msra-cfw/annochecked'
output_dir = '/data/ken/datasets/msra-cfw/annochecked_nospaces'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for subdir in os.listdir(input_dir):
    src_path = os.path.join(input_dir, subdir)
    dest_path = os.path.join(output_dir, subdir.replace(' ','_'))

    if not os.path.isdir(src_path):
        continue
    print 'Copying %s...' % subdir

    shutil.copytree(src_path, dest_path)
