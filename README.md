# nichijou

This is my personal site and blog.

## tech

- Site framework: [Hugo](https://gohugo.io/)
- Theme: [Terminal Theme](https://github.com/panr/hugo-theme-terminal)
- Inspiration: @wilsonehusin's https://husin.dev/

## deploys

- [Vercel](https://vercel.com/)'s hobby plan

## images

Setup: `brew install imagemagick`

```sh
FILENAME=
INPUT_FILE=~/Downloads/${FILENAME}
OUTPUT_FILE=$(pwd)/static/img/$(dirname "${FILENAME}")/$(basename "${FILENAME}" | cut -d. -f1).webp
mkdir -p $(dirname "${OUTPUT_FILE}")
magick "${INPUT_FILE}" -quality 50 -resize 800x800 -strip -define webp:lossless=true "${OUTPUT_FILE}"
```
