

    $ node download.js    # download images from info.txt obtained from cfw webpage
    $ node verify.js      # verify all downloaded images, and produce verified.txt index file

** Use face detector to produce directory `extracted/`
** Manually verify to produce directory `annochecked/`

    $ python remove_spaces.py  # ensure all directory names don't contain spaces
    $ python split.js          # produce train/val splits
    $ ./gen_lmdb.sh            # (optional) generate caffe lmdb if required + image mean
