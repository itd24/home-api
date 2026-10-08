# storage

This folder is mounted into the API container as `/storage`. It holds the files that the
LaTeX module needs when it renders documents:

- `altacv/` is the [AltaCV](https://github.com/liantze/AltaCV) class and its assets (LPPL
  licensed)
- `SimpleIcons.otf` is the Simple Icons font used in the CV (CC0 licensed)

`signature.png` is **not** committed (see `.gitignore`). Add your own image with that file
name here if the LaTeX template should include a signature.

