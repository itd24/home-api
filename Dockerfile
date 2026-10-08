# ============================================================
# Base: Node.js 22 on Debian (bookworm) — slim variant
# We start from the official Node image so that yarn/npm/node
# work exactly like the plain node:22 image you were using
# before, while we then layer a full TeX Live installation on
# top.
# ============================================================
FROM node:22-bookworm-slim

# ── System dependencies ──────────────────────────────────────
# wget / xz-utils / perl  → needed by the TeX Live installer
# git                     → clone AltaCV
# fontconfig              → font discovery for XeTeX
# ca-certificates         → HTTPS for tlmgr / git
# curl                    → convenience / health-checks
# python3                 → latexmk runs a Perl script, some
#                           LaTeX tools shell out to Python
# fontforge + lcdf-typetools → required by simple-icons-latex
#                              to regenerate the font bindings
# nodejs is already in the base image; we still need npm for
# the simple-icons-latex binding generator
RUN apt-get update && apt-get install -y --no-install-recommends \
        wget \
        xz-utils \
        perl \
        git \
        curl \
        ca-certificates \
        fontconfig \
        python3 \
        fontforge \
        lcdf-typetools \
        make \
        libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

# ── Install TeX Live (full, via the official TUG installer) ──
# We use the network installer so we always pull the most
# current release from CTAN.  A "scheme-full" installation
# gives us *every* package, including fontawesome5, simpleicons,
# paracol, latexmk, xetex, etc. — nothing missing.
#
# Profile flags:
#   selected_scheme  scheme-full   → all collections
#   instopt_letter   0             → default paper = A4
#   tlpdbopt_install_docfiles 0    → skip docs (saves ~1 GB)
#   tlpdbopt_install_srcfiles 0    → skip sources (saves ~500 MB)
#
# The installer is downloaded fresh so the TeX Live *year* is
# always the latest available (2024, 2025 …).
ENV PATH="/usr/local/texlive/bin/x86_64-linux:${PATH}"

RUN wget -qO /tmp/install-tl-unx.tar.gz \
        https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz \
    && mkdir /tmp/install-tl \
    && tar -xzf /tmp/install-tl-unx.tar.gz -C /tmp/install-tl --strip-components=1 \
    && printf '%s\n' \
        'selected_scheme scheme-full' \
        'instopt_adjustpath 0' \
        'instopt_adjustrepo 1' \
        'instopt_letter 0' \
        'instopt_portable 0' \
        'instopt_write18_restricted 1' \
        'tlpdbopt_autobackup 0' \
        'tlpdbopt_backupdir tlpkg/backups' \
        'tlpdbopt_create_formats 1' \
        'tlpdbopt_desktop_integration 0' \
        'tlpdbopt_file_assocs 0' \
        'tlpdbopt_generate_updmap 0' \
        'tlpdbopt_install_docfiles 0' \
        'tlpdbopt_install_srcfiles 0' \
        'tlpdbopt_post_code 1' \
        'tlpdbopt_sys_bin /usr/local/bin' \
        'tlpdbopt_sys_info /usr/local/share/info' \
        'tlpdbopt_sys_man /usr/local/share/man' \
        'tlpdbopt_w32_multi_user 0' \
        > /tmp/install-tl/texlive.profile \
    && /tmp/install-tl/install-tl \
        --profile=/tmp/install-tl/texlive.profile \
        --no-interaction \
    && rm -rf /tmp/install-tl /tmp/install-tl-unx.tar.gz

# Add TeX Live binaries to PATH permanently (also handles arm64
# machines — the installer puts binaries under the arch name).
# We do a glob-friendly symlink so the PATH above always works.
RUN TEXBIN=$(ls /usr/local/texlive/*/bin/ | head -1 | xargs -I{} dirname {}) || true; \
    ARCH_BIN=$(ls -d /usr/local/texlive/*/bin/*/ 2>/dev/null | head -1); \
    if [ -n "$ARCH_BIN" ] && [ ! -e /usr/local/texlive/bin/x86_64-linux ]; then \
        mkdir -p /usr/local/texlive/bin && \
        ln -s "$ARCH_BIN" /usr/local/texlive/bin/x86_64-linux; \
    fi

# ── Update tlmgr & all packages to latest ────────────────────
RUN tlmgr update --self --all --no-auto-install

# ── Explicitly ensure the packages AltaCV needs ──────────────
# Most are already in scheme-full, but we pin them explicitly
# so that future slim-scheme variants of this image still work.
RUN tlmgr install \
        fontawesome5 \
        simpleicons \
        paracol \
        latexmk \
        xetex \
        lualatex-math \
        ifxetex \
        ifluatex \
        geometry \
        hyperref \
        xcolor \
        enumitem \
        tikz \
        pgf \
        microtype \
        etoolbox \
        changepage \
        biblatex \
        biber \
        academicons \
        roboto \
        lato \
        fontspec \
        unicode-math \
        xstring \
        calc \
        graphicx \
        eso-pic \
        dashrule \
        multirow \
        tabularx \
        accsupp \
        pdfx \
        xmpincl \
        colorprofiles \
    || true
# (The `|| true` prevents a build failure when a package is
#  already present in scheme-full.)

RUN tlmgr install lato roboto \
    && mktexlsr \
    && updmap-sys \
    && fc-cache -fv

RUN ln -s /usr/local/texlive/2026/texmf-dist/fonts/opentype /usr/local/share/fonts/texlive-opentype \
    && ln -s /usr/local/texlive/2026/texmf-dist/fonts/truetype /usr/local/share/fonts/texlive-truetype \
    && fc-cache -fv

# ── Install AltaCV ───────────────────────────────────────────
# Clone the official repository into the *local* texmf tree so
# that LaTeX finds altacv.cls automatically without requiring
# the .cls file to be in the same directory as document.tex.
RUN mkdir -p /usr/local/share/texmf/tex/latex/altacv \
    && git clone --depth=1 \
        https://github.com/liantze/AltaCV.git \
        /usr/local/share/texmf/tex/latex/altacv \
    && mktexlsr

# ── Rebuild font maps & caches ───────────────────────────────
RUN updmap-sys \
    && mktexlsr \
    && fc-cache -fv

# ── Smoke-test: verify key commands are on PATH ──────────────
RUN xelatex --version \
    && latexmk --version \
    && node --version \
    && yarn --version

# ── Working directory (NestJS source is mounted as a volume) ──
WORKDIR /app

# Default shell (docker-compose overrides with its `command:`)
CMD ["/bin/bash"]